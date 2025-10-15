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
import { FiSearch, FiSend, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

const OnlineBookings = () => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.800");

  const [bookings, setBookings] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const tzOffset = d.getTimezoneOffset() * 60000; // offset in ms
    const localISO = new Date(d - tzOffset).toISOString().split("T")[0];
    return localISO;
  };

  const fetchBookings = async (pageNum = 1) => {
    try {
      const from = formatDate(fromDate);
      const to = formatDate(toDate);

      const res = await fetch(
        `http://localhost:5000/api/online-bookings?page=${pageNum}&limit=${limit}&from=${from}&to=${to}`
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

  const handleSubmit = (booking) => {
    navigate("/booking", { state: { bookingData: booking } });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchBookings(newPage);
  };

  return (
    <Box p={8}>
      <HStack mb={6} w="100%" justify="space-between" align="end">
        {/* Heading */}
        <Heading fontSize={{ base: "xl", md: "2xl" }} color="purple.700">
          Online Enquiries
        </Heading>

        {/* Filters + Search */}
        <HStack spacing={3} align="end">
          {/* From Date */}
          <Box>
            <Text mb={1} fontSize="sm" color="gray.600">
              From
            </Text>
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date)}
              placeholderText="Select from date"
              customInput={<Input size="md" />}
              dateFormat="dd/MM/yyyy"
            />
          </Box>

          {/* To Date */}
          <Box>
            <Text mb={1} fontSize="sm" color="gray.600">
              To
            </Text>
            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date)}
              placeholderText="Select to date"
              customInput={<Input size="md" />}
              minDate={fromDate}
              dateFormat="dd/MM/yyyy"
            />
          </Box>

          {/* Search Button */}
          <IconButton
            aria-label="Search Bookings"
            icon={<FiSearch />}
            colorScheme="purple"
            onClick={() => fetchBookings(1)}
          />
        </HStack>
      </HStack>

      {/* Bookings Table */}
      <Box bg={cardBg} borderRadius="2xl" boxShadow="xl" p={6} overflowX="auto">
        <Table variant="simple" size="md">
          <Thead>
            <Tr bgGradient="linear(to-r, purple.600, purple.500)">
              <Th color="white" fontSize="sm">
                Customer Name
              </Th>
              <Th color="white" fontSize="sm">
                Email
              </Th>
              <Th color="white" fontSize="sm">
                Phone
              </Th>
              <Th color="white" fontSize="sm">
                Check-In
              </Th>
              <Th color="white" fontSize="sm">
                Check-Out
              </Th>
              <Th color="white" fontSize="sm" textAlign="center">
                Action
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {bookings.length > 0 ? (
              bookings.map((b) => (
                <Tr key={b.id} _hover={{ bg: "purple.50" }}>
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
                      variant="solid"
                      onClick={() => handleSubmit(b)}
                      bg="transparent"
                      _hover={{ bg: "purple.100", transform: "scale(1.1)" }}
                    />
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan="6" textAlign="center" color="gray.500" py={4}>
                  No bookings found.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>

        {/* Pagination */}
        <HStack justify="center" mt={4} spacing={2}>
          <IconButton
            aria-label="Previous Page"
            icon={<FiChevronLeft />}
            onClick={() => handlePageChange(page - 1)}
            isDisabled={page === 1}
          />
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              size="sm"
              colorScheme={page === i + 1 ? "purple" : "gray"}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <IconButton
            aria-label="Next Page"
            icon={<FiChevronRight />}
            onClick={() => handlePageChange(page + 1)}
            isDisabled={page === totalPages}
          />
        </HStack>
      </Box>
    </Box>
  );
};

export default OnlineBookings;
