const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: [
      "https://equisports-b8d0f.web.app",
      "https://equisports-b8d0f.firebaseapp.com/",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jqtel.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("EquiSports");
    const equipmentCollection = database.collection("equipment");

    app.get("/equipment", async (req, res) => {
      try {
        const equipment = await equipmentCollection.find().toArray();
        res.status(200).json(equipment);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch equipment" });
      }
    });

    app.get("/products", async (req, res) => {
      try {
        // Fetch the products from the collection, limiting the results to 6
        const products = await equipmentCollection.find().limit(6).toArray();

        res.status(200).json(products); // Send the products as JSON
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
      }
    });

    // Get equipment by user email
    app.get("/user-equipment", async (req, res) => {
      try {
        const userEmail = req.query.email; // Assuming user email is sent via query
        const equipment = await equipmentCollection
          .find({ userEmail })
          .toArray();
        res.status(200).json(equipment);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch user equipment" });
      }
    });

    app.get("/equipment/:id", async (req, res) => {
      const { id } = req.params;

      // Validate ID format
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid equipment ID format" });
      }

      try {
        const equipment = await equipmentCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!equipment) {
          return res.status(404).json({ error: "Equipment not found" });
        }

        res.status(200).json(equipment);
      } catch (error) {
        console.error("Error fetching equipment details:", error);
        res.status(500).json({ error: "Failed to fetch equipment details" });
      }
    });

    app.post("/add-equipment", async (req, res) => {
      try {
        const equipmentData = req.body;
        const result = await equipmentCollection.insertOne(equipmentData);
        res
          .status(201)
          .json({ message: "Equipment added successfully!", data: result });
      } catch (error) {
        res.status(500).json({ error: "Failed to add equipment" });
      }
    });

    // Update equipment
    app.put("/update-equipment/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { _id, ...updatedData } = req.body; // Exclude _id from the update

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid equipment ID" });
        }

        const result = await equipmentCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Equipment not found" });
        }

        res.status(200).json({ message: "Equipment updated successfully" });
      } catch (error) {
        console.error("Error updating equipment:", error);
        res.status(500).json({ error: "Failed to update equipment" });
      }
    });

    // Delete equipment
    app.delete("/delete-equipment/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await equipmentCollection.deleteOne({
          _id: new ObjectId(id),
        });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Equipment not found" });
        }
        res.status(200).json({ message: "Equipment deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete equipment" });
      }
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Started");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
