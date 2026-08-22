# Space Situational Awareness (SSA) Dashboard - An enhanced Space Situational Awareness (SSA) dashboard that predicts satellite orbits, detects dangerous conjunctions, and visualizes collision risks in 3D to prevent Kessler Syndrome.


## Project Overview
This project monitors the 27,000+ tracked space objects to predict and identify conjunctions—dangerous close encounters in orbit[cite: 3, 4]. The pipeline consists of two main components:
*   **Orbit Prediction:** Fetches Two-Line Element (TLE) data, applies a physics model, and uses XGBoost machine learning to correct prediction errors.
*   **Conjunction Search:** Uses a KD-Tree spatial search to find close encounters efficiently and visualizes them on a 3D CesiumJS globe.

## Dashboard Enhancements
The frontend dashboard and API were significantly upgraded for local execution and operational utility:
*   **UI & Visualization:** Completely redesigned with a dark space theme, a split sidebar layout, and an upgraded CesiumJS 1.144 engine.
*   **Data Reliability:** Replaced hardcoded Docker paths with dynamic `pathlib` resolution and removed IBM Cloud dependencies for local stability[cite: 4].
*   **Analytics & Export:** Added a `/details` API route providing UTC datetimes and automated risk assessments (HIGH < 100km, MEDIUM 100-500km, LOW > 500km)[cite: 4].
*   **Operational Tools:** Implemented client-side filtering (Debris vs. Active) and a CSV export feature[cite: 4].

## Repository Structure
The codebase is divided into two primary pipelines[cite: 3]:
*   `orbit_prediction/`: Contains the ETL, physics model, and ML training scripts (`spacetrack_etl.py`, `ml_model.py`)[cite: 3].
*   `conjunction_search/`: Contains the Flask API (`api.py`), KD-Tree logic, and the frontend UI (`templates/index.html`)[cite: 3].
*   `sample_data/`: Stores the `orbit_preds.pickle` file required for visualization[cite: 3].

## Local Execution
To run the dashboard locally using the provided sample data:
*   Navigate to the dashboard directory: `cd conjunction_search`[cite: 3].
*   Install the required Python dependencies: `pip install -r requirements.txt`[cite: 3].
*   Navigate to the API folder and start the server: `cd conjunction_search` followed by `python api.py`[cite: 3].
