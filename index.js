const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const jwt = require("jsonwebtoken");
require("dotenv").config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jallqro.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});
// console.log(uri);

async function run() {
    try {
        const usersCollection = client.db("carResaleMarket").collection("users");
        const categoryCollection = client.db("carResaleMarket").collection("carCategories");
        const productsCollection = client.db("carResaleMarket").collection("products");
        const bookingsCollection = client.db("carResaleMarket").collection("bookings");
        const gadgetsCollection = client.db("carResaleMarket").collection("gadgets");

        // -----------------------gadgets------------

        app.get("/gadgets", async (req, res) => {
            const filter = {};
            const result = await gadgetsCollection.find(filter).toArray();
            res.send(result);
        });

        // ---------------------products api-----------------------------

        app.get("/carCategory", async (req, res) => {
            const filter = {};
            const result = await categoryCollection.find(filter).toArray();
            res.send(result);
        });

        app.post("/products", async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });

        app.get("/products/:category", async (req, res) => {
            const category = req.params.category;
            // console.log(category);
            // const category = "sedan";
            const filter = { categoryName: category };
            const result = await productsCollection.find(filter).toArray();
            res.send(result);
        });

        app.get("/products/:category/:_id", async (req, res) => {
            // const category = req.params.category;
            const id = req.params._id;
            // console.log(category, id);
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.findOne(filter);
            res.send(result);
        });

        // ------------------------bookings api---------------------
        app.get("/bookings/:email", async (req, res) => {
            const email = req.params.email;
            // const email = "rafi@gmail.com";
            // console.log(email);
            const query = { email };
            const user = await bookingsCollection.find(query).toArray();
            res.send(user);
        });

        app.post("/bookings", async (req, res) => {
            const booking = req.body;
            // console.log(user);
            // TODO: make sure you do not enter duplicate user email
            // only insert users if the user doesn't exist in the database
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        // ---------------------users api-----------------------------
        app.post("/users", async (req, res) => {
            const user = req.body;
            // console.log(user);
            // TODO: make sure you do not enter duplicate user email
            // only insert users if the user doesn't exist in the database
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send(user);
        });

        // --------------------------admin access api--------------------------

        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.userRole === "admin" });
        });

        app.get("/buyers", async (req, res) => {
            const query = { userRole: "buyer" };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.get("/sellers", async (req, res) => {
            const query = { userRole: "seller" };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.put("/users/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verify: "true",
                },
            };
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });

        app.delete("/buyers/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });

        // -----------------------------------------
    } finally {
    }
}
run().catch(console.log);
// ------------------------
app.get("/", async (req, res) => {
    res.send("car resale server is running");
});

app.listen(port, () => console.log(`Car resale server running on ${port}`));
