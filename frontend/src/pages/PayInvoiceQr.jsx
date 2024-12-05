import React, { useState, useEffect } from "react";
import axios from "axios";
import Ethers from "../utils/Ethers"; // Assuming you have a utility to handle ethers
import { ethers } from "ethers";
import { Link, useParams } from "react-router-dom"; // Use useParams to access URL parameters

const PayInvoiceQr = ({ address }) => {
    const { invoiceId } = useParams(); // Get invoiceId from URL
    const [invoiceDetails, setInvoiceDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState("");
    const [walletAddress, setWalletAddress] = useState(""); // State for wallet address
    const [contract, setContract] = useState(null); // Store contract instance
    const [receiptUrl, setReceiptUrl] = useState("");

    useEffect(() => {
        // If the address is passed as a prop (connected wallet address), store it in state
        if (address) {
            setWalletAddress(address);
        }
    }, [address]);

    // UseEffect hook to fetch wallet address and contract when the component mounts
    useEffect(() => {
        // Fetch invoice details when the component mounts
        const fetchInvoiceDetails = async () => {
            try {
                const response = await axios.get(`https://invoicepaymentapp.onrender.com/getInvoice/${invoiceId}`);
                console.log(response);
                const bigno = ethers.BigNumber.from(response.data.invoice.amount.toString());
                const amount = ethers.utils.formatEther(bigno);

                response.data.invoice.amount = amount;
                console.log(typeof (response.data.invoice.amount));
                setInvoiceDetails(response.data.invoice);
            } catch (error) {
                console.error("Error fetching invoice:", error);
                setPaymentStatus("Failed to fetch invoice. Please try again.");
            }
        };

        fetchInvoiceDetails(); // Automatically fetch invoice when component mounts
    }, [invoiceId]); // Runs when the invoiceId changes

    // Handle the payment
    const handlePayment = async () => {
        if (!invoiceDetails) {
            console.log("Invoice details are not available");
            return;
        }

        if (!walletAddress) {
            console.log("Wallet address is not connected.");
            setPaymentStatus("Please connect your wallet.");
            return;
        }

        setLoading(true);
        setPaymentStatus("Processing payment...");
        console.log("Payment processing started...");

        try {
            const { provider, signer, contract } = Ethers();
            if (!contract) {
                console.log("Ethereum contract not found.");
                setPaymentStatus("Ethereum environment not found. Install MetaMask and try again.");
                return;
            }

            console.log("Contract found:", contract);
            console.log("Invoice detail amount: ", invoiceDetails.amount);

            // Convert amount from Ether to Wei
            // const paymentAmountInWei = ethers.utils.parseEther(invoiceDetails.amount.toString());
            // const paymentAmountInWei = ethers.BigNumber.from(invoiceDetails.amount.toString(), "ether");
            const paymentAmountInWei = ethers.utils.parseUnits(invoiceDetails.amount.toString(), "ether");
            console.log("Payment amount (in Wei):", paymentAmountInWei);

            // Interact with the contract
            console.log("Attempting to pay invoice with ID:", invoiceId);
            const tx = await contract.payInvoice(invoiceId, {
                value: paymentAmountInWei,
            });

            console.log("Transaction sent:", tx);

            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log("Transaction receipt received:", receipt);

            // Update payment status and redirect
            setPaymentStatus("Payment successful! Transaction Hash: " + receipt.transactionHash);
            console.log("Payment status updated:", "Payment successful!");

            // Call backend to update invoice status
            try {
                const response = await axios.post("https://invoicepaymentapp.onrender.com/updateInvoiceStatus", {
                    invoiceId,
                    transactionHash: receipt.transactionHash,
                });
                console.log("Invoice status updated successfully:", response);
                setReceiptUrl(response.data.receiptPdfUrl);
            } catch (error) {
                console.error("Error updating invoice status:", error);
                setPaymentStatus("Failed to update invoice status.");
            }

            // Optionally, redirect to a confirmation page
            // window.location.href = `/paymentConfirmation/${receipt.transactionHash}`;
        } catch (error) {
            console.error("Error during payment:", error);
            setPaymentStatus("Payment failed. Please try again.");
        } finally {
            setLoading(false);
            console.log("Payment process completed.");
        }
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <Link to="/" className="absolute left-0 top-0 bg-green-500 text-white rounded-md px-3 py-3 m-5">Return Home</Link>
                <h2 className="text-2xl font-semibold mb-6">Pay Invoice</h2>

                {/* Display Wallet Address */}
                {walletAddress && (
                    <p className="text-lg mb-4">
                        <strong>Connected Wallet Address: </strong>{walletAddress}
                    </p>
                )}

                {/* Invoice Details */}
                {invoiceDetails ? (
                    <div className="mt-6 space-y-4">
                        <p><strong>Amount:</strong> {invoiceDetails.amount} ETH</p>
                        <p><strong>Recipient:</strong> {invoiceDetails.issuer}</p>
                        <p><strong>Due Date:</strong> {new Date(invoiceDetails.dueDate).toLocaleString()}</p>
                        {/* Payment button will be triggered automatically upon loading */}
                        <button
                            className="mt-4 bg-green-500 text-white py-3 px-6 rounded-md"
                            onClick={handlePayment}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Pay Now"}
                        </button>
                    </div>
                ) : (
                    <p>Loading invoice details...</p>
                )}

                {paymentStatus && (
                    <div className="mt-6 text-center text-lg">
                        <p>{paymentStatus}</p>
                        {console.log("below payment status receipt pdf url: ", receiptUrl)}
                        {receiptUrl && (
                            <div className="mt-4">
                                <a href={receiptUrl} download>
                                    <button className="bg-green-500 text-white py-2 px-4 rounded-md">
                                        View Receipt
                                    </button>
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default PayInvoiceQr;
