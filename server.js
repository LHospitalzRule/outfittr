require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 5000;
const client = new MongoClient(uri);

// Connect once when the server starts
client.connect().then(() => console.log("Connected to MongoDB"));

var api = require('./api.js');
api.setApp( app, client );

app.listen(port, () => console.log(`Server running on port ${port}`));
