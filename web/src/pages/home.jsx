// src/pages/Dashboard.jsx
import React from "react";
import { Box, SimpleGrid, Text, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, useColorModeValue } from "@chakra-ui/react";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register all necessary chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// --- HELPER FUNCTIONS ---
// Helper function to format currency in ₹
const formatCurrency = (value) => `₹${value.toLocaleString('en-IN')}`;

// --- 1. STATS DATA ---
const statsData = [
  { title: "Daily Revenue", value: "₹1,25,000", color: "purple.500", change: 2.5, type: "increase" },
  { title: "ADR (Avg. Daily Rate)", value: "₹5,500", color: "pink.500", change: 1.2, type: "increase" },
  { title: "Occupancy Rate", value: "75%", color: "teal.500", change: 0.8, type: "decrease" },
  { title: "Monthly Expense", value: "₹2,50,000", color: "orange.500", change: 0.5, type: "increase" },
];

// --- 2. CHART DATA (6 Charts) ---

// 2.1 Weekly Revenue Line Chart
const lineData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Revenue (₹)",
      data: [120000, 150000, 170000, 140000, 200000, 230000, 210000],
      borderColor: "rgba(128,90,213,1)",
      backgroundColor: "rgba(128,90,213,0.2)",
      tension: 0.4,
      pointBackgroundColor: "rgba(128,90,213,1)",
      pointRadius: 5,
    },
  ],
};

// 2.2 Rooms Booked Bar Chart
const roomsBarData = {
  labels: ["Single", "Double", "Suite", "Deluxe"],
  datasets: [
    {
      label: "Rooms Booked",
      data: [50, 80, 40, 70],
      backgroundColor: ["#A084CA", "#B19CD9", "#C1A3E0", "#D1B8EB"],
      borderRadius: 6,
    },
  ],
};

// 2.3 Monthly Income Pie Chart
const incomePieData = {
  labels: ["Rooms (₹)", "Dining (₹)", "Spa (₹)", "Other (₹)"],
  datasets: [
    {
      label: "Income Distribution (₹)",
      data: [1500000, 450000, 200000, 100000],
      backgroundColor: ["#38A169", "#48BB78", "#68D391", "#9AE6B4"],
      borderColor: "white",
      borderWidth: 2,
    },
  ],
};

// 2.4 Monthly Expenses Bar Chart
const expenseBarData = {
  labels: ["Salaries", "Utilities", "Supplies", "Marketing", "Maintenance"],
  datasets: [
    {
      label: "Expenses (₹)",
      data: [100000, 50000, 30000, 40000, 30000],
      backgroundColor: "#E53E3E",
      borderRadius: 6,
    },
  ],
};

// 2.5 Average Daily Rate (ADR) Line Chart
const adrLineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "ADR (₹)",
        data: [4800, 5100, 5500, 5300, 5800, 6000],
        borderColor: "#0BC5EA",
        backgroundColor: "rgba(11, 197, 234, 0.2)",
        tension: 0.5,
        pointRadius: 5,
        pointBackgroundColor: "#0BC5EA",
      },
    ],
  };

// 2.6 Occupancy Rate Doughnut Chart
const totalRooms = 300;
const occupiedRooms = 225;
const availableRooms = totalRooms - occupiedRooms;

const occupancyDoughnutData = {
    labels: [`Occupied (${occupiedRooms} Rooms)`, `Available (${availableRooms} Rooms)`],
    datasets: [
      {
        label: "Room Count",
        data: [occupiedRooms, availableRooms],
        backgroundColor: ["#805AD5", "#E9D8FD"],
        borderColor: "white",
        borderWidth: 2,
      },
    ],
  };


// --- 3. CHART OPTIONS ---

// Global options for Line/Bar charts
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#5B2C6F", font: { size: 12 } } },
    title: { display: false },
    tooltip: {
        callbacks: {
            // Tooltip for financial charts
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += formatCurrency(context.parsed.y);
                }
                return label;
            }
        }
    }
  },
  scales: {
    x: { ticks: { color: "#5B2C6F" }, grid: { display: false } },
    y: { 
        ticks: { 
            color: "#5B2C6F",
            // Format Y-axis labels for currency
            callback: function(value) {
                if (value >= 1000) {
                    return '₹' + (value / 1000).toFixed(0) + 'K';
                }
                return '₹' + value;
            }
        } 
    },
  },
};

