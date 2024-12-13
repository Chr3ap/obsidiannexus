const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const port = 3000;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply middleware in correct order
app.use(compression());
app.use(limiter);
app.use(express.json({limit: '50mb'}));
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to serve the GeoJSON data
app.get('/api/listings', async (req, res) => {
    try {
        const geoJsonPath = path.join(__dirname, 'listings.geojson');
        
        // Check if file exists
        if (!fs.existsSync(geoJsonPath)) {
            console.error('GeoJSON file not found at:', geoJsonPath);
            return res.status(404).json({ error: 'Listings file not found' });
        }

        // Read and parse the file
        const data = fs.readFileSync(geoJsonPath, 'utf8');
        const parsedData = JSON.parse(data);
        
        // Validate GeoJSON structure
        if (!parsedData.type || !parsedData.features) {
            console.error('Invalid GeoJSON structure');
            return res.status(500).json({ error: 'Invalid GeoJSON structure' });
        }

        console.log(`Successfully loaded ${parsedData.features.length} listings`);
        
        // Send response with proper headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache');
        res.json(parsedData);
        
    } catch (error) {
        console.error('Error reading GeoJSON file:', error);
        res.status(500).json({ 
            error: 'Failed to load listings data',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Current directory:', __dirname);
}); 