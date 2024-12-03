import express from "express";
import {ethers} from "ethers";
import routes from "./routes.js"; 
import { ALCHEMY_API_KEY, PRIVATE_KEY } from "./utils/config.js";
import cors from "cors";
import connectDB from "./utils/connectDB.js";
import bodyParser from "body-parser";

connectDB();
const app = express();
const port = 3000;

const provider = new ethers.JsonRpcProvider(ALCHEMY_API_KEY);

const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use("/", routes);

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));