// Initialize variables
const mapContainer = document.getElementById('map-container');
const especialidadSelect = document.getElementById('especialidad-select');
let currentMap = null;
let currentHeatLayer = null;

// Initialize the map
const map = L.map('map-container').setView([20.6597, -103.3496], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add building icon
const buildingIcon = L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const buildingMarker = L.marker([20.687143195199788, -103.38443357832459], {icon: buildingIcon}).addTo(map);
buildingMarker.bindPopup("Torre EP").openPopup();

// Function to load and display heatmap data
async function loadHeatmapData(especialidad) {
    try {
        // Mostrar animación de carga
        document.body.classList.add('loading');

        // Fetch data from a JSON file
        const response = await fetch('data/heatmap_data.json');
        const data = await response.json();

        if (currentHeatLayer) {
            map.removeLayer(currentHeatLayer);
        }

        if (data[especialidad]) {
            const heatmapData = data[especialidad].map(point => [point.lat, point.lng, point.intensity]);
            console.log(`Heatmap data for ${especialidad}:`, heatmapData); // Debug log
            currentHeatLayer = L.heatLayer(heatmapData, {
                radius: 12,
                blur: 10,
                maxZoom: 15,
                gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
            }).addTo(map);
            console.log('Heatmap layer added to map'); // Debug log
        } else {
            console.error(`No data found for specialty: ${especialidad}`);
        }

        // Ocultar animación de carga
        document.body.classList.remove('loading');
    } catch (error) {
        console.error('Error loading heatmap data:', error);
        // Ocultar animación de carga en caso de error
        document.body.classList.remove('loading');
    }
}

// Function to populate the specialty dropdown
async function populateSpecialtyDropdown() {
    try {
        const specialtiesResponse = await fetch('data/specialties.json');
        const specialties = await specialtiesResponse.json();

        const heatmapDataResponse = await fetch('data/heatmap_data.json');
        const heatmapData = await heatmapDataResponse.json();

        // Count locations for each specialty and sort
        const specialtyCounts = specialties.map(specialty => ({
            name: specialty,
            count: heatmapData[specialty] ? heatmapData[specialty].length : 0
        }));

        specialtyCounts.sort((a, b) => b.count - a.count);

        // Clear existing options
        especialidadSelect.innerHTML = '<option value="">Seleccione una especialidad</option>';

        // Add sorted specialties to dropdown
        specialtyCounts.forEach(specialty => {
            const option = document.createElement('option');
            option.value = specialty.name;
            option.innerHTML = `<i class="fas fa-stethoscope"></i> ${specialty.name} (${specialty.count})`;
            especialidadSelect.appendChild(option);
        });

        console.log('Specialties loaded and sorted:', specialtyCounts); // Debug log
    } catch (error) {
        console.error('Error loading and sorting specialties:', error);
    }
}

// Event listener for dropdown
especialidadSelect.addEventListener('change', (event) => {
    const selectedSpecialty = event.target.value;
    if (selectedSpecialty) {
        console.log('Selected specialty:', selectedSpecialty); // Debug log
        loadHeatmapData(selectedSpecialty);
    }
});

// Initialize the page
populateSpecialtyDropdown();

// Load initial heatmap data (e.g., for the first specialty)
async function loadInitialHeatmap() {
    try {
        const firstOption = especialidadSelect.querySelector('option:nth-child(2)');
        if (firstOption) {
            loadHeatmapData(firstOption.value);
        }
    } catch (error) {
        console.error('Error loading initial heatmap:', error);
    }
}

// Wait for the dropdown to be populated before loading the initial heatmap
setTimeout(loadInitialHeatmap, 500);

// Añadir un evento para mostrar un tooltip al hacer hover sobre el marcador de Torre EP
buildingMarker.on('mouseover', function (e) {
    this.openPopup();
});

buildingMarker.on('mouseout', function (e) {
    this.closePopup();
});
