import React, { useContext, useEffect, useState } from "react";
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
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  Divider,
  Box,
  HStack,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { HiMenuAlt3 } from "react-icons/hi";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { NotificationContext } from "../context/NotificationContext";

export default function Topbar({ onLogout }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const { newBookings, resetNewBookings } = useContext(NotificationContext);

  const [user, setUser] = useState({
    username: "",
    role: "",
    email: "",
    profileImage: "",
  });

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    if (onLogout) onLogout();
    navigate("/login");
  };

  // Theme-based colors for gradient and text
  const bgGradient = useColorModeValue(
    "linear(to-r, purple.100, pink.100, whiteAlpha.700)",
    "linear(to-r, purple.900, pink.800, gray.900)"
  );

  const textColor = useColorModeValue("purple.700", "gray.100");
  const hoverBg = useColorModeValue("purple.50", "purple.800");

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        bgGradient={bgGradient}
        backdropFilter="blur(12px)"
        px={{ base: 4, md: 6 }}
        py={3}
        boxShadow="0 2px 15px rgba(128,0,128,0.15)"
        borderBottom="1px solid"
        borderColor={useColorModeValue("purple.200", "purple.700")}
        position="sticky"
        top="0"
        zIndex="1000"
        width="100%"
        height="64px"
        transition="all 0.3s ease"
      >
        {/* Hamburger for mobile */}
        <IconButton
          display={{ base: "flex", md: "none" }}
          icon={<HiMenuAlt3 size="22" />}
          aria-label="menu"
          onClick={onOpen}
          variant="ghost"
          color={textColor}
          _hover={{ bg: hoverBg }}
          borderRadius="full"
          boxShadow="0 0 10px rgba(128,0,128,0.15)"
        />

        {/* App Title or Logo */}
        <Box
          fontWeight="extrabold"
          fontSize="xl"
          bgGradient="linear(to-r, purple.600, pink.400)"
          bgClip="text"
          letterSpacing="wide"
        >
          SriLalitha&apos;s Inn
        </Box>

        {/* Notification + Profile Section */}
        <HStack spacing={4}>
          {/* Notifications */}
          <Box position="relative">
            <Popover placement="bottom-end" isLazy>
              <PopoverTrigger>
                <IconButton
                  icon={<FiBell size="20" />}
                  aria-label="notifications"
                  variant="ghost"
                  borderRadius="full"
                  color={textColor}
                  _hover={{
                    bg: hoverBg,
                    boxShadow: "0 0 12px rgba(128,0,128,0.3)",
                  }}
                  onClick={() => {
                    resetNewBookings();
                    setTimeout(() => navigate("/online-enquiries"), 100);
                  }}
                />
              </PopoverTrigger>
              <PopoverContent
                w="250px"
                borderRadius="lg"
                boxShadow="xl"
                bg={useColorModeValue("white", "gray.800")}
                border="1px solid"
                borderColor={useColorModeValue("purple.100", "purple.700")}
              >
                <PopoverArrow />
                <PopoverHeader
                  fontWeight="700"
                  color={textColor}
                  borderBottom="1px solid"
                  borderColor={useColorModeValue("purple.100", "purple.600")}
                >
                  Notifications
                </PopoverHeader>
                <PopoverBody>
                  {newBookings > 0 ? (
                    <Text fontSize="sm" color={textColor}>
                      {newBookings} new booking{newBookings > 1 ? "s" : ""} received
                    </Text>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      No new bookings
                    </Text>
                  )}
                </PopoverBody>
              </PopoverContent>
            </Popover>

            {/* Notification Badge */}
            {newBookings > 0 && (
              <Badge
                position="absolute"
                top="1"
                right="1"
                bg="red.500"
                color="white"
                fontSize="0.65rem"
                borderRadius="full"
                px={1.5}
                boxShadow="0 0 10px rgba(255,0,0,0.6)"
              >
                {newBookings}
              </Badge>
            )}
          </Box>

          {/* Profile Avatar */}
          <Menu placement="bottom-end" autoSelect={false}>
            <MenuButton>
              <Avatar
                size="sm"
                name={user.username || "User"}
                src={user.profileImage || ""}
                cursor="pointer"
                border="2px solid"
                borderColor="purple.500"
                boxShadow="0 0 12px rgba(128,0,128,0.25)"
                _hover={{
                  transform: "scale(1.05)",
                  boxShadow: "0 0 20px rgba(128,0,128,0.35)",
                  transition: "0.3s ease",
                }}
              />
            </MenuButton>
            <MenuList
              p={3}
              borderRadius="lg"
              shadow="xl"
              border="1px solid"
              borderColor={useColorModeValue("purple.100", "purple.700")}
            >
              <VStack align="start" spacing={1} mb={2}>
                <Text fontWeight="600" fontSize="sm" color={textColor}>
                  {user.username || "User"}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user.role || "Role"}
                </Text>
              </VStack>
              <Divider borderColor={useColorModeValue("purple.100", "purple.700")} />
              <MenuItem
                _hover={{ bg: hoverBg }}
                onClick={() => navigate("/profile")}
              >
                View Profile
              </MenuItem>
              <MenuItem _hover={{ bg: hoverBg }} onClick={handleLogout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Mobile Sidebar Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <Sidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
