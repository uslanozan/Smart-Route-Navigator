const map = L.map('map').setView([37.215292257492756, 28.3634342823134], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

let markers = [];
let polylineLayer = null;
let clickCount = 0;
let startCoord, endCoord;
let clickListener = null;

function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    clickCount = 0;
    if (polylineLayer) {
        map.removeLayer(polylineLayer);
        polylineLayer = null;
    }
    resetResults();
}

function resetResults() {
    document.getElementById('distance').textContent = '-';
    document.getElementById('steps').textContent = '-';
    document.getElementById('time').textContent = '-';
    document.getElementById('path').textContent = '-';
    document.getElementById('start-node').textContent = '-';
    document.getElementById('end-node').textContent = '-';
    document.getElementById('path-count').textContent = '-';
}

function setupClickHandler() {
    if (clickListener) {
        map.off('click', clickListener);
    }

    clickListener = map.on('click', function(e) {
        if (clickCount === 0) {
            clearMarkers();
            startCoord = e.latlng;
            const startMarker = L.marker(startCoord, {
                icon: new L.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }),
                zIndexOffset: 1000
            }).addTo(map).bindPopup("<b>Start Point</b>").openPopup();
            markers.push(startMarker);
            clickCount = 1;
        } else if (clickCount === 1) {
            endCoord = e.latlng;
            const endMarker = L.marker(endCoord, {
                icon: new L.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                }),
                zIndexOffset: 1000
            }).addTo(map).bindPopup("<b>End Point</b>").openPopup();
            markers.push(endMarker);
            clickCount = 0;
            calculateRoute();
        }
    });
}

function calculateRoute() {
    const selectedAlgorithm = document.getElementById('algorithm-select').value;

    fetch('/route', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            start: [startCoord.lat, startCoord.lng],
            end: [endCoord.lat, endCoord.lng],
            algorithm: selectedAlgorithm
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log("Route data:", data); 
        
        if (!data.path || data.path.length === 0) {
            throw new Error('No path found');
        }

        const path = data.path.map(coord => [coord[0], coord[1]]);
        
        if (polylineLayer) {
            map.removeLayer(polylineLayer);
        }

        let routeColor = '#bb86fc';
        
        const currentAlgo = document.getElementById('algorithm-select').value;

        if (currentAlgo === 'astar') {
            routeColor = '#03dac6';
        } else if (currentAlgo === 'bfs') {
            routeColor = '#cf6679';
        } else if (currentAlgo === 'dfs') {
            routeColor = '#ffb74d';
        }

        polylineLayer = L.polyline(path, {
            color: routeColor,
            weight: 6,
            opacity: 1,
            lineJoin: 'round',
            className: 'animated-path'
        }).addTo(map);

        polylineLayer.on('add', function() {
            const pathElement = polylineLayer.getElement();
            pathElement.style.transition = 'stroke-width 0.5s ease-in-out';
            pathElement.style.strokeWidth = '8px';
            setTimeout(() => {
                pathElement.style.strokeWidth = '6px';
            }, 500);
        });

        map.fitBounds(polylineLayer.getBounds(), {
            padding: [50, 50]
        });

        document.getElementById('distance').textContent = data.distance.toFixed(2);
        document.getElementById('steps').textContent = data.steps;
        document.getElementById('time').textContent = data.execution_time.toFixed(2);
        document.getElementById('path').textContent = data.path_nodes.join(' -> ');
        document.getElementById('start-node').textContent = data.start_node;
        document.getElementById('end-node').textContent = data.end_node;
        document.getElementById('path-count').textContent = data.path_nodes.length;
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error calculating route. Please try different points.');
        clearMarkers();
    });
}

setupClickHandler();
resetResults();