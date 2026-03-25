require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Connect once when the server starts
client.connect().then(() => console.log("Connected to MongoDB"));

var api = require('./api.js');
api.setApp( app, client );

app.listen(5000, () => console.log("Server running on port 5000"));
