// Map initialization
let map = L.map('map').setView([-3.06522, 114.6454817], 9);


// Layer Map Hybrid
let hybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 25,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
});

// Add OpenStreetMap layer to map by default
hybridLayer.addTo(map);

// Layer control
let baseLayers = {
    "Hybrid" : hybridLayer
    
};


// Initial selected pangan
let selectedPangan = "PADI";

// Get color depending on production value
function getColor(d) {
    return d > 40000 ? '#00441b' : // Hijau sangat gelap
           d > 30000 ? '#238823' : // Hijau gelap
           d > 20000 ? '#41ab5d' : // Hijau tua
           d > 10000 ? '#78c679' : // Hijau
           d > 5000  ? '#addd8e' : // Hijau muda
           d > 1000  ? '#d9f0a3' : // Hijau terang
                      '#FFEDA0';   // Krim
}

// Style function
function style(feature) {
    return {
        fillColor: getColor(feature.properties.PANGAN[selectedPangan]),
        weight: 1.5,
        opacity: 1,
        color: '#064e3b',
        dashArray: '',
        fillOpacity: 0.85
    };
}

// Highlight feature
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#022c22',
        dashArray: '',
        fillOpacity: 0.95
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }

    info.update(layer.feature.properties);
}

// Reset highlight
function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
}

// Batas wilayah Batola untuk mendeteksi poligon outlier (mis. KURIPAN)
const BATOLA_BOUNDS = L.latLngBounds([[-3.75, 114.1], [-2.3, 115.2]]);

// Zoom to feature (hindari lompat/zoom-out jika poligon di luar wilayah Batola)
function zoomToFeature(e) {
    var layer = e.target;
    var bounds = layer.getBounds();

    // Poligon di luar Batola (mis. KURIPAN) — diam, tidak pindah & tidak zoom-out
    if (!BATOLA_BOUNDS.intersects(bounds)) {
        map.closePopup();
        return;
    }

    map.fitBounds(bounds, { maxZoom: 14, padding: [20, 20] });
}

// Komoditas urut sesuai dropdown
const KOMODITAS = [
    ["PADI", "Padi"],
    ["JAGUNG", "Jagung"],
    ["KEDELAI", "Kedelai"],
    ["KACANG HIJAU", "Kacang Hijau"],
    ["UBI KAYU", "Ubi Kayu"],
    ["UBI JALAR", "Ubi Jalar"]
];

function numberFormat(n) {
    return Number(n).toLocaleString('id-ID');
}

// Popup berisi rincian semua komoditas
function popupContent(properties) {
    let rows = KOMODITAS.map(function (k) {
        return '<tr><th>' + k[1] + '</th><td>' + numberFormat(properties.PANGAN[k[0]]) + ' ton</td></tr>';
    }).join('');
    return '<p class="popup-title">' + properties.KECAMATAN + ' 🌾</p>' +
        '<table class="popup-table"><tbody>' + rows + '</tbody></table>';
}

// onEachFeature function
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
    layer.bindPopup(popupContent(feature.properties), { autoPan: false });
}

map.attributionControl.addAttribution('Produksi Pangan &copy; <a href="https://baritokualakab.bps.go.id/">BPS Batola</a>');

// GeoJSON layer
let geojson;

function updateMap() {
    if (geojson) {
        map.removeLayer(geojson);
    }

    geojson = L.geoJson(batola, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);
}

// Info control
let info = L.control();

info.onAdd = function (_map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

// Method to update info control based on feature properties
info.update = function (props) {
    var label = 'Pangan';
    for (var i = 0; i < KOMODITAS.length; i++) {
        if (KOMODITAS[i][0] === selectedPangan) { label = KOMODITAS[i][1]; break; }
    }
    this._div.innerHTML = '<h4>Produksi Pangan di Kab. Batola 🌾</h4>' + (props ?
        '<b>' + props.KECAMATAN + '</b><br />' + label + ': ' + numberFormat(props.PANGAN[selectedPangan]) + ' ton'
        : 'Arahkan kursor ke Kecamatan');
};

// ADD to map info 
info.addTo(map);

// ADD to map Layer Control
L.control.layers(baseLayers).addTo(map);

// Legend control
let legend = L.control({position: 'bottomright'});

legend.onAdd = function (_map) {
    let div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1000, 5000, 10000, 20000, 30000, 40000],
        labels = [],
        from, to;

    for (let i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
            '<i style="background:' + getColor(from + 1) + '"></i> ' +
            from + (to ? '&ndash;' + to : '+'));
    }

    div.innerHTML = labels.join('<br>');
    return div;
};

legend.addTo(map);

// Function to handle the dropdown change
document.getElementById('panganSelect').addEventListener('change', function() {
    selectedPangan = this.value;
    updateMap();
});

// Initial map update
updateMap();

L.easyPrint({
    title: 'Cetak Peta Kabupaten',
    position: 'topleft',
    sizeModes: ['A4Portrait', 'A4Landscape']
}).addTo(map);
