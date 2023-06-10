const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();

// middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ddxd88y.mongodb.net/?retryWrites=true&w=majority`;
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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const classesDbCollection = client.db("classDB").collection("classes");
    const usersDbCollection = client.db("classDB").collection("loggedInUsers");

    app.get("/loggedInUsers", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await usersDbCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/approvedClasses", async (req, res) => {
      const query = { status: "approved" };

      const result = await classesDbCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/popularClasses", async (req, res) => {
      const query = {};
      const options = {
        sort: { students: -1 },
      };
      const result = await classesDbCollection
        .find(query, options)
        .limit(6)
        .toArray();
      res.send(result);
    });
    app.get("/instructors", async (req, res) => {
      const result = await classesDbCollection.find().toArray();
      res.send(result);
    });

    app.post("/loggedInUsers", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersDbCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersDbCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/loggedInUsers/admin/:id", async (req, res) => {
      const id = req.params;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersDbCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`world tongues server running on port ${port}`);
});
