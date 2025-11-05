import React, { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Button,
  IconButton,
  Tooltip,
  HStack,
  Divider,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
  FiUser,
  FiFileText,
  FiMenu,
  FiPower,
} from "react-icons/fi";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Colors
  const bgGradient = useColorModeValue(
    "linear(to-b, purple.50, purple.100, purple.200)",
    "linear(to-b, gray.900, purple.900)"
  );
  const activeBg = useColorModeValue("purple.200", "purple.700");
  const hoverBg = useColorModeValue("purple.100", "purple.800");
  const textColor = useColorModeValue("gray.700", "gray.100");
  const activeColor = useColorModeValue("purple.800", "white");

  const links = [
    { name: "Home", path: "/", icon: <FiHome /> },
    { name: "Booking", path: "/booking", icon: <FiCalendar /> },
    { name: "Summary", path: "/summary", icon: <FiUser /> },
    { name: "Report", path: "/report", icon: <FiFileText /> },
    { name: "Expense", path: "/expense", icon: <FiCalendar /> },
    { name: "Online Enquiries", path: "/online-enquiries", icon: <FiFileText /> },
  ];

  return (
    <MotionBox
      bgGradient={bgGradient}
      backdropFilter="blur(12px)"
      borderRight="1px solid"
      borderColor={useColorModeValue("purple.200", "purple.800")}
      w={{ base: isCollapsed ? "70px" : "260px" }}
      minH="150vh"
      boxShadow="0 0 25px rgba(128,0,128,0.15)"
      transition="all 0.3s ease"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      position="sticky"
      top="0"
      zIndex="999"
    >
      <Box>
        {/* Header */}
        <HStack spacing="3" align="center" p="4">
          <IconButton
            icon={<FiMenu />}
            aria-label="Toggle Sidebar"
            onClick={() => setIsCollapsed(!isCollapsed)}
            colorScheme="purple"
            variant="ghost"
            _hover={{ bg: hoverBg }}
            size="md"
          />
          {!isCollapsed && (
            <Heading
              size="md"
              bgGradient="linear(to-r, purple.600, pink.400)"
              bgClip="text"
              fontWeight="extrabold"
            >
              SriLalitha&apos;s Inn
            </Heading>
          )}
        </HStack>

        <Divider borderColor={useColorModeValue("purple.200", "purple.700")} />

        {/* Navigation */}
        <VStack align="stretch" spacing="2" mt="4" px="2">
          {links.map((link, index) => {
            const isActive = location.pathname === link.path;
            return (
              <Tooltip
                key={link.name}
                label={isCollapsed ? link.name : ""}
                placement="right"
                hasArrow
              >
                <MotionBox
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    as={RouterLink}
                    to={link.path}
                    justifyContent={isCollapsed ? "center" : "flex-start"}
                    leftIcon={link.icon}
                    variant="ghost"
                    size="lg"
                    fontWeight="semibold"
                    color={isActive ? activeColor : textColor}
                    bg={isActive ? activeBg : "transparent"}
                    _hover={{
                      bg: hoverBg,
                      transform: "translateX(5px)",
                      boxShadow: "0 0 10px rgba(128,0,128,0.3)",
                    }}
                    borderRadius="lg"
                    transition="all 0.3s"
                    px={isCollapsed ? 0 : 4}
                  >
                    {!isCollapsed && link.name}
                  </Button>
                </MotionBox>
              </Tooltip>
            );
          })}
        </VStack>
      </Box>

      {/* Footer */}
      <Box p="4">
        <Divider borderColor={useColorModeValue("purple.200", "purple.700")} mb="3" />
        <HStack justify={isCollapsed ? "center" : "space-between"}>
          {!isCollapsed && (
            <Text fontSize="sm" color={textColor}>
              © 2025 SriLalitha&apos;s Inn
            </Text>
          )}
          <Tooltip label="Logout" placement="right">
            <IconButton
              icon={<FiPower />}
              colorScheme="purple"
              variant="ghost"
              _hover={{ bg: hoverBg }}
              aria-label="Logout"
            />
          </Tooltip>
        </HStack>
      </Box>
    </MotionBox>
  );
}
