import express from "express";
import Web3 from "web3";
import { CONTRACT_ABI, CONTRACT_ADDRESS, ALCHEMY_API_KEY, PRIVATE_KEY } from "./utils/config.js";
import QRCode from "qrcode";

const router = express.Router();

// Initialize Web3 and contract
const web3 = new Web3(new Web3.providers.HttpProvider(ALCHEMY_API_KEY));
const account = web3.eth.accounts.wallet.add(PRIVATE_KEY);
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

/**
 * Route to create an invoice and generate a payment link with QR code
 */
router.post("/createInvoice", async (req, res) => {
    try {
        const { payer, amount, description, dueDate } = req.body;

        // Validate input
        if (!payer || !amount || !description || !dueDate) {
            return res.status(400).send({ success: false, error: "Missing required fields" });
        }
        if (!web3.utils.isAddress(payer)) {
            return res.status(400).send({ success: false, error: "Invalid payer address" });
        }

        // Estimate gas and send transaction
        const tx = contract.methods.createInvoice(payer, amount, description, dueDate);
        const gas = await tx.estimateGas({ from: account.address });
        const txData = {
            from: account.address,
            to: CONTRACT_ADDRESS,
            data: tx.encodeABI(),
            gas,
        };

        const receipt = await web3.eth.sendTransaction(txData);

        // Get the invoice ID (assumes it's returned in the receipt logs or increment logic)
        const invoiceId = receipt.events.InvoiceCreated.returnValues.invoiceId;

        // Generate a payment link
        const paymentUrl = `http://localhost:3000/payInvoice/${invoiceId}`;

        // Generate QR Code
        const qrCode = await QRCode.toDataURL(paymentUrl);

        res.status(200).send({
            success: true,
            receipt,
            invoiceId,
            paymentUrl,
            qrCode,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: err.message });
    }
});

/**
 * Route to pay an invoice using invoice ID
 */
router.post("/payInvoice", async (req, res) => {
    try {
        const { invoiceId } = req.body;

        // Validate input
        if (!invoiceId) {
            return res.status(400).send({ success: false, error: "Invoice ID is required" });
        }

        // Estimate gas and send transaction
        const tx = contract.methods.payInvoice(invoiceId);
        const gas = await tx.estimateGas({ from: account.address, value: web3.utils.toWei("1", "ether") });
        const txData = {
            from: account.address,
            to: CONTRACT_ADDRESS,
            data: tx.encodeABI(),
            gas,
        };

        const receipt = await web3.eth.sendTransaction(txData);
        res.status(200).send({ success: true, receipt });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: err.message });
    }
});

/**
 * Route to generate QR Code for an existing invoice payment
 */
router.get("/generateQrCode/:invoiceId", async (req, res) => {
    try {
        const { invoiceId } = req.params;

        // Validate input
        if (!invoiceId) {
            return res.status(400).send({ success: false, error: "Invoice ID is required" });
        }

        // Generate a payment link
        const paymentUrl = `http://localhost:3000/payInvoice/${invoiceId}`;

        // Generate QR Code
        const qrCode = await QRCode.toDataURL(paymentUrl);

        res.status(200).send({ success: true, paymentUrl, qrCode });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: err.message });
    }
});

/**
 * Route to get invoice details by ID
 */
router.get("/getInvoice/:id", async (req, res) => {
    try {
        const invoiceId = BigInt(req.params.id);

        // Validate input
        if (!invoiceId) {
            return res.status(400).send({ success: false, error: "Invoice ID is required" });
        }

        const invoice = await contract.methods.getInvoiceDetails(invoiceId).call();

        // Convert BigInt fields to strings
        const invoiceWithStrings = Object.entries(invoice).reduce((acc, [key, value]) => {
            acc[key] = typeof value === "bigint" ? value.toString() : value;
            return acc;
        }, {});

        res.status(200).send({ success: true, invoice: invoiceWithStrings });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: err.message });
    }
});


/**
 * Route to get all invoices for a user
 */
router.get("/getUserInvoices/:userAddress", async (req, res) => {
    try {
        const { userAddress } = req.params;

        // Validate input
        if (!web3.utils.isAddress(userAddress)) {
            return res.status(400).send({ success: false, error: "Invalid user address" });
        }

        // Fetch invoices from the contract
        const invoices = await contract.methods.getInvoicesByUser(userAddress).call();
        res.status(200).send({ success: true, invoices });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: err.message });
    }
});

export default router;
