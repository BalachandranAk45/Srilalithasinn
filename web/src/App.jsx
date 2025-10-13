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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem("auth") === "true");

  const handleLoginSuccess = () => {
    localStorage.setItem("auth", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setIsAuthenticated(false);
  };

  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          {/* ✅ Login route (default entry page) */}
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />

          {/* ✅ Protected routes (only visible after login) */}
          {isAuthenticated ? (
            <Route path="/" element={<Layout onLogout={handleLogout} />}>
              <Route index element={<Home />} />
              <Route path="booking" element={<BookingPage />} />
              <Route path="summary" element={<BookingSummary />} />
              <Route path="report" element={<ReportPage />} />
              <Route path="expense" element={<ExpensePage />} />
            </Route>
          ) : (
            // Redirect unauthenticated users to login page
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
