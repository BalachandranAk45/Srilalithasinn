import React from "react";
import {
  Flex,
  IconButton,
  Avatar,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  VStack,
  Text,
  Divider,
  Box,
  HStack,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import { HiMenuAlt3 } from "react-icons/hi";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Topbar({ onLogout }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        bg="white"
        px={{ base: 4, md: 6 }}
        py={3}
        boxShadow="0 2px 4px rgba(0,0,0,0.05)"
        borderBottom="1px solid"
        borderColor="gray.100"
        position="sticky"
        top="0"
        zIndex="1000"
        width="100%"
        height="64px"
        margin="0"
      >
        {/* Left: Hamburger (for mobile) */}
        <IconButton
          display={{ base: "flex", md: "none" }}
          icon={<HiMenuAlt3 size="22" />}
          aria-label="menu"
          onClick={onOpen}
          variant="ghost"
        />

        {/* Center: App Title */}
        <Box
          fontWeight="700"
          fontSize="lg"
          color="purple.700"
          letterSpacing="wide"
        >
        </Box>

        {/* Right: Notification + Profile */}
        <HStack spacing={4}>
          {/* Notification Icon */}
          <Tooltip label="Notifications" fontSize="sm" hasArrow>
            <Box position="relative">
              <IconButton
                icon={<FiBell size="20" />}
                aria-label="notifications"
                variant="ghost"
                borderRadius="full"
                color="gray.600"
                _hover={{ bg: "gray.100" }}
              />
              <Badge
                position="absolute"
                top="1"
                right="1"
                bg="red.500"
                color="white"
                fontSize="0.6rem"
                borderRadius="full"
                px={1}
              >
                2
              </Badge>
            </Box>
          </Tooltip>

          {/* Profile Avatar */}
          <Menu placement="bottom-end">
            <MenuButton>
              <Avatar
                size="sm"
                name="Ravi Kumar"
                src="https://bit.ly/dan-abramov"
                cursor="pointer"
                border="2px solid"
                borderColor="purple.500"
                _hover={{ boxShadow: "md" }}
              />
            </MenuButton>
            <MenuList p={3} shadow="md" minW="200px">
              <VStack align="start" spacing={1} mb={2}>
                <Text fontWeight="600" fontSize="sm" color="gray.700">
                  Ravi Kumar
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Admin
                </Text>
              </VStack>
              <Divider />
              <MenuItem onClick={() => navigate("/profile")}>View Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Sidebar Drawer for Mobile */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <Sidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
