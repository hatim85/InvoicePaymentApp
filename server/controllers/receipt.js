const {PDFDocument, rgb, StandardFonts} = require("pdf-lib");
const express = require("express");
const Receipt = require("../models/receipt");

const receiptRouter = express.Router();

// Helper function to create a PDF and return it as a Buffer
async function createReceipt(data) {
    const { transactionId, amount, payer } = data;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Embed a standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add a page to the document
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();

    // Color Palette
    const COLORS = {
        HEADER_BG: rgb(0.94, 0.97, 1), // Light blue background
        BORDER: rgb(0.7, 0.7, 0.7),    // Gray border
        TEXT_PRIMARY: rgb(0, 0, 0),     // Black text
        TEXT_SECONDARY: rgb(0.3, 0.3, 0.3) // Dark gray text
    };

    // Draw background rectangle
    page.drawRectangle({
        x: 50,
        y: 50,
        width: width - 100,
        height: height - 100,
        borderColor: COLORS.BORDER,
        borderWidth: 1,
        color: rgb(1, 1, 1)
    });

    // Header section with background
    page.drawRectangle({
        x: 50,
        y: height - 120,
        width: width - 100,
        height: 70,
        color: COLORS.HEADER_BG
    });

    // Draw lines
    page.drawLine({
        start: { x: 50, y: height - 120 },
        end: { x: width - 50, y: height - 120 },
        color: COLORS.BORDER,
        thickness: 1
    });

    // Add receipt content
    page.drawText("Payment Receipt", { 
        x: 70, 
        y: height - 90, 
        size: 24, 
        font: fontBold,
        color: COLORS.TEXT_PRIMARY 
    });

    const labelFontSize = 14;
    const valueFontSize = 12;
    const startY = height - 170;
    const labelX = 70;
    const valueX = 250;

    // Receipt details with aligned labels and values
    page.drawText("Transaction ID:", { 
        x: labelX, 
        y: startY, 
        size: labelFontSize, 
        font: font,
        color: COLORS.TEXT_SECONDARY 
    });
    page.drawText(transactionId, { 
        x: valueX, 
        y: startY, 
        size: valueFontSize, 
        font: font,
        color: COLORS.TEXT_PRIMARY 
    });

    page.drawText("Amount:", { 
        x: labelX, 
        y: startY - 25, 
        size: labelFontSize, 
        font: font,
        color: COLORS.TEXT_SECONDARY 
    });
    page.drawText(`$${amount}`, { 
        x: valueX, 
        y: startY - 25, 
        size: valueFontSize, 
        font: font,
        color: COLORS.TEXT_PRIMARY 
    });

    page.drawText("Payer:", { 
        x: labelX, 
        y: startY - 50, 
        size: labelFontSize, 
        font: font,
        color: COLORS.TEXT_SECONDARY 
    });
    page.drawText(payer, { 
        x: valueX, 
        y: startY - 50, 
        size: valueFontSize, 
        font: font,
        color: COLORS.TEXT_PRIMARY 
    });

    page.drawText("Paid At:", { 
        x: labelX, 
        y: startY - 75, 
        size: labelFontSize, 
        font: font,
        color: COLORS.TEXT_SECONDARY 
    });
    page.drawText(new Date().toLocaleString(), { 
        x: valueX, 
        y: startY - 75, 
        size: valueFontSize, 
        font: font,
        color: COLORS.TEXT_PRIMARY 
    });

    // Footer note
    page.drawText("Thank you for your payment!", { 
        x: 70, 
        y: 100, 
        size: 14, 
        font: fontBold,
        color: COLORS.TEXT_SECONDARY 
    });

    // Serialize the PDF document to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    return Buffer.from(pdfBytes); // Return the PDF as a Buffer
}

receiptRouter.post("/", async (req, res) => {
    try {
        const { transactionId, amount, payer } = req.body;

        // Validate input
        if (!transactionId || !amount || !payer) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Create Receipt PDF
        const pdfBuffer = await createReceipt({ transactionId, amount, payer });

        // Save to MongoDB
        const receipt = new Receipt({
            payer,
            receipt: pdfBuffer,
        });

        await receipt.save();

        // Respond with the PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

        // Send the PDF buffer
        res.status(201).send(pdfBuffer);
    } catch (error) {
        console.error("Error creating receipt:", error);
        res.status(500).json({ error: "An error occurred while creating the receipt" });
    }
});

module.exports = receiptRouter;