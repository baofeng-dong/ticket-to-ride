// Ticket to Ride USA Map Data
// Contains all cities and routes for the classic USA board

const MAP_DATA = {
    // City positions (x, y as percentages of canvas for responsive rendering)
    cities: {
        'Vancouver': { x: 10, y: 8, name: 'Vancouver' },
        'Seattle': { x: 11, y: 15, name: 'Seattle' },
        'Portland': { x: 9, y: 22, name: 'Portland' },
        'San Francisco': { x: 6, y: 42, name: 'San Francisco' },
        'Los Angeles': { x: 11, y: 58, name: 'Los Angeles' },
        'Las Vegas': { x: 18, y: 52, name: 'Las Vegas' },
        'Phoenix': { x: 23, y: 65, name: 'Phoenix' },
        'Salt Lake City': { x: 24, y: 35, name: 'Salt Lake City' },
        'Helena': { x: 28, y: 18, name: 'Helena' },
        'Calgary': { x: 22, y: 5, name: 'Calgary' },
        'Winnipeg': { x: 48, y: 8, name: 'Winnipeg' },
        'Duluth': { x: 55, y: 20, name: 'Duluth' },
        'Sault Ste Marie': { x: 68, y: 15, name: 'Sault Ste Marie' },
        'Montreal': { x: 85, y: 12, name: 'Montreal' },
        'Boston': { x: 92, y: 22, name: 'Boston' },
        'Toronto': { x: 78, y: 20, name: 'Toronto' },
        'New York': { x: 88, y: 30, name: 'New York' },
        'Pittsburgh': { x: 78, y: 32, name: 'Pittsburgh' },
        'Washington': { x: 85, y: 38, name: 'Washington' },
        'Raleigh': { x: 82, y: 48, name: 'Raleigh' },
        'Charleston': { x: 82, y: 58, name: 'Charleston' },
        'Atlanta': { x: 75, y: 55, name: 'Atlanta' },
        'Miami': { x: 85, y: 78, name: 'Miami' },
        'New Orleans': { x: 65, y: 72, name: 'New Orleans' },
        'Nashville': { x: 70, y: 48, name: 'Nashville' },
        'Saint Louis': { x: 60, y: 42, name: 'Saint Louis' },
        'Chicago': { x: 65, y: 30, name: 'Chicago' },
        'Omaha': { x: 50, y: 32, name: 'Omaha' },
        'Kansas City': { x: 52, y: 42, name: 'Kansas City' },
        'Denver': { x: 35, y: 42, name: 'Denver' },
        'Santa Fe': { x: 32, y: 55, name: 'Santa Fe' },
        'El Paso': { x: 30, y: 70, name: 'El Paso' },
        'Houston': { x: 52, y: 75, name: 'Houston' },
        'Dallas': { x: 48, y: 65, name: 'Dallas' },
        'Oklahoma City': { x: 48, y: 55, name: 'Oklahoma City' },
        'Little Rock': { x: 58, y: 58, name: 'Little Rock' }
    },

    // Routes between cities
    // Each route has: cities (pair), length, color, and optional second parallel route
    routes: [
        // West Coast
        { id: 1, cities: ['Vancouver', 'Seattle'], length: 1, color: 'gray', parallel: null },
        { id: 2, cities: ['Vancouver', 'Seattle'], length: 1, color: 'gray', parallel: 1 },
        { id: 3, cities: ['Seattle', 'Portland'], length: 1, color: 'gray', parallel: null },
        { id: 4, cities: ['Seattle', 'Portland'], length: 1, color: 'gray', parallel: 3 },
        { id: 5, cities: ['Portland', 'San Francisco'], length: 5, color: 'green', parallel: null },
        { id: 6, cities: ['Portland', 'San Francisco'], length: 5, color: 'purple', parallel: 5 },
        { id: 7, cities: ['San Francisco', 'Los Angeles'], length: 3, color: 'yellow', parallel: null },
        { id: 8, cities: ['San Francisco', 'Los Angeles'], length: 3, color: 'purple', parallel: 7 },
        { id: 9, cities: ['Los Angeles', 'Las Vegas'], length: 2, color: 'gray', parallel: null },
        { id: 10, cities: ['Los Angeles', 'Phoenix'], length: 3, color: 'gray', parallel: null },
        { id: 11, cities: ['Los Angeles', 'El Paso'], length: 6, color: 'black', parallel: null },
        { id: 12, cities: ['Las Vegas', 'Salt Lake City'], length: 3, color: 'orange', parallel: null },
        { id: 13, cities: ['Phoenix', 'El Paso'], length: 3, color: 'gray', parallel: null },
        { id: 14, cities: ['Phoenix', 'Santa Fe'], length: 3, color: 'gray', parallel: null },
        { id: 15, cities: ['Phoenix', 'Denver'], length: 5, color: 'white', parallel: null },

        // Northwest to Mountain
        { id: 16, cities: ['Vancouver', 'Calgary'], length: 3, color: 'gray', parallel: null },
        { id: 17, cities: ['Seattle', 'Calgary'], length: 4, color: 'gray', parallel: null },
        { id: 18, cities: ['Seattle', 'Helena'], length: 6, color: 'yellow', parallel: null },
        { id: 19, cities: ['Portland', 'Salt Lake City'], length: 6, color: 'blue', parallel: null },
        { id: 20, cities: ['Calgary', 'Helena'], length: 4, color: 'gray', parallel: null },
        { id: 21, cities: ['Calgary', 'Winnipeg'], length: 6, color: 'white', parallel: null },
        { id: 22, cities: ['Helena', 'Winnipeg'], length: 4, color: 'blue', parallel: null },
        { id: 23, cities: ['Helena', 'Duluth'], length: 6, color: 'orange', parallel: null },
        { id: 24, cities: ['Helena', 'Omaha'], length: 5, color: 'red', parallel: null },
        { id: 25, cities: ['Helena', 'Denver'], length: 4, color: 'green', parallel: null },
        { id: 26, cities: ['Helena', 'Salt Lake City'], length: 3, color: 'purple', parallel: null },

        // Mountain Region
        { id: 27, cities: ['Salt Lake City', 'Denver'], length: 3, color: 'red', parallel: null },
        { id: 28, cities: ['Salt Lake City', 'Denver'], length: 3, color: 'yellow', parallel: 27 },
        { id: 29, cities: ['Denver', 'Omaha'], length: 4, color: 'purple', parallel: null },
        { id: 30, cities: ['Denver', 'Kansas City'], length: 4, color: 'black', parallel: null },
        { id: 31, cities: ['Denver', 'Kansas City'], length: 4, color: 'orange', parallel: 30 },
        { id: 32, cities: ['Denver', 'Oklahoma City'], length: 4, color: 'red', parallel: null },
        { id: 33, cities: ['Denver', 'Santa Fe'], length: 2, color: 'gray', parallel: null },
        { id: 34, cities: ['Santa Fe', 'El Paso'], length: 2, color: 'gray', parallel: null },
        { id: 35, cities: ['Santa Fe', 'Oklahoma City'], length: 3, color: 'blue', parallel: null },

        // Southwest
        { id: 36, cities: ['El Paso', 'Dallas'], length: 4, color: 'red', parallel: null },
        { id: 37, cities: ['El Paso', 'Houston'], length: 6, color: 'green', parallel: null },
        { id: 38, cities: ['Houston', 'Dallas'], length: 1, color: 'gray', parallel: null },
        { id: 39, cities: ['Houston', 'Dallas'], length: 1, color: 'gray', parallel: 38 },
        { id: 40, cities: ['Houston', 'New Orleans'], length: 2, color: 'gray', parallel: null },
        { id: 41, cities: ['Dallas', 'Oklahoma City'], length: 2, color: 'gray', parallel: null },
        { id: 42, cities: ['Dallas', 'Oklahoma City'], length: 2, color: 'gray', parallel: 41 },
        { id: 43, cities: ['Dallas', 'Little Rock'], length: 2, color: 'gray', parallel: null },
        { id: 44, cities: ['Oklahoma City', 'Kansas City'], length: 2, color: 'gray', parallel: null },
        { id: 45, cities: ['Oklahoma City', 'Kansas City'], length: 2, color: 'gray', parallel: 44 },
        { id: 46, cities: ['Oklahoma City', 'Little Rock'], length: 2, color: 'gray', parallel: null },

        // Central
        { id: 47, cities: ['Winnipeg', 'Duluth'], length: 4, color: 'black', parallel: null },
        { id: 48, cities: ['Winnipeg', 'Sault Ste Marie'], length: 6, color: 'gray', parallel: null },
        { id: 49, cities: ['Duluth', 'Sault Ste Marie'], length: 3, color: 'gray', parallel: null },
        { id: 50, cities: ['Duluth', 'Toronto'], length: 6, color: 'purple', parallel: null },
        { id: 51, cities: ['Duluth', 'Chicago'], length: 3, color: 'red', parallel: null },
        { id: 52, cities: ['Duluth', 'Omaha'], length: 2, color: 'gray', parallel: null },
        { id: 53, cities: ['Duluth', 'Omaha'], length: 2, color: 'gray', parallel: 52 },
        { id: 54, cities: ['Omaha', 'Chicago'], length: 4, color: 'blue', parallel: null },
        { id: 55, cities: ['Omaha', 'Kansas City'], length: 1, color: 'gray', parallel: null },
        { id: 56, cities: ['Omaha', 'Kansas City'], length: 1, color: 'gray', parallel: 55 },
        { id: 57, cities: ['Kansas City', 'Saint Louis'], length: 2, color: 'blue', parallel: null },
        { id: 58, cities: ['Kansas City', 'Saint Louis'], length: 2, color: 'purple', parallel: 57 },
        { id: 59, cities: ['Saint Louis', 'Chicago'], length: 2, color: 'green', parallel: null },
        { id: 60, cities: ['Saint Louis', 'Chicago'], length: 2, color: 'white', parallel: 59 },
        { id: 61, cities: ['Saint Louis', 'Pittsburgh'], length: 5, color: 'green', parallel: null },
        { id: 62, cities: ['Saint Louis', 'Nashville'], length: 2, color: 'gray', parallel: null },
        { id: 63, cities: ['Saint Louis', 'Little Rock'], length: 2, color: 'gray', parallel: null },
        { id: 64, cities: ['Little Rock', 'Nashville'], length: 3, color: 'white', parallel: null },
        { id: 65, cities: ['Little Rock', 'New Orleans'], length: 3, color: 'green', parallel: null },

        // Northeast
        { id: 66, cities: ['Sault Ste Marie', 'Toronto'], length: 2, color: 'gray', parallel: null },
        { id: 67, cities: ['Sault Ste Marie', 'Montreal'], length: 5, color: 'black', parallel: null },
        { id: 68, cities: ['Toronto', 'Montreal'], length: 3, color: 'gray', parallel: null },
        { id: 69, cities: ['Toronto', 'Pittsburgh'], length: 2, color: 'gray', parallel: null },
        { id: 70, cities: ['Toronto', 'Chicago'], length: 4, color: 'white', parallel: null },
        { id: 71, cities: ['Montreal', 'Boston'], length: 2, color: 'gray', parallel: null },
        { id: 72, cities: ['Montreal', 'Boston'], length: 2, color: 'gray', parallel: 71 },
        { id: 73, cities: ['Montreal', 'New York'], length: 3, color: 'blue', parallel: null },
        { id: 74, cities: ['Boston', 'New York'], length: 2, color: 'yellow', parallel: null },
        { id: 75, cities: ['Boston', 'New York'], length: 2, color: 'red', parallel: 74 },
        { id: 76, cities: ['New York', 'Pittsburgh'], length: 2, color: 'white', parallel: null },
        { id: 77, cities: ['New York', 'Pittsburgh'], length: 2, color: 'green', parallel: 76 },
        { id: 78, cities: ['New York', 'Washington'], length: 2, color: 'orange', parallel: null },
        { id: 79, cities: ['New York', 'Washington'], length: 2, color: 'black', parallel: 78 },
        { id: 80, cities: ['Pittsburgh', 'Washington'], length: 2, color: 'gray', parallel: null },
        { id: 81, cities: ['Pittsburgh', 'Raleigh'], length: 2, color: 'gray', parallel: null },
        { id: 82, cities: ['Pittsburgh', 'Nashville'], length: 4, color: 'yellow', parallel: null },
        { id: 83, cities: ['Pittsburgh', 'Chicago'], length: 3, color: 'orange', parallel: null },
        { id: 84, cities: ['Pittsburgh', 'Chicago'], length: 3, color: 'black', parallel: 83 },

        // Southeast
        { id: 85, cities: ['Washington', 'Raleigh'], length: 2, color: 'gray', parallel: null },
        { id: 86, cities: ['Washington', 'Raleigh'], length: 2, color: 'gray', parallel: 85 },
        { id: 87, cities: ['Raleigh', 'Charleston'], length: 2, color: 'gray', parallel: null },
        { id: 88, cities: ['Raleigh', 'Atlanta'], length: 2, color: 'gray', parallel: null },
        { id: 89, cities: ['Raleigh', 'Atlanta'], length: 2, color: 'gray', parallel: 88 },
        { id: 90, cities: ['Raleigh', 'Nashville'], length: 3, color: 'black', parallel: null },
        { id: 91, cities: ['Charleston', 'Atlanta'], length: 2, color: 'gray', parallel: null },
        { id: 92, cities: ['Charleston', 'Miami'], length: 4, color: 'purple', parallel: null },
        { id: 93, cities: ['Atlanta', 'Miami'], length: 5, color: 'blue', parallel: null },
        { id: 94, cities: ['Atlanta', 'Nashville'], length: 1, color: 'gray', parallel: null },
        { id: 95, cities: ['Atlanta', 'New Orleans'], length: 4, color: 'yellow', parallel: null },
        { id: 96, cities: ['Atlanta', 'New Orleans'], length: 4, color: 'orange', parallel: 95 },
        { id: 97, cities: ['Nashville', 'Chicago'], length: 4, color: 'gray', parallel: null },
        { id: 98, cities: ['New Orleans', 'Miami'], length: 6, color: 'red', parallel: null }
    ],

    // Route scoring by length
    routeScoring: {
        1: 1,
        2: 2,
        3: 4,
        4: 7,
        5: 10,
        6: 15
    },

    // Color definitions for rendering
    colors: {
        'red': '#e74c3c',
        'orange': '#e67e22',
        'yellow': '#f1c40f',
        'green': '#27ae60',
        'blue': '#3498db',
        'purple': '#9b59b6',
        'black': '#2c3e50',
        'white': '#bdc3c7',
        'gray': '#7f8c8d'
    },

    // Player train colors
    playerColors: ['red', 'blue', 'green', 'yellow', 'black']
};

// Helper function to find a route between two cities
function findRoute(city1, city2) {
    return MAP_DATA.routes.filter(route => {
        return (route.cities[0] === city1 && route.cities[1] === city2) ||
               (route.cities[0] === city2 && route.cities[1] === city1);
    });
}

// Helper function to get all routes from a city
function getRoutesFromCity(city) {
    return MAP_DATA.routes.filter(route => route.cities.includes(city));
}

// Helper function to get connected cities
function getConnectedCities(city) {
    const routes = getRoutesFromCity(city);
    const cities = new Set();
    routes.forEach(route => {
        route.cities.forEach(c => {
            if (c !== city) cities.add(c);
        });
    });
    return Array.from(cities);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MAP_DATA, findRoute, getRoutesFromCity, getConnectedCities };
}
