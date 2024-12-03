import express from "express";
import { ethers } from "ethers"; // Import ethers.js
import { CONTRACT_ABI, CONTRACT_ADDRESS, ALCHEMY_API_KEY, PRIVATE_KEY } from "./utils/config.js";
import QRCode from "qrcode";
import Invoice from "./InvoicSchema.js";

const router = express.Router();

// Initialize ethers.js provider and wallet
const provider = new ethers.JsonRpcProvider(ALCHEMY_API_KEY);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

/**
 * Route to create an invoice and generate a payment link with QR code
 */
router.post("/createInvoice", async (req, res) => {
    const { payer, amount, description, dueDate, items } = req.body;

    try {
        if (!payer || !amount || !description || !dueDate || !items) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Validate Ethereum address
        if (!ethers.isAddress(payer)) {
            return res.status(400).json({ message: "Invalid payer address" });
        }

        console.log("before tx")
        // Interact with the contract to create an invoice
        const tx = await contract.createInvoice(payer, ethers.parseUnits(amount, "ether"), description, dueDate);
        const receipt = await tx.wait(); // Wait for transaction to be mined

        console.log(receipt.events[0])
        // Extract the invoice ID from the receipt
        const invoiceId = receipt.events[0].args.invoiceId.toString(); // Assuming the event returns invoiceId

        // Create payment URL
        const paymentUrl = `http://localhost:3000/payInvoice/${invoiceId}`;

        // Save items and generate PDF
        const invoiceData = {
            invoiceId,
            payer,
            issuer: wallet.address,
            amount,
            description,
            dueDate,
            items,
            status: "Pending",
            qrCodeContent: paymentUrl, // Include payment URL for QR code generation
        };

        // Save to MongoDB
        const invoice = new Invoice(invoiceData);
        await invoice.save();

        // Generate Invoice PDF
        const pdfPath = `./invoices/${invoiceId}.pdf`;
        await generatePDF(invoiceData, pdfPath);

        res.status(201).json({
            message: "Invoice created successfully",
            invoiceId,
            issuerPdfUrl: `http://localhost:3000/invoices/${invoiceId}.pdf`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create invoice" });
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
            return res.status(400).json({ success: false, error: "Invoice ID is required" });
        }

        // Fetch invoice details from MongoDB
        const invoice = await Invoice.findOne({ invoiceId });
        if (!invoice) {
            return res.status(404).json({ success: false, error: "Invoice not found" });
        }

        // Validate payment amount dynamically
        const paymentAmountInWei = ethers.parseUnits(invoice.amount.toString(), "ether");

        // Interact with the smart contract to pay the invoice
        const tx = await contract.payInvoice(invoiceId, {
            value: paymentAmountInWei
        });
        const receipt = await tx.wait();

        // Update invoice status and save
        invoice.status = "Paid";
        invoice.datePaid = new Date();
        await invoice.save();

        // Generate payment receipt PDF
        const pdfPath = `./receipts/${invoiceId}_receipt.pdf`;
        await generatePDF(
            {
                receiptId: receipt.transactionHash,
                invoiceId,
                payer: invoice.payer,
                amount: invoice.amount,
                datePaid: invoice.datePaid.toISOString(),
            },
            pdfPath
        );

        res.status(200).json({
            success: true,
            message: "Payment successful",
            receipt,
            receiptPdfUrl: `http://localhost:3000/receipts/${invoiceId}_receipt.pdf`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
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

        const invoice = await contract.getInvoiceDetails(invoiceId);

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
        if (!ethers.utils.isAddress(userAddress)) {
            return res.status(400).send({ success: false, error: "Invalid user address" });
        }

        // Fetch invoices from the contract
        const invoices = await contract.getInvoicesByUser(userAddress);
        res.status(200).send({ success: true, invoices });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: err.message });
    }
});

router.get("/downloadInvoice/:invoiceId", async (req, res) => {
    const { invoiceId } = req.params;

    try {
        const invoice = await Invoice.findOne({ invoiceId });
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        // Check download restrictions for the payer
        if (invoice.status === "Pending" && invoice.payerDownloads <= 0) {
            return res.status(403).json({
                message: "Invoice can only be downloaded once before payment",
            });
        }

        if (invoice.status === "Pending") {
            invoice.payerDownloads -= 1;
            await invoice.save();
        }

        res.download(`./invoices/${invoiceId}.pdf`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error downloading invoice" });
    }
});

export default router;
