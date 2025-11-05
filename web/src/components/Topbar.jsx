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
      >
        {/* Hamburger for mobile */}
        <IconButton
          display={{ base: "flex", md: "none" }}
          icon={<HiMenuAlt3 size="22" />}
          aria-label="menu"
          onClick={onOpen}
          variant="ghost"
        />

        <Box fontWeight="700" fontSize="lg" color="purple.700">
          {/* You can add app logo or title here */}
        </Box>

        {/* Notification + Profile */}
        <HStack spacing={4}>
          <Box position="relative">
            <Popover placement="bottom-end" isLazy>
              <PopoverTrigger>
                <IconButton
                  icon={<FiBell size="20" />}
                  aria-label="notifications"
                  variant="ghost"
                  borderRadius="full"
                  color="gray.600"
                  _hover={{ bg: "gray.100" }}
                  onClick={() => {
                    resetNewBookings();
                    setTimeout(() => navigate("/online-enquiries"), 0);
                  }}
                />
              </PopoverTrigger>
              <PopoverContent w="220px" borderRadius="md" boxShadow="md">
                <PopoverArrow />
                <PopoverHeader fontWeight="600" borderBottom="1px solid" borderColor="gray.200">
                  Notifications
                </PopoverHeader>
                <PopoverBody>
                  {newBookings > 0 ? (
                    <Text fontSize="sm">
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

            {/* Small badge */}
            {newBookings > 0 && (
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
                {newBookings}
              </Badge>
            )}
          </Box>

          <Menu placement="bottom-end">
            <MenuButton>
              <Avatar
                size="sm"
                name={user.username || "User"}
                src={user.profileImage || ""} // dynamic image with fallback
                cursor="pointer"
                border="2px solid"
                borderColor="purple.500"
                _hover={{ boxShadow: "md" }}
              />
            </MenuButton>
            <MenuList p={3} shadow="md" minW="200px">
              <VStack align="start" spacing={1} mb={2}>
                <Text fontWeight="600" fontSize="sm" color="gray.700">
                  {user.username || "User"}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user.role || "Role"}
                </Text>
              </VStack>
              <Divider />
              <MenuItem >View Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <Sidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
