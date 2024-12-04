require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const invoiceRouter = require("./controllers/invoice");
const receiptRouter = require("./controllers/receipt");

const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());


mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.log("Failed to connect to MongoDB", error));

app.use("/invoice", invoiceRouter);
app.use("/receipt", receiptRouter);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});