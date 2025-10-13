import React from "react";
import {
  Flex,
  IconButton,
  Avatar,
  useColorMode,
  Button,
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
  HStack,
} from "@chakra-ui/react";
import { FiMoon, FiSun } from "react-icons/fi";
import { HiMenuAlt3 } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Topbar({ onLogout }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <>
      <Flex align="center" mb="6" px={2}>
        {/* Hamburger Menu for mobile */}
        <IconButton
          display={{ base: "block", md: "none" }}
          icon={<HiMenuAlt3 size="24" />}
          aria-label="menu"
          onClick={onOpen}
          variant="ghost"
        />

        {/* Spacer pushes right items to end */}
        <Flex ml="auto" align="center" gap={3}>
          {/* Theme Toggle */}
          {/* <Button
            onClick={toggleColorMode}
            leftIcon={colorMode === "light" ? <FiMoon /> : <FiSun />}
            size="sm"
          >
            Theme
          </Button> */}

          {/* Professional Profile Avatar */}
          <Menu>
            <MenuButton>
              <HStack cursor="pointer" spacing={2}>
                <Avatar
                  size="md"
                  name="Ravi Kumar"
                  src="https://bit.ly/dan-abramov" // replace with user photo
                />
                <VStack align="start" spacing={0} display={{ base: "none", md: "flex" }}>
                  <Text fontWeight="600" fontSize="sm">
                    Ravi Kumar
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Admin
                  </Text>
                </VStack>
              </HStack>
            </MenuButton>
            <MenuList>
              <VStack align="start" spacing={1} px={4} py={3}>
                <Text fontWeight="600">Ravi Kumar</Text>
                <Text fontSize="sm" color="gray.500">
                  Admin
                </Text>
              </VStack>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* Sidebar Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <Sidebar onClose={onClose} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
