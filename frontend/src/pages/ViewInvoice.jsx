import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ViewInvoice = () => {
    const [invoiceId, setInvoiceId] = useState("");
    const [invoiceDetails, setInvoiceDetails] = useState(null);

    const handleFetchInvoice = async () => {
        try {
            const response = await axios.get(`https://invoicepaymentapp.onrender.com/getInvoice/${invoiceId}`);
            if(!response.ok){
                console.log(response.data);
            }
            setInvoiceDetails(response.data.invoice);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <Link to="/" className="absolute left-0 top-0 bg-green-500 text-white rounded-md px-3 py-3 m-5">Return Home</Link>
            <h2 className="text-2xl font-semibold mb-6">View Invoice</h2>
            <input
                type="text"
                className="w-full max-w-md p-3 rounded-md border border-gray-300"
                placeholder="Enter Invoice ID"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
            />
            <button
                className="mt-4 bg-green-500 text-white py-3 px-6 rounded-md"
                onClick={handleFetchInvoice}
            >
                Fetch Invoice
            </button>

            {invoiceDetails && (
                <div className="mt-6 space-y-4">
                    <p><strong>Amount:</strong> {invoiceDetails.amount}</p>
                    <p><strong>Description:</strong> {invoiceDetails.description}</p>
                    <p><strong>Due Date:</strong> {invoiceDetails.dueDate}</p>
                    <p><strong>Status:</strong> {invoiceDetails.status}</p>
                </div>
            )}
        </div>
    );
};

export default ViewInvoice;
