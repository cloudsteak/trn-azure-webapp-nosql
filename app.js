const express = require('express');
const bodyParser = require('body-parser');
const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

// Using environment variables
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableName = process.env.AZURE_TABLE_NAME
const partitionKey = process.env.AZURE_TABLE_PARTITION_KEY
// Initialize express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // For serving static files (CSS, JS, etc.)
app.set('view engine', 'ejs');

// Initialize Azure Table Client
const tableClient = TableClient.fromConnectionString(connectionString, tableName);

// Ensure the table exists
async function createTableIfNotExists() {
    await tableClient.createTable();
}

// Routes
// Route to display entities
app.get('/', async (req, res) => {
    // Fetch data from Azure Table Storage to display
    const entities = [];
    for await (const entity of tableClient.listEntities()) {
        entities.push(entity);
    }
    res.render('index', { entities });
});

// Route to add an entity
app.post('/add-entity', async (req, res) => {
    const { data } = req.body;
    var rowKey = uuidv4();
    await tableClient.createEntity({ partitionKey, rowKey, data });
    res.redirect('/');
});

// Route to generate and insert 1000 data objects
app.post('/generate-data', async (req, res) => {
    try {
        const entities = [];

        for (let i = 0; i < 1000; i++) {
            const entity = {
                partitionKey: partitionKey,
                rowKey: uuidv4(),
                data: `Data object ${i}`
            };
            entities.push(entity);
        }


        // Batch insert (up to 100 entities per batch due to Azure limits)
        for (let i = 0; i < entities.length; i += 100) {
            const batch = entities.slice(i, i + 100);
            await tableClient.submitTransaction(batch.map((entity) => ["create", entity]));
        }

        alert("1000 data objects generated and inserted successfully.");
    } catch (error) {
        console.error("Error generating data:", error);
        alert("Failed to generate data.");
    }
    res.redirect('/'); // Redirect back to the main page or render a success message
});

createTableIfNotExists();

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
