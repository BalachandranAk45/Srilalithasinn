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
} from "@chakra-ui/react";
// Import Line for Revenue and Bar for Rooms
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

// Register all necessary chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// ----------------------------------------------------
// --- HELPER FUNCTIONS ---
const formatCurrency = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

// --- 12 COLORS FOR 12 MONTHS ---
const monthColors = [
  "#0BC5EA",
  "#38B2AC",
  "#48BB78",
  "#825AD5",
  "#B794F4",
  "#F6E05E",
  "#F56565",
  "#ED8936",
  "#4299E1",
  "#00A3C4",
  "#319795",
  "#592693",
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ----------------------------------------------------
// --- INITIAL STATS DATA (Used as a placeholder) ---
const initialStatsData = [
  {
    title: "Daily Revenue",
    value: "₹0",
    color: "purple.500",
    change: 0,
    type: "increase",
    key: "Today_Received_Amount",
    period: "today",
  },
  {
    title: "Monthly Revenue",
    value: "₹0",
    color: "pink.500",
    change: 0,
    type: "increase",
    key: "Monthly_Received_Amount",
    period: "monthly",
  },
  {
    title: "Yearly Revenue",
    value: "₹0",
    color: "teal.500",
    change: 0,
    type: "increase",
    key: "Yearly_Received_Amount",
    period: "yearly",
  },
  {
    title: "Monthly Expense",
    value: "₹0",
    color: "orange.500",
    change: 0,
    type: "increase",
    key: "Monthly_Expenses",
    period: "monthly",
  },
];

// --- INITIAL CHART DATA (Placeholder values) ---
const initialRevenueData = [350, 380, 420, 450, 500, 580, 620, 550, 480, 430, 400, 490].map((val) => val * 10000);
const initialRoomsData = [900, 950, 1050, 1100, 1250, 1400, 1500, 1350, 1200, 1000, 980, 1280];

// ----------------------------------------------------
// --- CHART OPTIONS (unchanged) ---

const revenueChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#5B2C6F", font: { size: 12 } } },
    title: { display: false },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += formatCurrency(context.parsed.y);
          }
          return label;
        },
      },
    },
  },
  scales: {
    x: { ticks: { color: "#5B2C6F" }, grid: { display: false } },
    y: {
      ticks: {
        color: "#5B2C6F",
        callback: function (value) {
          return "₹" + (value / 100000).toFixed(1) + "L";
        },
      },
    },
  },
};

const roomsChartOptions = {
  ...revenueChartOptions,
  plugins: {
    ...revenueChartOptions.plugins,
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || "";
          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y + " Rooms";
          }
          return label;
        },
      },
    },
  },
  scales: {
    ...revenueChartOptions.scales,
    y: {
      ticks: {
        color: "#5B2C6F",
        callback: function (value) {
          return value;
        },
      },
    },
  },
};

