// SSA Conjunction Search Dashboard
// Modified from IBM spacetech-ssa by Prerna

// ── Initialize Cesium Viewer ──
var viewer = new Cesium.Viewer("cesiumContainer", {
  shouldAnimate: true,
});

// ── Get all the HTML elements we need ──
var asoSelect      = document.getElementById("asoSelect");
var knnSearch      = document.getElementById("knnSearch");
var radiusSearch   = document.getElementById("radiusSearch");
var selectKNN      = document.getElementById("selectKNN");
var selectRadius   = document.getElementById("selectRadius");
var numKNNs        = document.getElementById("numKNNs");
var numKNNsText    = document.getElementById("numKNNsText");
var radius         = document.getElementById("radius");
var radiusText     = document.getElementById("radiusText");
var searchBtn      = document.getElementById("searchBtn");
var loading        = document.getElementById("loading");
var errorMsg       = document.getElementById("error-msg");
var resultsPanel   = document.getElementById("results-panel");
var resultsList    = document.getElementById("results-list");

// ── Slider: update displayed number as user drags ──
numKNNs.addEventListener("input", function () {
  numKNNsText.textContent = this.value;
});

radius.addEventListener("input", function () {
  radiusText.textContent = Number(this.value).toLocaleString();
});

// ── Radio buttons: show/hide correct slider ──
knnSearch.addEventListener("change", function () {
  selectKNN.style.display    = "block";
  selectRadius.style.display = "none";
});

radiusSearch.addEventListener("change", function () {
  selectKNN.style.display    = "none";
  selectRadius.style.display = "block";
});

// ── Build the query string ──
function buildQueryString() {
  if (knnSearch.checked) {
    return "k=" + numKNNs.value;
  } else {
    return "radius=" + radius.value;
  }
}

// ── Risk level helper ──
function getRiskClass(distanceKm) {
  if (distanceKm < 100)  return "risk-high";
  if (distanceKm < 500)  return "risk-medium";
  return "risk-low";
}

function getRiskLabel(distanceKm) {
  if (distanceKm < 100)  return "HIGH RISK";
  if (distanceKm < 500)  return "MEDIUM RISK";
  return "LOW RISK";
}

// ── Search Button ──
searchBtn.addEventListener("click", function () {

  var asoId       = asoSelect.value;
  var queryString = buildQueryString();

  // URLs for both requests
  var czmlURL    = "/conjunction_search/" + asoId + "?" + queryString;
  var detailsURL = "/conjunction_search/" + asoId + "/details?" + queryString;

  // Show loading state
  searchBtn.disabled         = true;
  loading.style.display      = "flex";
  errorMsg.style.display     = "none";
  resultsPanel.style.display = "none";
  resultsList.innerHTML      = "";
  viewer.dataSources.removeAll();

  // ── Request 1: Load orbits on globe ──
  var czmlPromise = viewer.dataSources.add(
    Cesium.CzmlDataSource.load(czmlURL)
  );

  // ── Request 2: Load details for sidebar ──
  var detailsPromise = fetch(detailsURL)
    .then(function (res) { return res.json(); });

  // ── Wait for BOTH to finish ──
  Promise.all([czmlPromise, detailsPromise])
    .then(function (results) {
      var details = results[1];

      // Hide loading, re-enable button
      loading.style.display  = "none";
      searchBtn.disabled     = false;

      // Show results panel
      resultsPanel.style.display = "flex";

      // No results found
      if (details.length === 0) {
        resultsList.innerHTML = `
          <li class="result-item">
            <span class="result-name">No conjunctions found</span>
            <span class="result-distance">Try increasing the radius</span>
          </li>`;
        return;
      }

      // Build a result card for each satellite
      details.forEach(function (sat, index) {
        var riskClass = getRiskClass(sat.distance_km);
        var riskLabel = getRiskLabel(sat.distance_km);

        var li = document.createElement("li");
        li.className = "result-item";
        li.innerHTML = `
          <div class="result-risk ${riskClass}">${riskLabel}</div>
          <span class="result-name">${sat.name}</span>
          <span class="result-distance">
            Distance: ${sat.distance_km.toLocaleString()} km
          </span>
          <span class="result-distance">
            Timestep: ${sat.timestep}
          </span>
        `;
        resultsList.appendChild(li);
      });

    })
    .catch(function (error) {
      loading.style.display  = "none";
      searchBtn.disabled     = false;
      errorMsg.style.display = "block";
      console.error("Search error:", error);
    });

});