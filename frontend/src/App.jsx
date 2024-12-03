import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CreateInvoice from "./pages/CreateInvoice";
import ViewInvoice from "./pages/ViewInvoice";
import PayInvoice from "./pages/PayInvoice";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import {ToastContainer} from 'react-toastify'

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/createInvoice" element={<CreateInvoice />} />
        <Route path="/viewInvoice" element={<ViewInvoice />} />
        <Route path="/payInvoice" element={<PayInvoice />} />
        <Route path="/paymentConfirmation/:transactionHash" element={<PaymentConfirmation />} />
      </Routes>
    </Router>
    <ToastContainer/>
    </>
  );
}

export default App;
