const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);

const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ddxd88y.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
  },
  useNewUrlParser: true,
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    client.connect((err) => {
      if (err) {
        console.error(err);
        return;
      }
    });

    const classesDbCollection = client.db("classDB").collection("classes");
    const selectedClassesDbCollection = client
      .db("classDB")
      .collection("selectedClasses");
    const usersDbCollection = client.db("classDB").collection("loggedInUsers");
    const paymentDbCollection = client.db("classDB").collection("payments");
    const enrollDbCollection = client.db("classDB").collection("enrollClass");

    app.get("/loggedInUsers", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await usersDbCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/allClasses", async (req, res) => {
      const result = await classesDbCollection.find().toArray();
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
    app.get("/selectedClasses/:userEmail", async (req, res) => {
      const userEmail = req.params.userEmail;

      const query = { userEmail: userEmail };

      const result = await selectedClassesDbCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/payments/:userEmail", async (req, res) => {
      const userEmail = req.params.userEmail;

      const query = { userEmail: userEmail };
      const options = {
        sort: { date: -1 },
      };
      const result = await paymentDbCollection.find(query, options).toArray();

      res.send(result);
    });
    app.get("/myClasses", async (req, res) => {
      let query = {};
      console.log(req.query?.instructorEmail);
      if (req.query?.instructorEmail) {
        query = { instructorEmail: req.query.instructorEmail };
      }

      const result = await classesDbCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/myClasses/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };

      const result = await classesDbCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/singleClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesDbCollection.findOne(query);
      res.send(result);
    });

    app.get("/enrollClass/:userEmail", async (req, res) => {
      const userEmail = req.params.userEmail;

      const query = { userEmail: userEmail };

      const result = await enrollDbCollection.find(query).toArray();
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
    app.post("/addClass", async (req, res) => {
      const addClass = req.body;
      const result = await classesDbCollection.insertOne(addClass);
      res.send(result);
    });
    app.post("/enrollClass", async (req, res) => {
      const enrollClass = req.body;
      const result = await enrollDbCollection.insertOne(enrollClass);
      res.send(result);
    });
    app.post("/selectedClass", async (req, res) => {
      try {
        const selectedClass = req.body;
        const query = { _id: new ObjectId(selectedClass._id) };
        const existingClass = await selectedClassesDbCollection.findOne(query);
        if (existingClass) {
          return res.send({ message: "class already selected" });
        }
        const result = await selectedClassesDbCollection.insertOne(
          selectedClass
        );
        res.send(result);
      } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentDbCollection.insertOne(payment);
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
    app.patch("/loggedInUsers/instructor/:id", async (req, res) => {
      const id = req.params;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersDbCollection.updateOne(filter, updateDoc);

      res.send(result);
    });
    app.patch("/allClasses/approved/:id", async (req, res) => {
      const id = req.params;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await classesDbCollection.updateOne(filter, updateDoc);

      res.send(result);
    });
    app.patch("/allClasses/denied/:id", async (req, res) => {
      const id = req.params;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "denied",
        },
      };
      const result = await classesDbCollection.updateOne(filter, updateDoc);

      res.send(result);
    });
    app.put("/allClasses/feedback/:id", async (req, res) => {
      const id = req.params;
      const filter = { _id: new ObjectId(id) };
      const updatedClass = req.body;
      console.log(updatedClass);
      const updateDoc = {
        $set: {
          feedback: updatedClass.feedback,
        },
      };
      const result = await classesDbCollection.updateOne(filter, updateDoc);

      res.send(result);
    });
    app.put("/myClasses/update/:id", async (req, res) => {
      const id = req.params;
      const filter = { _id: new ObjectId(id) };
      const updatedClass = req.body;

      const updateDoc = {
        $set: {
          className: updatedClass.className,
          classImage: updatedClass.classImage,
          instructorName: updatedClass.instructorName,
          instructorEmail: updatedClass.instructorEmail,
          instructorPhoto: updatedClass.instructorPhoto,
          availableSeats: updatedClass.availableSeats,
          price: updatedClass.price,
        },
      };
      const result = await classesDbCollection.updateOne(filter, updateDoc);

      res.send(result);
    });
    app.put("/singleClasses/:id", async (req, res) => {
      const id = req.params;
      const filter = { _id: new ObjectId(id) };
      const updatedClass = req.body;
      console.log(updatedClass);
      const updateDoc = {
        $set: {
          availableSeats: parseInt(updatedClass.availableSeats) - 1,
          students: parseInt(updatedClass.students) + 1,
        },
      };

      const result = await classesDbCollection.updateOne(filter, updateDoc);

      res.send(result);
      // res.send(result2);
    });
    app.delete("/selectedClasses/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: id };
      const result = await selectedClassesDbCollection.deleteOne(query);
      console.log(result);
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