// Options specific for Pie/Doughnut Charts
const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom', labels: { color: "#5B2C6F", font: { size: 12 } } },
        tooltip: { 
            callbacks: { 
                // Tooltip for Income Pie Chart (show currency amount)
                label: (context) => {
                    if (context.datasetIndex === 0 && context.dataset.label === "Income Distribution (₹)") {
                        return `${context.label}: ${formatCurrency(context.parsed)}`;
                    }
                    // Tooltip for Occupancy Doughnut (show number of rooms)
                    if (context.datasetIndex === 0 && context.dataset.label === "Room Count") {
                        return `${context.label}: ${context.parsed} rooms`;
                    }
                    return `${context.label}: ${context.parsed}`;
                } 
            } 
        }
    },
};

// Update chart options for Rooms Booked Bar chart (Y-axis should not show currency)
const roomsChartOptions = {
    ...chartOptions, // Inherit base options
    plugins: {
        ...chartOptions.plugins,
        tooltip: {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y + ' Rooms'; // Show 'Rooms' instead of currency
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        ...chartOptions.scales,
        y: { 
            ticks: { 
                color: "#5B2C6F",
                callback: function(value) { return value; } // Do not format as currency
            } 
        },
    }
};

// --- Helper component for uniform chart styling (MOVED UP FOR READABILITY) ---
const ChartBox = ({ title, children }) => {
    const bg = useColorModeValue("white", "gray.700");
    const shadow = useColorModeValue("md", "dark-lg");
    return (
        <Box
            bg={bg}
            p={6}
            borderRadius="lg" // Slightly smaller border radius
            shadow={shadow} // Simpler, cleaner shadow
            h="350px"
            _hover={{ transform: "translateY(-2px)", shadow: "xl", transition: "all 0.2s" }} // Subtler hover effect
        >
            <Text fontWeight="bold" fontSize="lg" mb={4} color="gray.700">
                {title}
            </Text>
            <Box h="280px">
                {children}
            </Box>
        </Box>
    );
};


// --- 4. DASHBOARD COMPONENT ---
export default function Dashboard() {
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  return (
    <Box p={{ base: 4, md: 8 }} bg={bg} minH="100vh">

      {/* Stats Cards (4 Tiles) */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        {statsData.map((stat, idx) => (
          <Stat
            key={idx}
            bg={cardBg}
            p={5} // Slightly reduced padding
            borderRadius="lg" // Slightly smaller border radius
            shadow="md" // Simpler, minimalist shadow
            borderLeft="3px solid" // Thinner border
            borderColor={stat.color}
            _hover={{ transform: "translateY(-2px)", shadow: "xl", transition: "all 0.2s" }}
          >
            <StatLabel fontSize="sm" color="gray.500" fontWeight="medium">
              {stat.title}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color="gray.800" mt={1}>
              {stat.value}
            </StatNumber>
            <StatHelpText fontSize="sm" mt={2}>
              <StatArrow type={stat.type} />
              <Text as="span" fontWeight="medium" color={stat.type === 'increase' ? 'green.500' : 'red.500'}>{stat.change}%</Text> vs last period
            </StatHelpText>
          </Stat>
        ))}
      </SimpleGrid>

      {/* Chart Row 1 (3 Charts) */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={6}>
        {/* 1. Weekly Revenue Line Chart (Amounts) */}
        <ChartBox title="Weekly Revenue Trend (₹)">
          <Line data={lineData} options={chartOptions} />
        </ChartBox>

        {/* 2. Monthly Income Pie Chart (Amounts) */}
        <ChartBox title="Monthly Income Sources (₹)">
          <Pie data={incomePieData} options={pieChartOptions} />
        </ChartBox>

        {/* 3. ADR Trend Line Chart (Amounts) */}
        <ChartBox title="Average Daily Rate (ADR) Trend (₹)">
          <Line data={adrLineData} options={chartOptions} />
        </ChartBox>
      </SimpleGrid>

      {/* Chart Row 2 (3 Charts) */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {/* 4. Rooms Booked Bar Chart (Numbers) */}
        <ChartBox title="Rooms Booked by Type (Count)">
          <Bar data={roomsBarData} options={roomsChartOptions} />
        </ChartBox>

        {/* 5. Occupancy Rate Doughnut Chart (Numbers) */}
        <ChartBox title="Current Occupancy (Rooms)">
          <Doughnut data={occupancyDoughnutData} options={pieChartOptions} />
        </ChartBox>

        {/* 6. Monthly Expenses Bar Chart (Amounts) */}
        <ChartBox title="Monthly Expenses Breakdown (₹)">
          <Bar data={expenseBarData} options={chartOptions} />
        </ChartBox>
      </SimpleGrid>
    </Box>
  );
}

// NOTE: The ChartBox component is now included just before the Dashboard export.