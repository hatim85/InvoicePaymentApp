import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";

const CreateInvoice = () => {
    const [payer, setPayer] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [invoiceId, setInvoiceId] = useState("");
    const [paymentUrl, setPaymentUrl] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [invoicePdfUrl, setInvoicePdfUrl] = useState(""); // To store the invoice PDF URL
    const [items, setItems] = useState([{ itemName: "", itemPrice: "" }]); // For storing items and prices
    const [totalAmount, setTotalAmount] = useState(0); // To store the dynamically calculated total amount

    // Handle input changes for item and price
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;

        // Update items state
        setItems(updatedItems);

        // Recalculate the total amount
        const newTotal = updatedItems.reduce((acc, item) => acc + parseFloat(item.itemPrice || 0), 0);
        setTotalAmount(newTotal);
    };

    // Add a new item row
    const handleAddItem = () => {
        if (items.length < 5) {
            setItems([...items, { itemName: "", itemPrice: "" }]);
        }
    };

    // Remove an item row
    const handleRemoveItem = (index) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);

        // Recalculate the total amount after removal
        const newTotal = updatedItems.reduce((acc, item) => acc + parseFloat(item.itemPrice || 0), 0);
        setTotalAmount(newTotal);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            const amountInWei = ethers.parseUnits(totalAmount.toString(), "ether").toString();  // Use parseUnits from ethers.js

            const dueDateTimestamp = new Date(dueDate).getTime();
    
            const response = await axios.post("http://localhost:3000/createInvoice", {
                payer,
                description,
                dueDate: dueDateTimestamp, // Send the timestamp
                items, // Sending the items and their prices
                amount: amountInWei, // Send the amount in wei
            });
    
            // Handle errors
            if (response.status !== 201) {
                console.log(response.data);
            }
    
            // Set the response data to state
            setInvoiceId(response.data.invoiceId);
            setPaymentUrl(response.data.paymentUrl);
            setQrCode(response.data.qrCode);
            setInvoicePdfUrl(response.data.issuerPdfUrl); // Store the PDF URL
        } catch (error) {
            console.error(error.message);
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

                {/* Dynamically adding/removing item rows */}
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4">
                            <input
                                type="text"
                                className="w-full p-3 rounded-md border border-gray-300"
                                placeholder={`Item ${index + 1}`}
                                value={item.itemName}
                                onChange={(e) =>
                                    handleItemChange(index, "itemName", e.target.value)
                                }
                            />
                            <input
                                type="number"
                                className="w-full p-3 rounded-md border border-gray-300"
                                placeholder="Price"
                                value={item.itemPrice}
                                onChange={(e) =>
                                    handleItemChange(index, "itemPrice", e.target.value)
                                }
                            />
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    className="text-red-500"
                                    onClick={() => handleRemoveItem(index)}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    className="w-full bg-gray-300 text-gray-800 py-2 rounded-md mt-4"
                    onClick={handleAddItem}
                    disabled={items.length >= 5} // Disable after 5 items
                >
                    Add Item
                </button>

                {/* Display the dynamically calculated total amount */}
                <div className="mt-4 text-lg font-semibold">
                    <p>Total Amount: ${totalAmount.toFixed(2)}</p>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-3 rounded-md mt-6"
                >
                    Create Invoice
                </button>
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

                    {/* Display the Download Invoice Button */}
                    {invoicePdfUrl && (
                        <div className="mt-4">
                            <a href={invoicePdfUrl} download>
                                <button className="bg-green-500 text-white py-2 px-4 rounded-md">
                                    Download Invoice
                                </button>
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreateInvoice;
