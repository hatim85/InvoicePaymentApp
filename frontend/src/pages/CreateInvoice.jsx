import { useState } from "react";
import axios from "axios";

const CreateInvoice = () => {
    const [payer, setPayer] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [invoiceId, setInvoiceId] = useState("");
    const [paymentUrl, setPaymentUrl] = useState("");
    const [qrCode, setQrCode] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:3000/createInvoice", {
                payer,
                amount,
                description,
                dueDate,
            });
            if(!response.ok){
                console.log(response.data);
            }
            setInvoiceId(response.data.invoiceId);
            setPaymentUrl(response.data.paymentUrl);
            setQrCode(response.data.qrCode);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h2 className="text-2xl font-semibold mb-6">Create an Invoice</h2>
            <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="w-full p-3 rounded-md border border-gray-300"
                    placeholder="Payer Address"
                    value={payer}
                    onChange={(e) => setPayer(e.target.value)}
                />
                <input
                    type="number"
                    className="w-full p-3 rounded-md border border-gray-300"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <textarea
                    className="w-full p-3 rounded-md border border-gray-300"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <input
                    type="date"
                    className="w-full p-3 rounded-md border border-gray-300"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
                <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-md">Create Invoice</button>
            </form>

            {invoiceId && (
                <div className="mt-6 text-center">
                    <p>Invoice Created! Invoice ID: {invoiceId}</p>
                    <p>
                        <a href={paymentUrl} className="text-blue-500">Pay Invoice</a>
                    </p>
                    <div className="mt-4">
                        <img src={qrCode} alt="QR Code" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateInvoice;
