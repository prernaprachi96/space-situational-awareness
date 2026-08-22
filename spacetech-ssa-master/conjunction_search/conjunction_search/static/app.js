// SSA Conjunction Search Dashboard
// Modified from IBM spacetech-ssa by Prerna

// ── Initialize Cesium Viewer ──
var viewer = new Cesium.Viewer("cesiumContainer", {
  shouldAnimate: true,
});

// ── Get all the HTML elements we need ──
var asoSelect     = document.getElementById("asoSelect");
var knnSearch     = document.getElementById("knnSearch");
var radiusSearch  = document.getElementById("radiusSearch");
var selectKNN     = document.getElementById("selectKNN");
var selectRadius  = document.getElementById("selectRadius");
var numKNNs       = document.getElementById("numKNNs");
var numKNNsText   = document.getElementById("numKNNsText");
var radius        = document.getElementById("radius");
var radiusText    = document.getElementById("radiusText");
var searchBtn     = document.getElementById("searchBtn");
var loading       = document.getElementById("loading");
var errorMsg      = document.getElementById("error-msg");
var resultsPanel  = document.getElementById("results-panel");
var resultsList   = document.getElementById("results-list");

// ── Slider: update displayed number as user drags ──
numKNNs.addEventListener("input", function () {
  numKNNsText.textContent = this.value;
});

radius.addEventListener("input", function () {
  radiusText.textContent = this.value;
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

// ── Search Button: run conjunction search ──
searchBtn.addEventListener("click", function () {

  // 1. Build the API URL
  var asoId = asoSelect.value;
  var url   = "/conjunction_search/" + asoId + "?";

  if (knnSearch.checked) {
    url += "k=" + numKNNs.value;
  } else {
    url += "radius=" + radius.value;
  }

  // 2. Show loading, hide error and old results
  searchBtn.disabled        = true;
  loading.style.display     = "flex";
  errorMsg.style.display    = "none";
  resultsPanel.style.display = "none";
  resultsList.innerHTML     = "";
  viewer.dataSources.removeAll();

  // 3. Fetch CZML data from Flask backend and show on globe
  viewer.dataSources.add(
    Cesium.CzmlDataSource.load(url)
  ).then(function () {

    // 4. Hide loading, re-enable button
    loading.style.display  = "none";
    searchBtn.disabled     = false;

    // 5. Show results panel with a simple message
    resultsPanel.style.display = "flex";
    resultsList.innerHTML = `
      <li class="result-item">
        <span class="result-name">Search complete</span>
        <span class="result-distance">Orbits loaded on globe</span>
      </li>
    `;

  }).otherwise(function (error) {

    // 6. If something went wrong, show error
    loading.style.display  = "none";
    searchBtn.disabled     = false;
    errorMsg.style.display = "block";
    console.error("Search error:", error);

  });

});