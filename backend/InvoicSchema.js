import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema({
  payer: String,
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