// --- Helper component for uniform chart styling ---
const ChartBox = ({ title, children, isLoading = false }) => {
  const bg = useColorModeValue("white", "gray.700");
  const shadow = useColorModeValue("md", "dark-lg");
  return (
    <Box
      bg={bg}
      p={6}
      borderRadius="lg"
      shadow={shadow}
      h="350px"
      _hover={{ transform: "translateY(-2px)", shadow: "xl", transition: "all 0.2s" }}
    >
      <Text fontWeight="bold" fontSize="lg" mb={4} color={useColorModeValue("gray.700", "white")}>
        {title}
      </Text>
      <Box h="280px" display="flex" alignItems="center" justifyContent="center">
        {isLoading ? (
          <Box textAlign="center">
            <Spinner size="lg" color="teal.500" thickness="3px" />
            <Text mt={4} color="gray.500">Loading chart data...</Text>
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};

// ----------------------------------------------------
// --- 4. DASHBOARD COMPONENT ---
export default function Dashboard() {
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  // State for Tiles
  const [statsData, setStatsData] = useState(initialStatsData);
  const [isLoadingTiles, setIsLoadingTiles] = useState(true);
  const [isErrorTiles, setIsErrorTiles] = useState(false);

  // State for Charts
  const [revenueData, setRevenueData] = useState(initialRevenueData);
  const [roomsData, setRoomsData] = useState(initialRoomsData);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);


  // --- 1. Fetch TILE data on component mount (API 1) ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/get-tile-details");
        if (!response.ok) {
          throw new Error("Tile network response was not ok");
        }
        const result = await response.json();

        if (result.status === "success" && result.data) {
          const fetchedData = result.data;
          const updatedStats = initialStatsData.map((stat) => ({
            ...stat,
            value: formatCurrency(fetchedData[stat.key] || 0),
          }));
          setStatsData(updatedStats);
        } else {
          setIsErrorTiles(true);
          console.error("API response status was not success:", result);
        }
      } catch (error) {
        setIsErrorTiles(true);
        console.error("Error fetching tile statistics:", error);
      } finally {
        setIsLoadingTiles(false);
      }
    };
    fetchStats();
  }, []);

  // --- 2. Fetch CHART data on component mount (API 2) ---
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/get-monthly-trends");
        if (!response.ok) {
          throw new Error("Chart network response was not ok");
        }
        const result = await response.json();

        if (result.status === "success" && result.data) {
          setRevenueData(result.data.monthlyRevenue);
          setRoomsData(result.data.monthlyRooms);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        // Chart can fall back to placeholder data on error
      } finally {
        setIsLoadingCharts(false);
      }
    };
    fetchChartData();
  }, []);


  // --- TILE Content Render Logic ---
  let tileContent;
  if (isLoadingTiles) {
    tileContent = (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="purple.500" thickness="4px" />
        <Text mt={4} color="gray.500">
          Loading financial metrics...
        </Text>
      </Box>
    );
  } else if (isErrorTiles) {
    tileContent = (
      <Alert status="error" mb={8} borderRadius="lg">
        <AlertIcon />
        Failed to load key financial metrics. Please check the server connection (port 8000).
      </Alert>
    );
  } else {
    // Render Data Cards
    tileContent = (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {statsData.map((stat, idx) => (
          <Stat
            key={idx}
            bg={cardBg}
            p={5}
            borderRadius="lg"
            shadow="md"
            borderLeft="3px solid"
            borderColor={stat.color}
            _hover={{ transform: "translateY(-2px)", shadow: "xl", transition: "all 0.2s" }}
          >
            <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">
              {stat.title}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color={useColorModeValue("gray.800", "white")} mt={1}>
              {stat.value}
            </StatNumber>
            <StatHelpText fontSize="sm" mt={2}>
              <StatArrow type={stat.type} />
              <Text as="span" fontWeight="medium" color={stat.type === "increase" ? "green.500" : "red.500"}>
                {stat.change}%
              </Text>{" "}
              vs last period
            </StatHelpText>
          </Stat>
        ))}
      </SimpleGrid>
    );
  }

  // --- Dynamic Chart Data Objects ---
  const dynamicMonthlyRevenueLineData = {
    labels: months,
    datasets: [
      {
        label: "Total Revenue (₹)",
        data: revenueData, // <--- Using state data
        borderColor: "rgba(128,90,213,1)",
        backgroundColor: "rgba(128,90,213,0.2)",
        tension: 0.4,
        pointRadius: 5,
      },
    ],
  };

  const dynamicMonthlyRoomsBarData = {
    labels: months,
    datasets: [
      {
        label: "Total Rooms Booked",
        data: roomsData, // <--- Using state data
        backgroundColor: monthColors,
        borderRadius: 4,
      },
    ],
  };


  // --- Main Dashboard Render ---
  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="100vh">
      {/* 📊 Stats Cards (4 Tiles) */}
      {tileContent}

      {/* 📈 Charts Row (2 Charts - Renders in a single vertical column) */}
      <SimpleGrid columns={{ base: 1 }} spacing={6}>
        {/* 1. Monthly Revenue Line Chart */}
        <ChartBox title={`Monthly Revenue Trend (${new Date().getFullYear()})`} isLoading={isLoadingCharts}>
          <Line data={dynamicMonthlyRevenueLineData} options={revenueChartOptions} />
        </ChartBox>

        {/* 2. Monthly Rooms Booked Bar Chart (Uses 12 Colors) */}
        <ChartBox title={`Monthly Rooms Booked (${new Date().getFullYear()})`} isLoading={isLoadingCharts}>
          <Bar data={dynamicMonthlyRoomsBarData} options={roomsChartOptions} />
        </ChartBox>
      </SimpleGrid>
    </Box>
  );
}