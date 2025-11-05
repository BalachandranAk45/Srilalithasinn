import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  VStack,
  HStack,
  useColorModeValue,
  Card,
  CardBody,
  SimpleGrid,
  Input,
  IconButton,
  Button,
} from "@chakra-ui/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiSearch } from "react-icons/fi";

const ReportPage = () => {
  const cardBg = useColorModeValue("whiteAlpha.900", "gray.800");

  const [bookings, setBookings] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchReport = async (pageNum = 1) => {
    try {
      const params = new URLSearchParams();
      params.append("page", pageNum);
      params.append("limit", limit);

      const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };

      if (fromDate) params.append("fromDate", formatDate(fromDate));
      if (toDate) params.append("toDate", formatDate(toDate));

      const res = await fetch(`http://localhost:8000/api/report?${params.toString()}`);
      const data = await res.json();

      const formattedData = data.bookings.map((b) => ({
        ...b,
        checkIn: new Date(b.checkIn),
        checkOut: new Date(b.checkOut),
      }));

      setBookings(formattedData);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSearch = () => fetchReport(1);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) fetchReport(newPage);
  };

  return (
    <Box
      p={{ base: 4, md: 8 }}
      bgGradient="linear(to-br, purple.50, white)"
      minH="100vh"
    >
      {/* Header Section */}
      <Box
        position="sticky"
        top="0"
        zIndex="sticky"
        py={4}
        mb={8}
        borderRadius="xl"
        bgGradient="linear(to-r, purple.100, pink.50, whiteAlpha.800)"
        boxShadow="0 2px 20px rgba(128,0,128,0.15)"
        textAlign="center"
      >
        <Heading
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="extrabold"
          bgGradient="linear(to-r, purple.600, pink.400)"
          bgClip="text"
        >
          Report Summary
        </Heading>
      </Box>

      {/* Filters */}
      <Box
        mb={6}
        display="flex"
        flexDirection={{ base: "column", md: "row" }}
        alignItems="center"
        justifyContent="space-between"
        gap={4}
      >
        <HStack spacing={4} flexWrap="wrap">
          {/* From Date */}
          <Box>
            <Text mb={1} fontSize="sm" color="gray.600" fontWeight="600">
              From
            </Text>
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              placeholderText="Select from date"
              customInput={<Input size="md" bg="white" />}
              dateFormat="dd/MM/yyyy"
            />
          </Box>

          {/* To Date */}
          <Box>
            <Text mb={1} fontSize="sm" color="gray.600" fontWeight="600">
              To
            </Text>
            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date)}
              placeholderText="Select to date"
              customInput={<Input size="md" bg="white" />}
              minDate={fromDate}
              dateFormat="dd/MM/yyyy"
            />
          </Box>

          {/* Search */}
          <IconButton
            aria-label="Search Report"
            icon={<FiSearch />}
            colorScheme="purple"
            variant="solid"
            size="md"
            mt={{ base: 4, md: 6 }}
            onClick={handleSearch}
            boxShadow="0 0 12px rgba(128,0,128,0.25)"
            _hover={{
              bgGradient: "linear(to-r, purple.500, pink.400)",
              transform: "scale(1.05)",
              boxShadow: "0 0 20px rgba(128,0,128,0.4)",
            }}
          />
        </HStack>
      </Box>

      {/* Desktop Table */}
      <Box
        display={{ base: "none", md: "block" }}
        bgGradient="linear(to-br, whiteAlpha.900, purple.50)"
        border="1px solid"
        borderColor="purple.100"
        borderRadius="2xl"
        boxShadow="xl"
        p={6}
      >
        <Table variant="simple" size="md">
          <Thead>
            <Tr bgGradient="linear(to-r, purple.600, pink.400)">
              {["Customer", "Mobile", "Room / Hall No", "Check-In", "Check-Out", "Amount"].map(
                (head) => (
                  <Th key={head} color="white" fontSize="sm">
                    {head}
                  </Th>
                )
              )}
            </Tr>
          </Thead>
          <Tbody>
            {bookings.map((b, idx) => (
              <Tr
                key={b.booking_id}
                bg={idx % 2 === 0 ? "white" : "purple.50"}
                _hover={{
                  bg: "purple.100",
                  transform: "translateY(-1px)",
                  transition: "all 0.2s",
                }}
              >
                <Td>{b.name}</Td>
                <Td>{b.mobile}</Td>
                <Td>{b.room_no}</Td>
                <Td>{b.checkIn.toLocaleDateString()}</Td>
                <Td>{b.checkOut.toLocaleDateString()}</Td>
                <Td fontWeight="600" color="purple.700">
                  ₹{b.total_amount}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {/* ✅ Pagination (unchanged position) */}
        <HStack mt={4} justify="center" spacing={2}>
          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            variant="outline"
          >
            Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              size="sm"
              colorScheme={p === page ? "purple" : "gray"}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </HStack>
      </Box>

      {/* Mobile Cards */}
      <SimpleGrid
        columns={{ base: 1 }}
        spacing={4}
        display={{ base: "grid", md: "none" }}
        mt={2}
      >
        {bookings.map((b) => (
          <Card
            key={b.booking_id}
            bgGradient="linear(to-br, whiteAlpha.900, purple.50)"
            shadow="xl"
            borderRadius="2xl"
            border="1px solid"
            borderColor="purple.100"
            _hover={{
              transform: "translateY(-2px)",
              transition: "0.3s ease",
              boxShadow: "0 0 15px rgba(128,0,128,0.25)",
            }}
          >
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontWeight="700" color="purple.700">
                  {b.name} ({b.mobile})
                </Text>
                <Text fontSize="sm">Room / Hall: {b.room_no}</Text>
                <Text fontSize="sm">
                  Check-In: {b.checkIn.toLocaleDateString()}
                </Text>
                <Text fontSize="sm">
                  Check-Out: {b.checkOut.toLocaleDateString()}
                </Text>
                <Text fontWeight="bold" color="pink.600">
                  Amount: ₹{b.total_amount}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ReportPage;
