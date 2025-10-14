import React, { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Button,
  useColorModeValue,
  IconButton,
  Tooltip,
  HStack,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { FiHome, FiCalendar, FiUser, FiFileText, FiMenu } from "react-icons/fi";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("purple.100", "purple.700");
  const location = useLocation();

  const links = [
    { name: "Home", path: "/", icon: <FiHome /> },
    { name: "Booking", path: "/booking", icon: <FiCalendar /> },
    { name: "Summary", path: "/summary", icon: <FiUser /> },
    { name: "Report", path: "/report", icon: <FiFileText /> },
    { name: "Expense", path: "/expense", icon: <FiCalendar /> },
  ];

  return (
    <Box
      bg={bg}
      w={{ base: isCollapsed ? "60px" : "260px", md: isCollapsed ? "60px" : "260px" }}
      minH="100vh"
      position="sticky"
      top="0"
      left="0"
      zIndex="999"
      boxShadow="xl"
      transition="width 0.3s"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box>
        {/* Header with toggle */}
        <HStack m="4" spacing="3" alignItems="center">
          <IconButton
            icon={<FiMenu />}
            aria-label="Toggle Sidebar"
            onClick={() => setIsCollapsed(!isCollapsed)}
            colorScheme="purple"
            size="md"
            ml={-2}
          />
          {!isCollapsed && (
            <Heading size="md" color="purple.700" textAlign="left" mb="0">
              SriLalitha&apos;s Inn
            </Heading>
          )}
        </HStack>

        {/* Navigation Links */}
        <VStack align="stretch" spacing="3" overflowY="auto">
          {links.map((link) => (
            <Tooltip
              key={link.name}
              label={isCollapsed ? link.name : ""}
              placement="right"
              hasArrow
            >
              <Button
                as={RouterLink}
                to={link.path}
                variant="ghost"
                bg={location.pathname === link.path ? hoverBg : "transparent"}
                color={location.pathname === link.path ? "purple.800" : "purple.700"}
                justifyContent={isCollapsed ? "center" : "flex-start"}
                leftIcon={link.icon}
                _hover={{
                  bg: hoverBg,
                  color: "purple.800",
                }}
              >
                {!isCollapsed && link.name}
              </Button>
            </Tooltip>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}
