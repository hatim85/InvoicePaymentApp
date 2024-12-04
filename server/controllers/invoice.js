const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const express = require("express");
const PDF = require("../models/pdf");
const invoiceRouter = express.Router();

// Helper function to create a PDF and return it as a Buffer
async function createPDF(data) {
    const { recepient, amount, description, deadline } = data;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add a page to the document
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();

    // Define color palette
    const COLORS = {
        DARK_BLUE: rgb(0.11, 0.22, 0.47),    // Deep professional blue
        LIGHT_BLUE: rgb(0.68, 0.85, 0.90),   // Soft background blue
        GRAY: rgb(0.6, 0.6, 0.6),            // Neutral gray for lines
        BLACK: rgb(0, 0, 0)                  // Pure black for text
    };

    // Draw background
    page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: COLORS.LIGHT_BLUE,
        opacity: 0.2
    });

    // Draw header border
    page.drawLine({
        start: { x: 50, y: height - 70 },
        end: { x: width - 50, y: height - 70 },
        thickness: 1.5,
        color: COLORS.DARK_BLUE
    });

    // Add content to the page
    page.drawText(`INVOICE`, {
        x: 50,
        y: height - 50,
        size: 24,
        font: helveticaBoldFont,
        color: COLORS.DARK_BLUE
    });

    // Draw details with aligned layout
    const labelX = 50;
    const valueX = 200;
    const lineHeight = 30;
    let currentY = height - 120;

    // Helper function to draw text pair
    const drawTextPair = (label, value, bold = false) => {
        page.drawText(label, {
            x: labelX,
            y: currentY,
            size: 16,
            font: bold ? helveticaBoldFont : helveticaFont,
            color: COLORS.DARK_BLUE
        });

        page.drawText(value, {
            x: valueX,
            y: currentY,
            size: 16,
            font: helveticaFont,
            color: COLORS.BLACK
        });

        // Draw subtle line
        page.drawLine({
            start: { x: labelX, y: currentY - 5 },
            end: { x: width - 50, y: currentY - 5 },
            thickness: 0.5,
            color: COLORS.GRAY,
            opacity: 0.3
        });

        currentY -= lineHeight;
    };

    drawTextPair('Recipient:', recepient);
    drawTextPair('Amount:', `$${parseFloat(amount).toFixed(2)}`, true);
    drawTextPair('Description:', description);
    drawTextPair('Deadline:', new Date(deadline).toLocaleDateString());

    // Footer message
    page.drawText("Thank you for your business!", {
        x: 50,
        y: 50,
        size: 14,
        font: helveticaFont,
        color: COLORS.DARK_BLUE,
        opacity: 0.7
    });

    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();

    return Buffer.from(pdfBytes); // Return as a Buffer
}

// Route to handle invoice creation
invoiceRouter.post("/", async (req, res) => {
    try {
        const { recepient, amount, description, deadline } = req.body;

        // Validate input
        if (!recepient || !amount || !description || !deadline) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Create PDF
        const pdfBuffer = await createPDF({ recepient, amount, description, deadline });

        // Save to MongoDB
        const pdf = new PDF({
            recepient,
            amount,
            description,
            deadline: new Date(deadline),
            data: pdfBuffer,
        });

        await pdf.save();

        // Set headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

        // Send the PDF buffer
        res.status(201).send(pdfBuffer);
    } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ error: "An error occurred while creating the invoice" });
    }
});

module.exports = invoiceRouter;