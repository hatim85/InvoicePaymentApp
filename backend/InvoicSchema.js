import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  invoiceId: { 
    type: String, 
    required: true,    // Invoice ID is required
    unique: true       // Invoice ID should be unique
  },
  payer: String,
  qrCodeContent: {
    type: String,      // URL for QR code
    required: true,    // QR code content is required
  },
  issuer: String,
  amount: Number,
  description: String,
  dueDate: Date,
  items: [
    {
      name: String,
      price: Number,
    },
  ],
  status: {
    type: String,
    default: "Pending", // Possible values: Pending, Paid, Overdue
  },
  payerDownloads: {
    type: Number,
    default: 1, // Payer can download the invoice only once before payment
  },
  paymentReceiptPath: {
    type: String, // File path for the payment receipt
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Invoice = mongoose.model("Invoice", InvoiceSchema);
export default Invoice;