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
      minH="150vh"
      w={{ base: isCollapsed ? "60px" : "260px", md: isCollapsed ? "60px" : "260px" }}
      transition="width 0.3s"
      boxShadow="xl"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box>
        {/* Icon + Name side by side */}
        <HStack m="4" spacing="3" alignItems="center">
          <IconButton
            icon={<FiMenu />}
            aria-label="Toggle Sidebar"
            onClick={() => setIsCollapsed(!isCollapsed)}
            colorScheme="purple"
            size="md"
          />
          {!isCollapsed && (
            <Heading size="md" color="purple.700" textAlign="left" mb="0">
              SriLalitha's Inn
            </Heading>
          )}
        </HStack>

        {/* Links */}
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
                variant={location.pathname === link.path ? "solid" : "ghost"}
                bg={location.pathname === link.path ? "purple.600" : "transparent"}
                color={location.pathname === link.path ? "white" : "purple.700"}
                justifyContent={isCollapsed ? "center" : "flex-start"}
                leftIcon={link.icon}
                _hover={{
                  bg: location.pathname === link.path ? "purple.700" : hoverBg,
                  color: location.pathname === link.path ? "white" : "purple.800",
                }}
                borderRadius="lg"
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
