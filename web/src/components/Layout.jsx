// src/components/Layout.jsx
import React from "react";
import { Box } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <Box
      display={{ base: "block", md: "flex" }}
      minH="100vh"
      bg="gray.50"
      overflowX="hidden" // Prevents horizontal scrollbar/shaking
    >
      {/* Sidebar (Desktop) */}
      <Box display={{ base: "none", md: "block" }}>
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Box 
        flex="1" 
        p="0" 
        display="flex"          // Enable flex layout for vertical control
        flexDirection="column"  // Stack children vertically
      >
        <Topbar />
        
        {/* Outlet Content Wrapper */}
        <Box flex="1"> {/* This Box takes up all remaining vertical space */}
          <Outlet /> {/* Page content loads here */}
        </Box>
      </Box>
    </Box>
  );
}