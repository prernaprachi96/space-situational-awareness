# Space Situational Awareness (SSA) Dashboard

> **2026 Update:** This repository contains an improved frontend dashboard
> built during a DRDO research internship by Prerna (August 2026).
> See [My Contributions](#my-contributions-2026) below.

---

## What This Project Does

Low earth orbit (LEO) is a crowded place and the number of anthropogenic
space objects (ASOs) entering LEO is rapidly escalating. The heart of the
space situational awareness (SSA) problem is to predict where ASOs are and
where they are going — everything from a spec of paint to the International
Space Station.

This project provides an end-to-end pipeline to:

- ETL orbit data about ASOs in LEO from the USSTRATCOM Space Track API
- Make orbit predictions based on a physical model
- Train ML models to learn the error in physics-based orbit prediction models
- Perform spatial-temporal search of orbit predictions to identify conjunctions
- Visualize when and where conjunctions may occur on a 3D globe

---

## My Contributions (2026)

Built on top of IBM's original spacetech-ssa (2020), I made the following
improvements during my DRDO research internship:

| # | Improvement | File Changed |
|---|---|---|
| 1 | Fixed critical Docker path bug — now runs on any computer | `data_access.py` |
| 2 | Removed IBM Cloud dependencies for local development | `data_access.py` |
| 3 | Complete frontend redesign — dark space-themed sidebar dashboard | `index.html`, `index.css` |
| 4 | New Flask API route returning risk levels + real UTC datetimes | `api.py` |
| 5 | Color-coded risk panel (🔴 HIGH / 🟡 MEDIUM / 🟢 LOW) | `app.js` |
| 6 | Converted raw timestep numbers to real UTC conjunction datetimes | `api.py` |
| 7 | CSV export for all conjunction results | `app.js` |
| 8 | Object type filter (All / Debris Only / Active Satellites) | `index.html`, `app.js` |
| 9 | Upgraded CesiumJS from v1.71 (2020) to v1.144 (2026) | `index.html` |

---

## How to Run Locally (Windows)

### Prerequisites
- Python 3.x
- pip

### Steps

```sh
# 1. Navigate to the conjunction search folder
cd spacetech-ssa-master/conjunction_search

# 2. Install dependencies
pip install flask flask-restful numpy pandas requests scikit-learn

# 3. Set environment variable (Windows PowerShell)
$env:DEV = "true"

# 4. Run the server
python -m conjunction_search.api
```

Then open your browser at: **http://localhost:8080**

---

## Components

### Orbit Prediction
The [orbital prediction component](orbit_prediction/README.md) combines
physics and machine learning models to predict the future path of ASOs.

### Conjunction Search
The [conjunction search component](conjunction_search/README.md) combs
through future orbit predictions to determine when and where two ASOs
may come close to each other based on user provided search parameters.

---

## Tech Stack

| Component | Technology |
|---|---|
| Backend | Python 3, Flask, Flask-RESTful |
| Data Processing | Pandas, NumPy |
| Spatial Search | KD-Trees (scikit-learn) |
| 3D Visualization | CesiumJS 1.144 |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Orbit Data | IBM sample pickle file (Aug 2020) |

---

## Original Project
Built on top of IBM's open-source spacetech-ssa:
https://github.com/IBM/spacetech-ssa

## License
Licensed under the Apache 2.0 license.
Full license text available at [LICENSE](LICENSE).