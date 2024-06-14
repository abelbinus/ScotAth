const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '/../client/rainbow/build')));

// An example API endpoint
app.get('/api/hello', (req, res) => {
    res.send({ message: 'Hello from the server!' });
});

// All other requests go to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/../client/rainbow/build/index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
});


