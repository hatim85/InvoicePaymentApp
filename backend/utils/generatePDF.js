import PDFDocument from "pdfkit";
import fs from "fs";
import QRCode from "qrcode";
import { ethers } from "ethers";

export const generatePDF = async (data, pdfPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(pdfPath);

            // Pipe the PDF output to a file
            doc.pipe(stream);

            // Determine document type: Invoice or Receipt
            const isReceipt = !!data.receiptId;
            doc.fontSize(20).text(isReceipt ? "Receipt" : "Invoice", { align: "center" });
            doc.moveDown(1);

            // Add Common Details
            doc.fontSize(14).text(isReceipt ? `Invoice ID: ${data.receiptId}` : `Receipt ID: ${data.invoiceId}`, { align: "left" });
            doc.text(`Issuer: ${data.issuer}`);
            doc.text(`Payer: ${data.payer}`);
            doc.text(`Description: ${data.description}`);

            try {
                console.log("Raw amount in Ether (as string or number):", data.amount);

                // Convert Ether to Wei if necessary
                // const amountInWei = ethers.utils.parseUnits(data.amount.toString(), "ether");
                // console.log("Amount in Wei:", amountInWei.toString());

                // Convert Wei to Ether for display
                const amountInEther = ethers.utils.formatUnits(data.amount, "ether");
                doc.text(`Amount: ${amountInEther} XFI`);
            } catch (err) {
                console.error("Error converting amount to Ether:", err);
                doc.text("Error displaying amount in Ether. Check the transaction data.");
            }



            // Convert Due Date from Unix Timestamp to Normal Date
            if (!isReceipt) {
                // const dueDate = new Date(data.dueDate * 1000); // Convert from seconds to milliseconds
                const dueDate = new Date(data.dueDate); // Convert from seconds to milliseconds
                doc.text(`Due Date: ${dueDate.toLocaleString()}`);
            } else {
                // Receipt-specific details
                doc.text(`Payment Date: ${new Date(data.datePaid).toLocaleString()}`);
                doc.text(`Transaction ID: ${data.transactionHash}`);

                console.log("data amount: ", data.amount)
                const bigno = ethers.BigNumber.from(data.amount.toString());
                const paidAmountInEther = ethers.utils.formatEther(bigno);
                // Convert Paid Amount from Wei to Ether
                // const paidAmountInEther = ethers.utils.formatUnits(ethers.BigNumber.from(data.amount), "ether");
                doc.text(`Paid Amount: ${paidAmountInEther} XFI`);
            }

            doc.moveDown(2); // Space before table

            // Add Items Table (for Invoice only)
            if (!isReceipt && data.items) {
                // Set table headers
                doc.fontSize(12).text("Items", { align: "left" });
                doc.moveDown(0.5);

                // Create table structure
                const tableTop = doc.y;
                const itemHeaderWidth = 200;
                const priceHeaderWidth = 100;
                const rowHeight = 20;

                // Draw column headers
                doc.fontSize(10).text("Item Name", 50, tableTop, { width: itemHeaderWidth, align: "left" });
                doc.text("Price", 300, tableTop, { width: priceHeaderWidth, align: "left" });
                doc.moveDown(0.5);

                // Draw lines
                doc.lineWidth(0.5)
                    .moveTo(50, tableTop + rowHeight)
                    .lineTo(450, tableTop + rowHeight)
                    .stroke();

                // Draw table rows
                data.items.forEach((item, index) => {
                    doc.text(item.itemName, 50, tableTop + (index + 1) * rowHeight, { width: itemHeaderWidth, align: "left" });
                    doc.text(`$${item.itemPrice}`, 300, tableTop + (index + 1) * rowHeight, { width: priceHeaderWidth, align: "left" });
                });

                // Add table border
                doc.lineWidth(0.5)
                    .moveTo(50, tableTop + (data.items.length + 1) * rowHeight)
                    .lineTo(450, tableTop + (data.items.length + 1) * rowHeight)
                    .stroke();
                doc.moveDown(1);
            }

            // Generate and Embed QR Code for Invoice
            if (!isReceipt && data.qrCodeContent) {
                QRCode.toDataURL(data.qrCodeContent, (err, url) => {
                    if (err) {
                        console.error("Failed to generate QR code:", err);
                        reject(err);
                        return;
                    }

                    // Position the QR code in the center of the page
                    doc.text("Scan the QR code to pay:", { align: "center" });
                    const qrImageSize = 150;
                    doc.image(url, doc.page.width / 2 - qrImageSize / 2, doc.y + 10, {
                        fit: [qrImageSize, qrImageSize],
                        align: "center",
                    });

                    // Add clickable link below the QR code
                    doc.moveDown(2); // Add some space below the QR code
                    const paymentLink = data.qrCodeContent; // Assuming this is the URL the QR code represents
                    doc.text("Click here to pay", {
                        align: "center",
                        link: paymentLink,
                        underline: true, // Optional: underline the link for better visibility
                    });

                    // Finalize the PDF file after embedding QR code
                    doc.end();
                });
            } else {
                // Finalize the PDF file if no QR code
                doc.end();
            }

            stream.on("finish", () => resolve());
            stream.on("error", (err) => reject(err));
        } catch (error) {
            reject(error);
        }
    });
};
