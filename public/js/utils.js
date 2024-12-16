// Make the function available globally
window.loadGeoJsonInChunks = async function(url, chunkCallback, chunkSize = 100) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.features || !Array.isArray(data.features)) {
            throw new Error('Invalid GeoJSON format');
        }

        // Process features in chunks
        for (let i = 0; i < data.features.length; i += chunkSize) {
            const chunk = {
                type: 'FeatureCollection',
                features: data.features.slice(i, i + chunkSize)
            };
            
            // Allow UI to update between chunks
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Call the callback with the current chunk
            await chunkCallback(chunk);
        }

        return true;
    } catch (error) {
        console.error('Error loading GeoJSON:', error);
        throw error;
    }
}; 