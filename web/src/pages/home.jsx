// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  SimpleGrid,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
} from "@chakra-ui/react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Helper
const formatCurrency = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

const monthColors = [
  "#0BC5EA", "#38B2AC", "#48BB78", "#825AD5", "#B794F4",
  "#F6E05E", "#F56565", "#ED8936", "#4299E1", "#00A3C4",
  "#319795", "#592693",
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const initialStatsData = [
  { title: "Daily Revenue", value: "₹0", color: "purple.500", change: 0, type: "increase", key: "Today_Received_Amount" },
  { title: "Monthly Revenue", value: "₹0", color: "pink.500", change: 0, type: "increase", key: "Monthly_Received_Amount" },
  { title: "Yearly Revenue", value: "₹0", color: "teal.500", change: 0, type: "increase", key: "Yearly_Received_Amount" },
  { title: "Monthly Expense", value: "₹0", color: "orange.500", change: 0, type: "increase", key: "Monthly_Expenses" },
];

const initialRevenueData = [350, 380, 420, 450, 500, 580, 620, 550, 480, 430, 400, 490].map((v) => v * 10000);
const initialRoomsData = [900, 950, 1050, 1100, 1250, 1400, 1500, 1350, 1200, 1000, 980, 1280];

// Chart options
const revenueChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#4A148C", font: { size: 13 } } },
    tooltip: {
      callbacks: {
        label: (context) => `₹${context.parsed.y.toLocaleString("en-IN")}`,
      },
    },
  },
  scales: {
    x: { ticks: { color: "#4A148C" }, grid: { display: false } },
    y: {
      ticks: {
        color: "#4A148C",
        callback: (value) => "₹" + (value / 100000).toFixed(1) + "L",
      },
    },
  },
};

const roomsChartOptions = {
  ...revenueChartOptions,
  plugins: {
    ...revenueChartOptions.plugins,
    tooltip: {
      callbacks: { label: (context) => `${context.parsed.y} Rooms` },
    },
  },
  scales: { ...revenueChartOptions.scales },
};

// Chart Container (themed)
const ChartBox = ({ title, children, isLoading = false }) => (
  <Box
    bgGradient="linear(to-br, whiteAlpha.900, purple.50)"
    p={6}
    borderRadius="2xl"
    boxShadow="0 0 25px rgba(128,0,128,0.15)"
    backdropFilter="blur(12px)"
    w="100%"
    h="400px"
    transition="all 0.3s ease"
    _hover={{ transform: "translateY(-4px)", boxShadow: "0 0 30px rgba(128,0,128,0.3)" }}
  >
    <Text
      fontWeight="extrabold"
      fontSize="lg"
      mb={4}
      bgGradient="linear(to-r, purple.600, pink.400)"
      bgClip="text"
    >
      {title}
    </Text>
    <Box h="320px" display="flex" alignItems="center" justifyContent="center">
      {isLoading ? (
        <Flex direction="column" align="center" justify="center">
          <Spinner size="lg" color="purple.500" thickness="3px" />
          <Text mt={3} color="gray.500">
            Loading chart data...
          </Text>
        </Flex>
      ) : (
        children
      )}
    </Box>
  </Box>
);

export default function Dashboard() {
  const bg = useColorModeValue("linear(to-b, purple.50, white)", "linear(to-b, gray.900, purple.900)");
  const cardBg = useColorModeValue("whiteAlpha.900", "gray.800");

  const [statsData, setStatsData] = useState(initialStatsData);
  const [isLoadingTiles, setIsLoadingTiles] = useState(true);
  const [isErrorTiles, setIsErrorTiles] = useState(false);
  const [revenueData, setRevenueData] = useState(initialRevenueData);
  const [roomsData, setRoomsData] = useState(initialRoomsData);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);

  // Fetch Tiles
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/get-tile-details");
        const result = await response.json();
        if (result.status === "success") {
          const updated = initialStatsData.map((stat) => ({
            ...stat,
            value: formatCurrency(result.data[stat.key] || 0),
          }));
          setStatsData(updated);
        } else setIsErrorTiles(true);
      } catch {
        setIsErrorTiles(true);
      } finally {
        setIsLoadingTiles(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch Chart Data
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/get-monthly-trends");
        const result = await response.json();
        if (result.status === "success") {
          setRevenueData(result.data.monthlyRevenue);
          setRoomsData(result.data.monthlyRooms);
        }
      } finally {
        setIsLoadingCharts(false);
      }
    };
    fetchCharts();
  }, []);

  return (
    <Box
      p={{ base: 4, md: 8 }}
      bgGradient={bg}
      minH="100vh"
      transition="background 0.4s ease"
    >
      {/* 📊 Metric Tiles */}
      {isLoadingTiles ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="purple.500" thickness="4px" />
          <Text mt={4} color="gray.500">
            Loading financial metrics...
          </Text>
        </Box>
      ) : isErrorTiles ? (
        <Alert status="error" mb={8} borderRadius="lg">
          <AlertIcon />
          Failed to load key financial metrics. Please check the server connection.
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
          {statsData.map((stat, idx) => (
            <Stat
              key={idx}
              bgGradient={`linear(to-br, whiteAlpha.900, ${stat.color}15)`}
              p={6}
              borderRadius="2xl"
              shadow="md"
              borderLeft="5px solid"
              borderColor={stat.color}
              transition="all 0.3s ease"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "0 0 25px rgba(128,0,128,0.3)",
              }}
            >
              <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">
                {stat.title}
              </StatLabel>
              <StatNumber
                fontSize="2xl"
                fontWeight="bold"
                color={useColorModeValue("purple.800", "white")}
                mt={1}
              >
                {stat.value}
              </StatNumber>
              <StatHelpText fontSize="sm" mt={2}>
                <StatArrow type={stat.type} />
                <Text as="span" fontWeight="medium" color="green.400">
                  {stat.change}%
                </Text>{" "}
                vs last period
              </StatHelpText>
            </Stat>
          ))}
        </SimpleGrid>
      )}

      {/* 📈 Charts (1 per row) */}
      <SimpleGrid columns={1} spacing={8}>
        <ChartBox
          title={`Monthly Revenue Trend (${new Date().getFullYear()})`}
          isLoading={isLoadingCharts}
        >
          <Line
            data={{
              labels: months,
              datasets: [
                {
                  label: "Total Revenue (₹)",
                  data: revenueData,
                  borderColor: "rgba(128,90,213,1)",
                  backgroundColor: "rgba(128,90,213,0.2)",
                  tension: 0.4,
                },
              ],
            }}
            options={revenueChartOptions}
          />
        </ChartBox>

        <ChartBox
          title={`Monthly Rooms Booked (${new Date().getFullYear()})`}
          isLoading={isLoadingCharts}
        >
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: "Total Rooms Booked",
                  data: roomsData,
                  backgroundColor: monthColors,
                  borderRadius: 6,
                },
              ],
            }}
            options={roomsChartOptions}
          />
        </ChartBox>
      </SimpleGrid>
    </Box>
  );
}
