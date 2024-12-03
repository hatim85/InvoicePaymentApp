import { useState } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { toast } from "react-toastify";

const Home = () => {

    const [walletAddress, setWalletAddress] = useState("");
    const [networkError, setNetworkError] = useState("");
    const NETWORK_ID = "0x103D"; 

    const shortenAddress = (address) =>
        `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;

    // Connect Wallet Functionality
    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("MetaMask is not installed!");
            return;
        }

        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            // const provider = new ethers.providers.Web3Provider(window.ethereum);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = provider.getSigner();
            console.log(signer)
            const address=await (await signer).getAddress();
            console.log(address)

            // const address = (await signer).getAddress();

            setWalletAddress(address);

            checkNetwork(provider);
        } catch (error) {
            console.error("Failed to connect wallet:", error.message);
            toast.error("Failed to connect wallet");
        }
    };

    const checkNetwork = async (provider) => {
        if (!window.ethereum) return;

        try {
            const network = await provider.getNetwork();
            console.log("Current Network:", network.chainId);
            if (network.chainId !== BigInt(parseInt(NETWORK_ID, 16))) {
                setNetworkError("Please switch to the Crossfi testnet.");
            } else {
                setNetworkError("");
            }
        } catch (error) {
            console.error("Error checking network:", error);
            toast.error("Error checking network");
        }
    };

    const switchNetwork = async () => {
        if (!window.ethereum) {
            alert("MetaMask is not installed!");
            return;
        }

        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: NETWORK_ID }],
            });
            setNetworkError("");
        } catch (switchError) {
            if (switchError.code === 4902) {
                addNetwork();
            } else {
                console.error("Error switching network:", switchError);
            }
        }
    };

    const addNetwork = async () => {
        if (!window.ethereum) {
            alert("MetaMask is not installed!");
            return;
        }

        try {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: NETWORK_ID,
                        chainName: "CrossFi Testnet",
                        rpcUrls: ["https://rpc.testnet.ms"],
                        nativeCurrency: {
                            name: "CrossFi",
                            symbol: "XFI",
                            decimals: 18
                        },
                        blockExplorerUrls: ["https://testnet.crossfi.io"],
                    },
                ],
            });
        } catch (addError) {
            console.error("Error adding network:", addError);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <button
                onClick={connectWallet}
                className="wallet-btn bg-custom-mid-dark-purple bg-blue-600 top-0 absolute right-0 m-5 p-3 text-center rounded-md"
            >
                {!walletAddress ? "Connect Wallet" : shortenAddress(walletAddress)}
            </button>

            {networkError && (
                <div className="w-auto m-5 p-5 absolute bg-red-500 text-white">
                    {networkError}
                    <button
                        onClick={switchNetwork}
                        className="ml-4 p-5 outline-none rounded-md bg-blue-500"
                    >
                        Switch Network
                    </button>
                </div>
            )}
            <h1 className="text-3xl font-bold mb-6">Welcome to BlockInvoice</h1>
            <p className="mb-6 text-lg">Blockchain-based invoice creation and payment platform</p>
            <div className="flex space-x-4">
                <Link to="/createInvoice" className="bg-blue-500 text-white px-6 py-3 rounded-md">Create Invoice</Link>
                <Link to="/viewInvoice" className="bg-green-500 text-white  px-6 py-3 rounded-md">View Invoice</Link>
                <Link to="/payInvoice" className="bg-purple-500 text-white px-6 py-3 rounded-md">Pay Invoice</Link>
            </div>
        </div>
    );
};

export default Home;
