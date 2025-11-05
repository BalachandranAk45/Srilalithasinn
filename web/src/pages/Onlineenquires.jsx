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
  HStack,
  useColorModeValue,
  Input,
  IconButton,
  Button,
} from "@chakra-ui/react";
import { FiSearch, FiSend } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

const OnlineBookings = () => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("whiteAlpha.900", "gray.800");

  const [bookings, setBookings] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffset).toISOString().split("T")[0];
  };

  const fetchBookings = async (pageNum = 1) => {
    try {
      const from = formatDate(fromDate);
      const to = formatDate(toDate);
      const res = await fetch(
        `http://localhost:8000/api/online-bookings?page=${pageNum}&limit=${limit}&from=${from}&to=${to}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch bookings");

      const bookingsArray = Array.isArray(data.bookings) ? data.bookings : [];
      const formattedData = bookingsArray.map((b) => ({
        ...b,
        check_in: b.check_in ? new Date(b.check_in) : null,
        check_out: b.check_out ? new Date(b.check_out) : null,
      }));

      setBookings(formattedData);
      setPage(data.page || pageNum);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  useEffect(() => {
    fetchBookings(page);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings(page);
    }, 10000);
    return () => clearInterval(interval);
  }, [page, fromDate, toDate]);

  const handleSubmit = (booking) => {
    navigate("/booking", { state: { bookingData: booking } });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) fetchBookings(newPage);
  };

  return (
    <Box
      p={{ base: 4, md: 8 }}
      bgGradient="linear(to-br, purple.50, white)"
      minH="100vh"
    >
      {/* Header Section */}
      <Box
        py={4}
        mb={6}
        borderRadius="xl"
        textAlign="center"
        bgGradient="linear(to-r, purple.100, pink.50, whiteAlpha.900)"
        boxShadow="0 2px 20px rgba(128,0,128,0.15)"
      >
        <Heading
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="extrabold"
          bgGradient="linear(to-r, purple.600, pink.400)"
          bgClip="text"
        >
          Online Enquiries
        </Heading>
      </Box>

      {/* Filters */}
      <HStack
        mb={6}
        w="100%"
        justify="center"
        flexWrap="wrap"
        spacing={4}
        borderRadius="xl"
        bgGradient="linear(to-r, whiteAlpha.900, purple.50)"
        boxShadow="md"
        p={4}
      >
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

        <IconButton
          aria-label="Search Bookings"
          icon={<FiSearch />}
          colorScheme="purple"
          onClick={() => fetchBookings(1)}
          size="md"
          boxShadow="0 0 10px rgba(128,0,128,0.25)"
          _hover={{
            bgGradient: "linear(to-r, purple.500, pink.400)",
            transform: "scale(1.05)",
            boxShadow: "0 0 15px rgba(128,0,128,0.4)",
          }}
        />
      </HStack>

      {/* Table */}
      <Box
        bgGradient="linear(to-br, whiteAlpha.900, purple.50)"
        border="1px solid"
        borderColor="purple.100"
        borderRadius="2xl"
        boxShadow="xl"
        p={6}
        overflowX="auto"
        maxHeight="70vh"
        overflowY="auto"
      >
        <Table variant="simple" size="md">
          <Thead
            position="sticky"
            top={0}
            bgGradient="linear(to-r, purple.600, pink.400)"
            zIndex={5}
          >
            <Tr>
              {[
                "Customer Name",
                "Email",
                "Phone",
                "Check-In",
                "Check-Out",
                "Action",
              ].map((head) => (
                <Th key={head} color="white" fontSize="sm">
                  {head}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {bookings.length > 0 ? (
              bookings.map((b, idx) => (
                <Tr
                  key={b.id}
                  bg={idx % 2 === 0 ? "white" : "purple.50"}
                  _hover={{
                    bg: "purple.100",
                    transform: "translateY(-1px)",
                    transition: "all 0.2s",
                    boxShadow: "md",
                  }}
                >
                  <Td>{b.cusname}</Td>
                  <Td>{b.email || "-"}</Td>
                  <Td>{b.phone}</Td>
                  <Td>{b.check_in?.toLocaleDateString()}</Td>
                  <Td>{b.check_out?.toLocaleDateString()}</Td>
                  <Td textAlign="center">
                    <IconButton
                      aria-label="Submit Booking"
                      icon={<FiSend />}
                      isDisabled={b.sts === 1}
                      size="sm"
                      variant="ghost"
                      bg="transparent"
                      colorScheme="purple"
                      _hover={{
                        bg: "purple.100",
                        transform: "scale(1.15)",
                      }}
                      onClick={() => handleSubmit(b)}
                    />
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={6} textAlign="center" color="gray.500" py={4}>
                  No bookings found.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>

        {/* ✅ Pagination unchanged (centered below table) */}
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
    </Box>
  );
};

export default OnlineBookings;
