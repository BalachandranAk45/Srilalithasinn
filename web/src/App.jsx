import React, { useState } from "react";
import { ChakraProvider, theme } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ExpensePage from "./pages/Expense.Jsx";
import Home from "./pages/Home";
import BookingPage from "./pages/Booking";
import BookingSummary from "./pages/BookingSummary";
import Login from "./pages/Login";
import ReportPage from "./pages/Report";
import OnlineEnquiries from "./pages/Onlineenquires";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem("auth") === "true");

  const handleLoginSuccess = () => {
    sessionStorage.setItem("auth", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("auth");
    setIsAuthenticated(false);
  };

  return (
    <ChakraProvider theme={theme}>
      <NotificationProvider> {/* ✅ Wrap Router with NotificationProvider */}
        <Router>
          <Routes>
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            {isAuthenticated ? (
              <Route path="/" element={<Layout onLogout={handleLogout} />}>
                <Route index element={<Home />} />
                <Route path="booking" element={<BookingPage />} />
                <Route path="summary" element={<BookingSummary />} />
                <Route path="report" element={<ReportPage />} />
                <Route path="expense" element={<ExpensePage />} />
                <Route path="online-enquiries" element={<OnlineEnquiries />} />
              </Route>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </Router>
      </NotificationProvider>
    </ChakraProvider>
  );
}

export default App;

