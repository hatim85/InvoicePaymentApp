import express from "express";
import { ethers } from "ethers"; // Import ethers.js
import { CONTRACT_ABI, CONTRACT_ADDRESS, ALCHEMY_API_KEY, PRIVATE_KEY } from "./utils/config.js";
import QRCode from "qrcode";
import { generatePDF } from "./utils/generatePDF.js";
import Invoice from "./InvoicSchema.js";

const router = express.Router();

// Initialize ethers.js provider and wallet
// const provider = new ethers.JsonRpcProvider(`https://crossfi-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`);
// const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Create contract instance
// const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

/**
 * Route to create an invoice and generate a payment link with QR code
 */
// Create an invoice and generate a payment link with a QR code
router.post("/createInvoice", async (req, res) => {
    const { payer, amount, description, dueDate, items, invoiceId, issuerAddress } = req.body;

    try {
        console.log("Request received:", req.body);

        if (!payer || !amount || !description || !dueDate || !items || !invoiceId || !issuerAddress) {
            console.log("Missing required fields");
            return res.status(400).json({ message: "Missing required fields" });
        }

        console.log("Validating Ethereum address:", payer);
        if (!ethers.utils.isAddress(payer)) {
            console.log("Invalid payer address:", payer);
            return res.status(400).json({ message: "Invalid payer address" });
        }

        console.log("Converting amount to Wei:", amount);
        const amountInWei = ethers.utils.parseUnits(amount.toString(), "ether");
        console.log("Amount in Wei:", amountInWei.toString());

        // Create invoice data object using the issuer address from frontend
        const invoiceData = {
            invoiceId,
            payer,
            issuer: issuerAddress, // Use issuerAddress received from frontend
            amount,
            description,
            dueDate,
            items,
            status: "Pending",
            qrCodeContent: `https://block-invoice.vercel.app/payInvoiceQR/${invoiceId}`, // URL for QR code
        };
        console.log("Invoice data to be saved:", invoiceData);

        // Save the invoice to the database
        const invoice = new Invoice(invoiceData);
        await invoice.save();
        console.log("Invoice saved to MongoDB");

        const pdfPath = `./invoices/${invoiceId}.pdf`;
        console.log("Generating PDF for the invoice at:", pdfPath);
        await generatePDF(invoiceData, pdfPath);
        console.log("PDF generated successfully");

        res.status(201).json({
            message: "Invoice created successfully",
            invoiceId,
            issuerPdfUrl: `https://invoicepaymentapp.onrender.com/invoices/${invoiceId}.pdf`,
        });
    } catch (error) {
        console.error("Error occurred during invoice creation:", error);
        res.status(500).json({ message: "Failed to create invoice" });
    }
});




/**
 * Route to pay an invoice using invoice ID
 */
router.post("/updateInvoiceStatus", async (req, res) => {
    try {
        const { invoiceId, transactionHash } = req.body;

        // Validate input
        if (!invoiceId) {
            return res.status(400).json({ success: false, error: "Invoice ID is required" });
        }

        // Fetch invoice details from MongoDB
        const invoice = await Invoice.findOne({ invoiceId });
        if (!invoice) {
            return res.status(404).json({ success: false, error: "Invoice not found" });
        }
        console.log("Full invoice details: ", invoice)
        // Update invoice status and save
        invoice.status = "Paid";
        invoice.transactionHash = transactionHash;
        invoice.datePaid = new Date();
        await invoice.save();

        // Generate payment receipt PDF
        const pdfPath = `./receipts/${invoiceId}_receipt.pdf`;

        // Convert amount in Ether to Wei (as BigNumber)
        // const amountInWei = ethers.utils.parseEther(invoice.amount.toString())
        // console.log("Amount in Wei:", amountInWei.toString());

        // Format the amount in Ether for display purposes
        const bigno = ethers.BigNumber.from(invoice.amount.toString());
        console.log("bigno: ", bigno);
        const valueInEther = ethers.utils.formatEther(bigno);
        // const valueInEther = ethers.utils.formatEther(invoice.amount);
        console.log("Amount in Ether:", valueInEther);

        const valueInWei = ethers.utils.parseUnits(valueInEther, 18)

        // const toWei = (num) => ethers.parseEther(num.toString())
        // const fromWei = (num) => ethers.formatEther(num)

        await generatePDF(
            {
                receiptId: transactionHash,
                invoiceId,
                issuer: invoice.issuer,
                description: invoice.description,
                payer: invoice.payer,
                // amount: valueInEther,
                amount: valueInWei,
                datePaid: invoice.datePaid.toISOString(),
                transactionHash
            },
            pdfPath
        );

        res.status(200).json({
            success: true,
            message: "Payment successful",
            receiptPdfUrl: `https://invoicepaymentapp.onrender.com/receipts/${invoiceId}_receipt.pdf`,
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
        const paymentUrl = `https://block-invoice.vercel.app/payInvoiceQR/${invoiceId}`;

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
router.get("/getInvoice/:invoiceId", async (req, res) => {
    const { invoiceId } = req.params;

    try {
        const invoice = await Invoice.findOne({ invoiceId });
        if (!invoice) {
            return res.status(404).json({ success: false, error: "Invoice not found" });
        }

        res.status(200).json({
            success: true,
            invoice,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});


/**
 * Route to get all invoices for a user
 */
// router.get("/getUserInvoices/:userAddress", async (req, res) => {
//     try {
//         const { userAddress } = req.params;

//         // Validate input
//         if (!ethers.utils.isAddress(userAddress)) {
//             return res.status(400).send({ success: false, error: "Invalid user address" });
//         }

//         // Fetch invoices from the contract
//         const invoices = await contract.getInvoicesByUser(userAddress);
//         res.status(200).send({ success: true, invoices });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send({ success: false, error: err.message });
//     }
// });

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

router.get("/paymentStatus/:transactionHash", async (req, res) => {
    const { transactionHash } = req.params;

    try {
        if (!transactionHash) {
            return res.status(400).json({ success: false, message: "Transaction hash is required" });
        }

        // Fetch invoice by transaction hash
        const invoice = await Invoice.findOne({ transactionHash });

        if (!invoice) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        res.status(200).json({
            success: true,
            status: invoice.status,
            invoiceDetails: {
                invoiceId: invoice.invoiceId,
                payer: invoice.payer,
                amount: invoice.amount,
                datePaid: invoice.datePaid,
            },
        });
    } catch (error) {
        console.error("Error fetching payment status:", error);
        res.status(500).json({ success: false, message: "Error fetching payment status" });
    }
});

export default router;
