import PDFDocument from "pdfkit";
import fs from "fs";
import QRCode from "qrcode";

export const generatePDF = async (data, pdfPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(pdfPath);

            // Pipe the PDF output to a file
            doc.pipe(stream);

            // Determine document type: Invoice or Receipt
            const isInvoice = !!data.invoiceId;
            doc.fontSize(20).text(isInvoice ? "Invoice" : "Receipt", { align: "center" });
            doc.moveDown();

            // Add Common Details
            if (isInvoice) {
                doc.fontSize(14).text(`Invoice ID: ${data.invoiceId}`);
                doc.text(`Issuer: ${data.issuer}`);
                doc.text(`Payer: ${data.payer}`);
                doc.text(`Amount: ${data.amount}`);
                doc.text(`Description: ${data.description}`);
                doc.text(`Due Date: ${data.dueDate}`);
                doc.moveDown();

                // Add Items Table
                doc.text("Items:");
                data.items.forEach((item, index) => {
                    doc.text(`${index + 1}. ${item.name} - $${item.price}`);
                });
                doc.moveDown();
            } else {
                // Receipt-specific details
                doc.fontSize(14).text(`Receipt ID: ${data.receiptId}`);
                doc.text(`Payment Date: ${data.datePaid}`);
                doc.text(`Transaction ID: ${data.transactionHash}`);
                doc.text(`Paid Amount: ${data.amount}`);
                doc.moveDown();
            }

            // Generate and Embed QR Code (Optional)
            if (isInvoice && data.qrCode) {
                doc.text(isInvoice ? "Scan the QR code to pay:" : "Payment QR Code:", { align: "center" });
                const qrImageSize = 150;
                const qrImageBuffer = Buffer.from(data.qrCode.split(",")[1], "base64");
                doc.image(qrImageBuffer, doc.page.width / 2 - qrImageSize / 2, doc.y, {
                    fit: [qrImageSize, qrImageSize],
                    align: "center",
                });
            }

            // Finalize the PDF file
            doc.end();

            stream.on("finish", () => resolve());
            stream.on("error", (err) => reject(err));
        } catch (error) {
            reject(error);
        }
    });
};
