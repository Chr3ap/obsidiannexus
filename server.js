const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const compression = require('compression');

const app = express();
const port = 3000;

// Configure CORS more explicitly
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply middleware
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({limit: '50mb'}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to serve the GeoJSON data
app.get('/api/listings', (req, res) => {
    try {
        const geoJsonPath = path.join(__dirname, 'listings.geojson');
        console.log('Attempting to read file from:', geoJsonPath);
        
        // Check if file exists
        if (!fs.existsSync(geoJsonPath)) {
            console.error('GeoJSON file not found at:', geoJsonPath);
            return res.status(404).json({ error: 'Listings file not found' });
        }

        // Read and parse the file
        const data = fs.readFileSync(geoJsonPath, 'utf8');
        console.log('Successfully read file, size:', data.length, 'bytes');
        
        const parsedData = JSON.parse(data);
        console.log('Successfully parsed JSON');
        
        // Validate GeoJSON structure
        if (!parsedData.type || !parsedData.features) {
            console.error('Invalid GeoJSON structure');
            return res.status(500).json({ error: 'Invalid GeoJSON structure' });
        }

        console.log(`Successfully loaded ${parsedData.features.length} listings`);
        
        // Send response with proper headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Add cache control headers
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.json(parsedData);
        
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ 
            error: 'Failed to load listings data',
            message: error.message
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Current directory:', __dirname);
    
    // Check if file exists on startup
    const geoJsonPath = path.join(__dirname, 'listings.geojson');
    console.log('Checking for listings.geojson at:', geoJsonPath);
    console.log('File exists:', fs.existsSync(geoJsonPath));
}); 