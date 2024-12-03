import express from "express";
import Web3 from "web3";
import routes from "./routes.js"; // Import routes
import { ALCHEMY_API_KEY, PRIVATE_KEY } from "./utils/config.js";
import cors from "cors";

const app = express();
const port = 3000;

const web3 = new Web3(new Web3.providers.HttpProvider(ALCHEMY_API_KEY));

web3.eth.accounts.wallet.add(PRIVATE_KEY);

app.use(express.json());
app.use(cors());
app.use("/", routes);

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));