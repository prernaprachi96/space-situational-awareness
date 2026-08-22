# Space Situational Awareness (SSA) Dashboard

## Overview & Core Features
This repository contains an enhanced, locally optimized version of the IBM `spacetech-ssa` tool. It predicts satellite orbits and monitors potential conjunctions (dangerous close encounters) between the 27,000+ tracked space objects to prevent Kessler Syndrome[cite: 2]. 

*   **Automated Risk Assessment:** Conjunctions are classified dynamically: HIGH (< 100 km), MEDIUM (100-500 km), and LOW (> 500 km)[cite: 2].
*   **Precision Timing:** Translates raw array timesteps into exact UTC datetimes using 10-minute interval calculations[cite: 2].
*   **Modernized Interface:** Features a dark space theme, split globe/sidebar layout, and parallel API data fetching via `Promise.all`[cite: 2].
*   **Operational Tools:** Includes client-side filtering (Active vs. Debris) and CSV export capabilities for record-keeping[cite: 2].
*   **Upgraded Engine:** Powered by CesiumJS 1.144 for modern 3D rendering[cite: 2].

## Technical Stack
*   **Backend:** Python 3, Flask, scikit-learn (KD-Trees), Pandas[cite: 2].
*   **Frontend:** HTML5, CSS3, Vanilla JS, CesiumJS[cite: 2].

## Local Setup
To run this project locally, clone the repository and install the backend dependencies. Because cloud storage dependencies have been removed for local execution, you must ensure your static `.pkl` and `.czml` data files are placed exactly in the `sample_data` directory relative to the application base path[cite: 2]. Start the application by executing the Flask server.
