const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// import { Users } from ;
const Users = require("./users.json");
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// console.log(process.env.STRIPE_SECRET_KEY, "stripe");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jallqro.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
// console.log(uri);

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  // console.log(authorization);
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    const usersCollection = client.db("carResaleMarket").collection("users");
    const categoryCollection = client
      .db("carResaleMarket")
      .collection("carCategories");
    const productsCollection = client
      .db("carResaleMarket")
      .collection("products");
    const commentsCollection = client
      .db("carResaleMarket")
      .collection("comments");
    const bookingsCollection = client
      .db("carResaleMarket")
      .collection("bookings");
    const gadgetsCollection = client
      .db("carResaleMarket")
      .collection("gadgets");
    const paymentsCollection = client
      .db("carResaleMarket")
      .collection("payments");
    const blogCollection = client.db("carResaleMarket").collection("blogs");

    // -----------------------JWT------------
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      // console.log(user);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "10h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      // console.log(token);
      res.send({ token });
    });
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
    app.get("/products", async (req, res) => {
      const filter = {};
      const sort = { date: -1 };
      const result = await productsCollection
        .find(filter)
        .sort(sort)
        .limit(8)
        .toArray();
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

    app.get("/sellerPost/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const filter = { sellerEmail: email };
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
    // app.get("/api/products", (req, res) => {
    //   const { field1, field2, field3 } = req.query;
    //   console.log(field1, field2, field3);

    //   // Create the filter based on the provided query parameters
    //   const filter = {};
    //   if (field1) filter.field1 = field1;
    //   if (field2) filter.field2 = field2;
    //   if (field3) filter.field3 = field3;

    //   // Access the "productCollection" in the database
    //   // const collection = client.db(dbName).collection('productCollection');

    //   // Find the products matching the filter
    //   productsCollection.find(filter).toArray((err, products) => {
    //     if (err) {
    //       console.error("Error retrieving products:", err);
    //       res.status(500).json({ error: "Internal Server Error" });
    //     } else {
    //       res.json(products);
    //     }
    //   });
    // });

    // ------------------------------------

    // app.get("/search", async (req, res) => {
    //   const { q } = req.query;

    //   //   const keys = ["first_name", "last_name", "email"];

    //   //   const search = (data) => {
    //   //     return data.filter((item) =>
    //   //       keys.some((key) => item[key].toLowerCase().includes(q))
    //   //     );
    //   //   };

    //   //   q ? res.json(search(Users).slice(0, 10)) : res.json(Users.slice(0, 10));
    //   //   res.send(Users);
    //   const query = { first_name: { $regex: q, $options: "i" } };
    //   const cursor = productsCollection.find(query);
    //   const result = await cursor.toArray();
    //   console.log(result);
    //   //   //   res.send(result);
    // });

    app.post("/search", async (req, res) => {
      const categoryName = req.body.values.categoryName;
      const modelName = req.body.values.modelName;
      // console.log(req.body);
      const modelYear = req.body.values.modelYear;
      const condition = req.body.values.condition;
      const color = req.body.values.color;
      const limit = req.body.limit || 8;
      const sort = { date: -1 };
      // console.log(req.body.limit);

      const cursor = productsCollection.find({
        $and: [
          { categoryName: { $regex: categoryName, $options: "i" } },
          { modelName: { $regex: modelName, $options: "i" } },
          { modelYear: { $regex: modelYear, $options: "i" } },
          { condition: { $regex: condition, $options: "i" } },
          { color: { $regex: color, $options: "i" } },
        ],
      });
      const result = await cursor.limit(limit).sort(sort).toArray();
      // console.log(result);

      res.send(result);
    });
    // ---------------------------------------------------------------------------
    // -----------------------------post Comments--------------------------------------

    app.post("/comments", async (req, res) => {
      const comments = req.body;
      const result = await commentsCollection.insertOne(comments);
      res.send(result);
    });

    app.get("/comments/:_id", async (req, res) => {
      const id = req.params._id;
      // console.log(id);
      // const postId = {};
      const filter = { postId: id };
      const sort = { date: -1 };
      const result = await commentsCollection.find(filter).sort(sort).toArray();
      res.send(result);
    });
    app.get("/rating/:_id", async (req, res) => {
      const id = req.params._id;
      const filter = { postId: id };

      const result = await commentsCollection.find(filter).toArray();
      const specificProperty = result.map((comment) => comment.rating);
      const sum = specificProperty.reduce((acc, value) => acc + value, 0);
      const rating = sum / specificProperty.length;
      // console.log(specificProperty, average);
      res.send({ rating });
    });

    app.get("/comments", async (req, res) => {
      const filter = {};
      const result = await commentsCollection.find(filter).toArray();
      res.send(result);
    });
    // ---------------------------------------------------------------------------

    // ------------------------bookings api---------------------
    app.get("/bookings/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email };
      const user = await bookingsCollection.find(query).toArray();
      res.send(user);
    });

    app.get("/bookingOrder/:email", async (req, res) => {
      const email = req.params.email;
      const query = { sellerEmail: email };
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
    // ------------------------------------payment api-----------------------

    app.get("/booking/:id", async (req, res) => {
      // const category = req.params.category;
      const id = req.params.id;
      // console.log(category, id);
      const query = { _id: ObjectId(id) };
      const result = await bookingsCollection.findOne(query);
      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      // const { items } = req.body;
      const booking = req.body;
      const price = booking.price;
      const amount = price;
      // console.log(price);

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
        // automatic_payment_methods: {
        //   enabled: true,
        // },
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

    // ---------------------users api-----------------------------
    // app.post("/users", async (req, res) => {
    //   const user = req.body;
    //   // console.log(user);
    //   // TODO: make sure you do not enter duplicate user email
    //   // only insert users if the user doesn't exist in the database
    //   const result = await usersCollection.insertOne(user);
    //   res.send(result);
    // });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = user.email;

      // Check if the user with the same email already exists
      const existingUser = await usersCollection.findOne({ email });
      console.log(existingUser);
      if (existingUser) {
        return res.send(existingUser);
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }

      // Insert the user if no duplicate email is found
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const status = req.body;
      // console.log(email, status);
      const query = { email: email };
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          image: status.image,
          // name: status.name,
          // institution: status.institution,
          // department: status.department,
          // batch: status.batch,
          // profession: status.profession,
        },
      };
      const result = await usersCollection.updateOne(query, updatedDoc, option);
      res.send(result);
    });

    // ---------------------------blog api-------------------------------
    app.get("/blogs", async (req, res) => {
      const filter = {};
      const result = await blogCollection.find(filter).toArray();
      res.send(result);
    });

    app.post("/blogs", async (req, res) => {
      const product = req.body;
      const result = await blogCollection.insertOne(product);
      res.send(result);
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
    app.put("/user/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verify: "true",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
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

    app.delete("/sellerPost/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
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
