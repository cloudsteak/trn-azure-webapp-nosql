var express = require("express");
const { v4: uuidv4 } = require("uuid");

const bodyParser = require("body-parser");
const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");
require("dotenv").config();

// Using environment variables
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableName = process.env.AZURE_TABLE_NAME;
const partitionKey = process.env.AZURE_TABLE_PARTITION_KEY;
// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public")); // For serving static files (CSS, JS, etc.)
app.set("view engine", "ejs");

// Initialize Azure Table Client
const tableClient = TableClient.fromConnectionString(
  connectionString,
  tableName
);

// Ensure the table exists
async function createTableIfNotExists() {
  await tableClient.createTable();
}

// Routes
// Route to display entities
app.get("/", async (req, res) => {
  // Fetch data from Azure Table Storage to display
  const entities = [];
  for await (const entity of tableClient.listEntities()) {
    entities.push(entity);
  }
  res.render("index", { entities });
});

// Route to add an entity
app.post("/add-entity", async (req, res) => {
  const { data } = req.body;
  var rowKey = uuidv4();
  await tableClient.createEntity({ partitionKey, rowKey, data });
  res.redirect("/");
});

// Route to generate and insert 100 data objects
app.post("/generate-data", async (req, res) => {
  try {
    const entities = [];
    // Keresztnevek listája
    const firstnames = [
      "Gergő",
      "Petra",
      "Balázs",
      "Krisztián",
      "Anikó",
      "Márton",
      "Zsófia",
      "Bence",
      "Dóra",
      "Gábor",
    ];

    const surenames = [
        "Nagy",
        "Kovács",
        "Horváth",
        "Tóth",
        "Szabó",
        "Kiss",
        "Molnár",
        "Varga",
        "Farkas",
        "Pap"
      ];
      
    for (let i = 0; i < 100; i++) {
      const fIndex = Math.floor(Math.random() * firstnames.length);
      const sIndex = Math.floor(Math.random() * surenames.length);
      const entity = {
        partitionKey: partitionKey,
        rowKey: uuidv4(),
        data: `{
            id: ${i},
            kor: ${Math.floor(Math.random() * (75 - 18 + 1)) + 18},
            nev: {
                vezeteknev: ${surenames[sIndex]},
                keresztnev: ${firstnames[fIndex]}
            }
        }`,
      };
      entities.push(entity);
    }

    // Batch insert (up to 100 entities per batch due to Azure limits)
    for (let i = 0; i < entities.length; i += 10) {
      const batch = entities.slice(i, i + 10);
      await tableClient.submitTransaction(
        batch.map((entity) => ["create", entity])
      );
    }

    res.redirect("/"); // Redirect back to the main page or render a success message
  } catch (error) {
    console.error("Error generating data:", error);
    res.render("error", {
      message: "Hiba!",
      error: { stack: error, status: 500 },
    });
  }
});

createTableIfNotExists();

module.exports = app;
