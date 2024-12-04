import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CreateInvoice from "./pages/CreateInvoice";
import ViewInvoice from "./pages/ViewInvoice";
import PayInvoice from "./pages/PayInvoice";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import { ToastContainer } from 'react-toastify'
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import Ethers from "./utils/Ethers";

function App() {

  const [walletAddress, setWalletAddress] = useState("");
    const [networkError, setNetworkError] = useState("");
    const [signner, setSignner] = useState(null);
    const [provider, setProvider] = useState(null)
    const NETWORK_ID = "0x103D"; // CrossFi Testnet Chain ID
    // Function to shorten the wallet address for display
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
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            
            setWalletAddress(address);
            setProvider(provider)
            setSignner(signer)
            checkNetwork(provider);
        } catch (error) {
            console.error("Failed to connect wallet:", error.message);
            toast.error("Failed to connect wallet");
        }
    };

    // Check if the user is on the correct network
    const checkNetwork = async (provider) => {
        if (!window.ethereum) return;

        try {
            console.log(provider)
            const network = await provider.getNetwork();
            console.log("Current Network:", network.chainId);
            if (network.chainId !== parseInt(NETWORK_ID, 16)) {
                setNetworkError("Please switch to the CrossFi testnet.");
            } else {
                setNetworkError("");
            }
        } catch (error) {
            console.error("Error checking network:", error);
            toast.error("Error checking network");
        }
    };

    // Switch the user to the correct network
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
            setNetworkError(""); // Clear the error once switched successfully
        } catch (switchError) {
            if (switchError.code === 4902) {
                addNetwork();
            } else {
                console.error("Error switching network:", switchError);
            }
        }
    };

    // Add the network if it's not already configured in the wallet
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
                            decimals: 18,
                        },
                        blockExplorerUrls: ["https://testnet.crossfi.io"],
                    },
                ],
            });
        } catch (addError) {
            console.error("Error adding network:", addError);
        }
    };

    // Automatically check for MetaMask and wallet connection on page load
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on("accountsChanged", connectWallet);
            window.ethereum.on("chainChanged", () => window.location.reload());
        }
    }, []);
  return (
    <>

      Wallet Connect Button
            <button
                onClick={connectWallet}
                className="wallet-btn bg-blue-600 top-0 absolute right-0 m-5 p-3 text-center rounded-md"
            >
                {!walletAddress ? "Connect Wallet" : shortenAddress(walletAddress)}
            </button>

            {/* Network Error Display */}
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
            )}
        <Router>
          <Routes>
            <Route path="/" element={<Home address={walletAddress}/>} />
            <Route path="/createInvoice" element={<CreateInvoice address={walletAddress} />} />
            <Route path="/viewInvoice" element={<ViewInvoice address={walletAddress}/>} />
            <Route path="/payInvoice" element={<PayInvoice address={walletAddress}/>} />
            <Route path="/paymentConfirmation/:transactionHash" element={<PaymentConfirmation address={walletAddress}/>} />
          </Routes>
        </Router>
      <ToastContainer />
    </>
  );
}

export default App;
