const express = require('express');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
