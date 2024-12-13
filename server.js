const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const compression = require('compression');

const app = express();
const port = 3000;

// Apply middleware
app.use(compression());
app.use(express.json({limit: '50mb'}));
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

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