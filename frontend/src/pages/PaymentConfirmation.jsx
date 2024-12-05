import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const PaymentConfirmation = () => {
    const { transactionHash } = useParams();
    const [paymentStatus, setPaymentStatus] = useState(null);

    useEffect(() => {
        const fetchPaymentStatus = async () => {
            try {
                const response = await axios.get(`https://invoicepaymentapp.onrender.com/paymentStatus/${transactionHash}`);
                console.log(response)
                setPaymentStatus(response.data.status);
            } catch (error) {
                console.error(error);
            }
        };
        fetchPaymentStatus();
    }, [transactionHash]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h2 className="text-2xl font-semibold mb-6">Payment Confirmation</h2>
            <p className="mb-4">Transaction Hash: {transactionHash}</p>
            {paymentStatus ? (
                <p className="text-green-500">{paymentStatus}</p>
            ) : (
                <p className="text-red-500">Payment failed or pending</p>
            )}
        </div>
    );
};

export default PaymentConfirmation;
