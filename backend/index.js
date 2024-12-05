import express from "express";
import {ethers} from "ethers";
import routes from "./routes.js"; 
import { ALCHEMY_API_KEY, PRIVATE_KEY } from "./utils/config.js";
import cors from "cors";
import connectDB from "./utils/connectDB.js";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from "dotenv"
dotenv.config();

connectDB();
const app = express();
const port = process.env.PORT || 3000;

// const provider = new ethers.JsonRpcProvider(ALCHEMY_API_KEY);

// const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use("/", routes);
// Resolve the current directory using `import.meta.url`
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'invoices' folder
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));
app.use('/receipts', express.static(path.join(__dirname, 'receipts')));

app.listen(port, () => console.log(`Server running on ${port}`));