const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Add request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Apply other middleware
app.use(compression());
app.use(express.json({limit: '50mb'}));
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add endpoint to serve the API key
app.get('/api/config', (req, res) => {
    res.json({
        mapApiKey: process.env.JAWG_ACCESS_TOKEN
    });
});

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to serve the GeoJSON data
app.get('/api/listings', (req, res) => {
    try {
        // Try multiple possible locations
        const possiblePaths = [
            path.join(__dirname, 'listings.geojson'),
            path.join(__dirname, 'public', 'listings.geojson'),
            path.join(__dirname, '..', 'ON', 'listings.geojson'),
            path.join(__dirname, '..', 'ON', 'public', 'listings.geojson')
        ];

        console.log('Checking these paths:');
        possiblePaths.forEach(p => console.log('- ' + p));

        let geoJsonPath = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                geoJsonPath = p;
                console.log('Found GeoJSON file at:', geoJsonPath);
                break;
            }
        }

        if (!geoJsonPath) {
            console.error('GeoJSON file not found in any location');
            return res.status(404).json({ error: 'Listings file not found' });
        }

        // Read and parse the file
        const data = fs.readFileSync(geoJsonPath, 'utf8');
        console.log('Raw data length:', data.length);
        
        if (!data.trim()) {
            console.error('Empty GeoJSON file');
            return res.status(500).json({ error: 'Empty GeoJSON file' });
        }

        try {
            const parsedData = JSON.parse(data);
            console.log('Parsed data structure:', {
                type: parsedData.type,
                featuresLength: parsedData.features?.length,
                sampleFeature: parsedData.features?.[0]
            });
            
            // Validate GeoJSON structure
            if (!parsedData || typeof parsedData !== 'object') {
                throw new Error('Invalid JSON structure');
            }
            
            if (parsedData.type !== 'FeatureCollection') {
                throw new Error('Not a valid GeoJSON FeatureCollection');
            }
            
            if (!Array.isArray(parsedData.features)) {
                throw new Error('Features property is not an array');
            }

            console.log('Valid GeoJSON with', parsedData.features.length, 'features');
            
            res.json(parsedData);
            
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            return res.status(500).json({ 
                error: 'Invalid JSON format',
                message: parseError.message 
            });
        }
        
    } catch (error) {
        console.error('Error reading GeoJSON file:', error);
        res.status(500).json({ 
            error: 'Failed to load listings data',
            message: error.message
        });
    }
});

// Add test endpoint
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Add a catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Current directory:', __dirname);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying ${port + 1}`);
        server.listen(port + 1);
    } else {
        console.error('Server error:', err);
    }
}); 