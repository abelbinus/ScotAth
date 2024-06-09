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

/*
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const port = 5000;

// Connect to MySQL database
const sequelize = new Sequelize('mydatabase', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql',
});

// Define a model
const Item = sequelize.define('Item', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Middleware to parse JSON bodies
app.use(express.json());

// API endpoint to get items
app.get('/api/items', async (req, res) => {
    const items = await Item.findAll();
    res.send(items);
});

// API endpoint to add a new item
app.post('/api/items', async (req, res) => {
    const newItem = await Item.create(req.body);
    res.send(newItem);
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// All other requests go to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/../client/build/index.html'));
});

*/

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
});


