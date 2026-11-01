# SSA Conjunction Search Dashboard
# By Prerna — DRDO Internship 2025

---

# PART 1: WHAT IS THE BIG PICTURE?

Right now, there are 27,000+ objects orbiting Earth — satellites,
rocket bodies, debris, dead satellites. They all travel at 7 km/second
(25,000 km/h). At that speed, even a 1cm piece of debris can destroy
a satellite worth billions of dollars.

The question SSA (Space Situational Awareness) tries to answer is:
"Which objects will come dangerously close to each other in the next few days?"
This is called finding conjunctions.

---

# PART 2: COMPLETE DATA FLOW

SPACE-TRACK.ORG (US Government satellite tracking)
        ↓  Provides TLE data (satellite position + velocity)
STEP 1: ETL — Download TLE data for all tracked satellites
        ↓
STEP 2: ORBIT PREDICTION — Use Kepler's equations to predict
        where each satellite will be every 10 minutes for 3 days
        ↓
STEP 3: ML ERROR CORRECTION (IBM's original, XGBoost)
        Correct physics prediction errors
        ↓
STEP 4: SAVE PREDICTIONS → orbit_preds.pickle
        ↓
STEP 5: CONJUNCTION SEARCH — Build KD-Trees, search close approaches
        ↓
STEP 6: FLASK API — Serve results as CZML + JSON
        ↓
STEP 7: CESIUMJS DASHBOARD — Show orbits on 3D globe, risk in sidebar

---

# PART 3: WHAT IS TLE DATA?

TLE = Two-Line Element Set. Standard format for satellite orbit.

Example for ISS:
  ISS (ZARYA)
  1 25544U 98067A   26234.00000000  .00002386  00000-0  41420-4 0  9990
  2 25544  51.6461 339.8014 0002571  34.5857 120.4689 15.48919393268649

Line 1: satellite number, classification, launch date, drag term
Line 2: inclination, RAAN, eccentricity, arg of perigee, mean anomaly, mean motion

Mean motion 15.489 = ISS orbits Earth 15.489 times per day.

---

# PART 4: HOW ORBIT PREDICTION WORKS

## IBM's Two-Body Keplerian Physics Model

Given satellite position NOW, physics tells us where it will be
using Newton's gravity: F = GMm/r²

My implementation in fetch_2026_data.py:

def propagate_orbit(line1, line2, start_dt, n_steps, step_minutes):
    GM = 3.986004418e14  # Earth's gravitational parameter (m³/s²)
    
    # Parse 6 orbital elements from TLE line 2:
    inclination, RAAN, eccentricity, arg_perigee, mean_anomaly, mean_motion
    
    # Semi-major axis (size of ellipse):
    n_rad = mean_motion × 2π / 86400  (convert rev/day to rad/s)
    a = (GM / n_rad²)^(1/3)
    
    For each 10-minute timestep:
        M = M₀ + n×t                     (mean anomaly at time t)
        Solve Kepler's equation:
            E - e×sin(E) = M             (Newton's method, 10 iterations)
        True anomaly:
            ν = 2×atan2(√(1+e)×sin(E/2), √(1-e)×cos(E/2))
        Distance from Earth center:
            r = a×(1 - e×cos(E))
        Position in orbital plane:
            x_orb = r×cos(ν)
            y_orb = r×sin(ν)
        Rotate to ECI (Earth-Centered Inertial) frame:
            3 rotation matrices using RAAN, inclination, arg_perigee
        Store [x, y, z] in meters

This gives 432 position points per satellite (3 days × 6 per hour).

## IBM's ML Error Correction

Real orbits differ from Keplerian due to:
- Atmospheric drag (thin air at 400km still slows satellites)
- J2 perturbation (Earth bulges at equator)
- Solar radiation pressure
- Moon/Sun gravity

IBM trained 6 XGBoost regressors, one per error dimension:
  physics_err_r_x, physics_err_r_y, physics_err_r_z (position errors)
  physics_err_v_x, physics_err_v_y, physics_err_v_z (velocity errors)

Training process:
  1. Get 30 days of historical TLE for each satellite
  2. Use physics model to predict positions at future timestamps
  3. Compare prediction vs actual: error = actual - predicted
  4. Train XGBoost to predict this error from:
     - elapsed_seconds (how far into future)
     - start position and velocity
     - physics predicted position
  5. Final = physics_prediction + ml_error_correction

Why I couldn't run IBM's pipeline:
  IBM used poliastro library (abandoned 2022).
  Incompatible with Python 3.13 — pip install fails completely.
  My solution: Implemented Keplerian propagator directly in Python.

---

# PART 5: THE PICKLE FILE STRUCTURE

Saved to: conjunction_search/sample_data/orbit_preds.pickle
Format: pandas DataFrame, one row per satellite

Columns:
  aso_id       string   "25544"        NORAD ID
  aso_name     string   "ISS (ZARYA)"  Human readable name
  pred_start_dt datetime 2026-08-23    When predictions start
  pred_end_dt  datetime 2026-08-26     When predictions end
  orbit_preds  ndarray  shape(432,3)   X,Y,Z positions in meters

orbit_preds example for ISS:
  [0]  = [6500000, 0, 3900000]       position at t=0 (meters)
  [1]  = [6498000, 150000, 3902000]  10 minutes later
  ...
  [431] = [...]                      3 days later

---

# PART 6: HOW CONJUNCTION SEARCH WORKS — KD-TREES

## Building the KD-Forest (conjunction_search.py)

def build_kd_forest(orbit_df):
    orbit_preds = np.stack(orbit_df.orbit_preds.values)
    # shape = (num_satellites, 432, 3)
    
    kd_forest = []
    for timestep in range(432):
        positions_at_t = orbit_preds[:, timestep, :]  # (num_sats, 3)
        tree = KDTree(positions_at_t)  # fast spatial index
        kd_forest.append(tree)
    
    return kd_forest  # 432 trees, one per time step

This organizes all satellite positions for ultra-fast searching.
Without KD-Tree: check all 10,000 satellites → slow.
With KD-Tree: only check nearby spatial regions → 100x faster.

## Searching (get_nns_for_object)

def get_nns_for_object(orbit_df, kd_forest, aso_id, k=1, radius=None):
    aso_idx = get row index of our satellite
    
    results = []
    for timestep, tree in enumerate(kd_forest):
        query_position = our_satellite.orbit_preds[timestep]  # x,y,z
        
        if radius:
            indices, distances = tree.query_radius(query_position, radius)
        else:
            distances, indices = tree.query(query_position, k=k+1)
        
        for idx, dist in zip(indices, distances):
            if idx != aso_idx:  # skip self
                results.append((other_aso_id, timestep, dist))
    
    return results
    # Example: [('44742', 46, 149503.2), ('25544', 83, 258600.0), ...]
    # Meaning: FLOCK 3P 16 will be 149km away at timestep 46

---

# PART 7: THE FLASK API (api.py)

Route 1: GET /
  Returns: HTML page with satellite dropdown
  Gets satellite list from orbit_df

Route 2: GET /conjunction_search/<aso_id>?k=5 or ?radius=100000
  Runs KD-Tree search
  Returns: CZML document (JSON format for CesiumJS 3D visualization)
  CZML contains x,y,z positions at each timestamp for animation

Route 3: GET /conjunction_search/<aso_id>/details (MY ADDITION)
  Runs same KD-Tree search
  Returns: JSON with human-readable data:
    {
      name: "FLOCK 3P 16",
      distance_km: 149.5,
      risk: "MEDIUM",
      time_str: "Aug 26 2026 03:42 UTC"
    }

Risk calculation (my logic):
  distance < 100 km  → HIGH RISK
  distance < 500 km  → MEDIUM RISK
  distance >= 500 km → LOW RISK

Timestep to datetime conversion (my addition):
  pred_start = orbit_df.iloc[0]['pred_start_dt']
  conjunction_time = pred_start + timedelta(minutes=10 × timestep)
  IBM showed "Timestep: 46" — I converted this to "Aug 26 2026 03:42 UTC"

---

# PART 8: CZML FORMAT

CesiumJS reads CZML to draw animated 3D orbits.

Example CZML for ISS:
{
  "id": "25544",
  "name": "ISS (ZARYA)",
  "position": {
    "referenceFrame": "INERTIAL",
    "cartesian": [
      0,      6500000, 0,      3900000,   ← t=0s:    x,y,z in meters
      600,    6498000, 150000, 3902000,   ← t=600s:  x,y,z
      1200,   6490000, 300000, 3905000,  ← t=1200s: x,y,z
      ...432 timesteps total...
    ]
  }
}

CesiumJS interpolates between these points to create smooth animation.

---

# PART 9: FRONTEND (MY REDESIGN)

## Layout
Before (IBM): floating white box over globe
After (mine): sidebar left | 3D globe right

HTML Structure:
  <div id="sidebar">
    <div id="sidebar-header">  "SSA · GROUND STATION" label
    <div id="sidebar-body">    satellite selector, sliders, filter, button
    <div id="results-panel">   detection results (MY ADDITION)
  </div>
  <div id="cesiumContainer"> 3D globe

## JavaScript (app.js) — When user clicks Run Search:

1. Build two URLs:
   czmlURL    = /conjunction_search/ID?radius=100000
   detailsURL = /conjunction_search/ID/details?radius=100000

2. Show loading spinner

3. Make BOTH requests simultaneously:
   Promise.all([
     CesiumJS loads CZML on globe,
     fetch(detailsURL) gets sidebar data
   ])

4. When both finish:
   - Hide spinner
   - For each satellite found:
     - Calculate risk color (red/yellow/green)
     - Create result card with name, distance, time
     - Add to sidebar list

## Object Filter
   isDebris = name includes 'DEB' or 'R/B'
   filter = 'debris' → show only debris
   filter = 'active' → show only active satellites
   filter = 'all'    → show everything

## CSV Export
   Build rows: [Satellite, Conjunction, Risk, Distance, Time]
   Create Blob → URL → trigger download

---

# PART 10: MY CUSTOM DATA PIPELINE (fetch_2026_data.py)

IBM's pipeline broken → I wrote my own.

Step 1: Login to Space-Track
  st = SpaceTrackClient(identity=email, password=password)

Step 2: Fetch TLE data via GP endpoint
  gp_data = st.gp(
    mean_motion='>11',     # LEO = >11 orbits/day
    eccentricity='<0.25',  # nearly circular
    limit=50,
    format='json'
  )
  Returns JSON with: OBJECT_NAME, NORAD_CAT_ID, TLE_LINE1, TLE_LINE2, etc.

Step 3: For each satellite, run propagate_orbit()
  → 432 position predictions (x,y,z in meters)

Step 4: Build DataFrame and save
  orbit_df = pd.DataFrame(records)
  orbit_df.to_pickle(OUTPUT_PATH)

Result: Fresh 2026 data replaces IBM's 2020 sample data.

---

# PART 11: COMPLETE LIST OF MY CHANGES

1. data_access.py
   - Fixed hardcoded '/app/sample_data/' path → pathlib relative path
   - Commented out ibm_boto3 imports (IBM Cloud SDK, not needed locally)

2. api.py
   - Added /conjunction_search/<id>/details route
   - Risk classification logic (HIGH/MEDIUM/LOW)
   - Timestep → UTC datetime conversion

3. templates/index.html
   - Complete rewrite: sidebar layout, filter dropdown, results panel
   - CesiumJS upgraded from 1.71 to 1.144

4. static/index.css
   - Complete rewrite: dark space theme, 200+ lines
   - Risk badge colors, spinner, export button styling

5. static/app.js
   - Complete rewrite: clean event listeners (no inline handlers)
   - Promise.all for parallel CZML + details requests
   - Object type filter logic
   - CSV export feature

6. fetch_2026_data.py (NEW FILE — MY CREATION)
   - Replaces IBM's broken poliastro-based pipeline
   - Fetches live TLE data from Space-Track.org
   - Custom Keplerian orbit propagator (pure Python)
   - Generates fresh orbit_preds.pickle

7. All README files updated to explain my contributions

---

# PART 12: INTERVIEW ANSWERS

Q: Tell me about this project
A: "I worked on IBM's open-source SSA pipeline for DRDO. It predicts
satellite orbits using Kepler's orbital mechanics and XGBoost ML error
correction, then finds dangerous close encounters using KD-Trees.
I fixed a deployment bug, redesigned the frontend dashboard with risk
classification and real UTC times, built a custom data pipeline to
replace IBM's broken poliastro-based ETL, and fetched live August 2026
satellite data from Space-Track.org."

Q: What is a conjunction?
A: "When two space objects come dangerously close in orbit. We classify
risk as HIGH (<100km), MEDIUM (100-500km), LOW (>500km) based on
predicted closest approach distance. The system predicts conjunctions
up to 3 days in advance by searching predicted orbit paths."

Q: How does the ML work?
A: "XGBoost corrects errors in Keplerian orbit predictions. Physics
models assume a perfect two-body system, but atmospheric drag, J2
perturbation, and solar radiation create errors that grow over time.
Six XGBoost regressors learn to predict these errors from historical
orbit data. Final prediction = physics + ML correction."

Q: What is a KD-Tree?
A: "A data structure for fast spatial search. We build one KD-Tree
per time step containing all satellite positions at that moment.
To find conjunctions, we query our satellite's position against
each tree — finding nearby satellites in milliseconds instead of
checking all satellites one by one."

Q: Why did you rewrite the data pipeline?
A: "IBM's pipeline used poliastro, abandoned since 2022, incompatible
with Python 3.13 due to invalid version specifiers in its metadata.
I implemented the same Keplerian propagator directly using Python's
math module — Kepler's equation, ECI rotation matrices — giving
equivalent results without any external dependencies."

---

# PART 13: KEY TERMS GLOSSARY

TLE      Two-Line Element — standard satellite orbit data format
LEO      Low Earth Orbit — 300 to 2000 km altitude
ASO      Anthropogenic Space Object — man-made space object
Conjunction  When two objects come dangerously close in orbit
KD-Tree  K-Dimensional Tree — fast spatial nearest-neighbor search
CZML     Cesium Language — JSON format for CesiumJS 3D animation
ECI      Earth-Centered Inertial — 3D coordinate system
SGP4     Simplified General Perturbations — standard orbit model
Mean motion  Orbits per day (ISS = ~15.5)
Eccentricity How elliptical an orbit is (0 = circle)
Inclination  Angle of orbit to Earth's equator
RAAN     Right Ascension of Ascending Node
XGBoost  Extreme Gradient Boosting — ML regression algorithm
Flask    Python web framework for APIs
Pickle   Python binary format for saving data
pathlib  Python library for cross-platform file paths
Space-Track US Space Force satellite tracking website
