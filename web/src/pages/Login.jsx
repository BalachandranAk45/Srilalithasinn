import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Text,
  useColorModeValue,
  Card,
  CardBody,
  Divider,
  ScaleFade,
  FormErrorMessage,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { showStatusToast, ToastMessageContainer } from "../components/toast";

export default function Login({ onLoginSuccess }) {
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    role: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    role: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // Clear error on change
  };

  const handleLogin = async () => {
    const { username, password, role } = loginData;

    let hasError = false;
    const newErrors = { username: "", password: "", role: "" };
    if (!username) {
      newErrors.username = "Username required";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Password required";
      hasError = true;
    }
    if (!role) {
      newErrors.role = "Role required";
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;

    try {
      const res = await fetch("http://localhost:8000/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        showStatusToast("error", data.message || "Login failed");
        return;
      }

      showStatusToast("success", "Logged in successfully!");
      onLoginSuccess();

      setTimeout(() => navigate("/"), 800);
    } catch (err) {
      showStatusToast("error", "Server not reachable");
      console.error(err);
    }
  };

  const cardBg = useColorModeValue("rgba(255, 255, 255, 0.12)", "gray.800");

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      position="relative"
      bgImage="url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80')"
      bgSize="cover"
      bgPosition="center"
      _before={{
        content: `""`,
        position: "absolute",
        top: 0,
        left: 0,
        w: "100%",
        h: "100%",
        bgGradient: "linear(to-b, rgba(0,0,0,0.6), rgba(0,0,0,0.7))",
        zIndex: 0,
      }}
    >
      <ToastMessageContainer />
      <ScaleFade in={true} initialScale={0.95}>
        <Box position="relative" zIndex={1} w="full" maxW={{ base: "90%", sm: "480px", md: "520px" }} mx="auto" p={6}>
          <Card
            borderRadius="2xl"
            shadow="2xl"
            bg="rgba(255, 255, 255, 0.15)"
            backdropFilter="blur(18px)"
            border="1px solid rgba(255,255,255,0.2)"
            h={{ base: "auto", md: "80%" }}
            transition="all 0.4s ease"
            _hover={{
              transform: "translateY(-5px)",
              shadow: "xl",
            }}
          >
            <CardBody px={10} py={8}>
              <VStack spacing={5} align="stretch">
                <Heading size="lg" fontWeight="700" textAlign="center" letterSpacing="wide" color="white">
                  Welcome to{" "}
                  <Text as="span" bgGradient="linear(to-r, teal.300, green.400)" bgClip="text">
                    SriLalitha’s Inn
                  </Text>
                </Heading>

                <Divider borderColor="whiteAlpha.400" />

                <FormControl isInvalid={!!errors.username}>
                  <FormLabel color="whiteAlpha.800" fontWeight="600">
                    Username
                  </FormLabel>
                  <Input
                    name="username"
                    size="lg"
                    bg="whiteAlpha.200"
                    color="white"
                    border="1px solid rgba(255,255,255,0.2)"
                    borderRadius="xl"
                    _placeholder={{ color: "whiteAlpha.700" }}
                    _focus={{
                      borderColor: "teal.300",
                      boxShadow: "0 0 0 1px teal.400",
                    }}
                    value={loginData.username}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.username}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel color="whiteAlpha.800" fontWeight="600">
                    Password
                  </FormLabel>
                  <Input
                    type="password"
                    name="password"
                    size="lg"
                    bg="whiteAlpha.200"
                    color="white"
                    border="1px solid rgba(255,255,255,0.2)"
                    borderRadius="xl"
                    _placeholder={{ color: "whiteAlpha.700" }}
                    _focus={{
                      borderColor: "teal.300",
                      boxShadow: "0 0 0 1px teal.400",
                    }}
                    value={loginData.password}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.role}>
                  <FormLabel color="whiteAlpha.800" fontWeight="600">
                    Role
                  </FormLabel>
                  <Select
                    name="role"
                    placeholder="Select role"
                    size="lg"
                    bg="whiteAlpha.200"
                    color="black"
                    border="1px solid rgba(255,255,255,0.2)"
                    borderRadius="xl"
                    _placeholder={{ color: "whiteAlpha.700" }}
                    _focus={{
                      borderColor: "teal.300",
                      boxShadow: "0 0 0 1px teal.400",
                    }}
                    value={loginData.role}
                    onChange={handleChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </Select>
                  <FormErrorMessage>{errors.role}</FormErrorMessage>
                </FormControl>

                <Button
                  w="full"
                  size="lg"
                  mt={2}
                  bgGradient="linear(to-r, teal.400, green.400)"
                  color="white"
                  fontWeight="700"
                  borderRadius="xl"
                  letterSpacing="wide"
                  transition="all 0.3s ease"
                  _hover={{
                    transform: "scale(1.03)",
                    shadow: "xl",
                  }}
                  onClick={handleLogin}
                >
                  Sign In
                </Button>

                <Text fontSize="sm" color="whiteAlpha.700" textAlign="center" mt={4}>
                  © {new Date().getFullYear()} SriLalitha’s Inn. All Rights Reserved.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </ScaleFade>
    </Flex>
  );
}
