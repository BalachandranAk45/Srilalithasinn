import React from "react";
import {
  SimpleGrid,
  Box,
  Text,
  Flex,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiDollarSign, FiShoppingCart, FiCheckCircle } from "react-icons/fi";

export default function StatsCards() {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing="6" mb="6">
      {/* Earnings Card */}
      <Box
        bgGradient="linear(to-br, teal.400, teal.600)"
        color="white"
        p="6"
        rounded="2xl"
        shadow="lg"
        transition="0.3s"
        _hover={{ transform: "translateY(-4px)", shadow: "xl" }}
      >
        <Flex align="center" justify="space-between">
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Earnings
            </Text>
            <Text fontSize="2xl" fontWeight="extrabold">
              $5000
            </Text>
          </Box>
          <Icon as={FiDollarSign} boxSize={10} />
        </Flex>
      </Box>

      {/* Sales Card */}
      <Box
        bgGradient="linear(to-br, purple.400, pink.500)"
        color="white"
        p="6"
        rounded="2xl"
        shadow="lg"
        transition="0.3s"
        _hover={{ transform: "translateY(-4px)", shadow: "xl" }}
      >
        <Flex align="center" justify="space-between">
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Sales
            </Text>
            <Text fontSize="2xl" fontWeight="extrabold">
              1200
            </Text>
          </Box>
          <Icon as={FiShoppingCart} boxSize={10} />
        </Flex>
      </Box>

      {/* Tasks Card */}
      <Box
        bgGradient="linear(to-br, orange.400, red.500)"
        color="white"
        p="6"
        rounded="2xl"
        shadow="lg"
        transition="0.3s"
        _hover={{ transform: "translateY(-4px)", shadow: "xl" }}
      >
        <Flex align="center" justify="space-between">
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Tasks
            </Text>
            <Text fontSize="2xl" fontWeight="extrabold">
              75%
            </Text>
          </Box>
          <Icon as={FiCheckCircle} boxSize={10} />
        </Flex>
      </Box>
    </SimpleGrid>
  );
}
