const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const jwt = require("jsonwebtoken");
require("dotenv").config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// import { Users } from ;
const Users = require("./users.json");
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
      const categoryName = req.body.categoryName;
      const modelName = req.body.modelName;
      // console.log(req.body);
      const modelYear = req.body.modelYear;
      const condition = req.body.condition;
      const color = req.body.color;

      const cursor = productsCollection.find({
        $and: [
          { categoryName: { $regex: categoryName, $options: "i" } },
          { modelName: { $regex: modelName, $options: "i" } },
          { modelYear: { $regex: modelYear, $options: "i" } },
          { condition: { $regex: condition, $options: "i" } },
          { color: { $regex: color, $options: "i" } },
        ],
      });
      const result = await cursor.toArray();
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

app.get("/comments", async (req, res) => {
    const filter = {};
    const result = await commentsCollection.find(filter).toArray();
    res.send(result);
});
    // ---------------------------------------------------------------------------

    // ------------------------bookings api---------------------
    app.get("/bookings/:email", async (req, res) => {
      const email = req.params.email;
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
