# Conjunction Search

> **2026 Update by Prerna (DRDO Internship):**
> - Complete frontend redesign with dark space-themed sidebar
> - New `/details` API route with risk classification and UTC datetimes
> - CSV export and object type filter added
> - Upgraded CesiumJS from v1.71 to v1.144
> - Fixed Docker path bug for local development
>
> See the main [README](../README.md) for full details.

---

## Introduction

Once we have predictions on where ASOs in LEO are going to be in the future
using the [orbit prediction package](../orbit_prediction/README.md), we need
a way to quickly perform spatial-temporal search over the prediction space to
determine if objects may come too close to each other.

This package provides:

- A [module](conjunction_search/conjunction_search.py) using
  [k-d trees](https://en.wikipedia.org/wiki/K-d_tree) to quickly perform
  spatial-temporal search:
  - What are the `k` ASOs that will come closest to the given ASO?
  - How many ASOs will come within radius `r` of the given ASO?
- A [library](conjunction_search/czml.py) for building
  [CZML](https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/CZML-Guide)
  documents to display predicted orbits in CesiumJS.
- A [Flask](https://flask.palletsprojects.com) API for serving CZML and
  JSON conjunction search results.
- A modern CesiumJS dashboard for querying and visualizing conjunctions.

---

## How to Run Locally (Windows)

```sh
# From the conjunction_search folder:
pip install flask flask-restful numpy pandas requests scikit-learn

$env:DEV = "true"
python -m conjunction_search.api
```

Open: **http://localhost:8080**

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/` | GET | Returns the main dashboard UI |
| `/conjunction_search/<aso_id>?k=5` | GET | Returns CZML for K nearest satellites |
| `/conjunction_search/<aso_id>?radius=100000` | GET | Returns CZML for satellites within radius |
| `/conjunction_search/<aso_id>/details?k=5` | GET | Returns JSON with names, distances, risk levels, UTC times |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DEV` | Set to `true` to use local sample data |
| `CESIUM_API_KEY` | Optional — Cesium Ion API key for 3D assets |

---

## Original IBM Documentation

The docker container can be built with:
```sh
make build
```

And run locally via:
```sh
make run
```

For IBM Cloud Object Storage setup, see `vars.env.example`.