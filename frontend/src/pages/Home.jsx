import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import Ethers from "../utils/Ethers";

const Home = () => {
    

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            {/* Wallet Connect Button
            <button
                onClick={connectWallet}
                className="wallet-btn bg-blue-600 top-0 absolute right-0 m-5 p-3 text-center rounded-md"
            >
                {!walletAddress ? "Connect Wallet" : shortenAddress(walletAddress)}
            </button>

            {networkError && (
                <div className="w-auto m-5 p-5 absolute bg-red-500 text-white rounded-md">
                    {networkError}
                    <button
                        onClick={switchNetwork}
                        className="ml-4 p-2 outline-none rounded-md bg-blue-500"
                    >
                        Switch Network
                    </button>
                </div>
            )} */}

            {/* Page Content */}
            <h1 className="text-3xl font-bold mb-6">Welcome to BlockInvoice</h1>
            <p className="mb-6 text-lg">
                Blockchain-based invoice creation and payment platform
            </p>
            <div className="flex space-x-4">
                <Link
                    to="/createInvoice"
                    className="bg-blue-500 text-white px-6 py-3 rounded-md"
                >
                    Create Invoice
                </Link>
                <Link
                    to="/viewInvoice"
                    className="bg-green-500 text-white px-6 py-3 rounded-md"
                >
                    View Invoice
                </Link>
                <Link
                    to="/payInvoice"
                    className="bg-purple-500 text-white px-6 py-3 rounded-md"
                >
                    Pay Invoice
                </Link>
            </div>
        </div>
    );
};

export default Home;
