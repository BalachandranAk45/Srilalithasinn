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
  Divider,
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
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffset).toISOString().split("T")[0];
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
      setTotalCount(data.totalCount || bookingsArray.length); // Update total count
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBookings(page);
  }, []);

  // Polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings(page);
    }, 10000); // 10 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [page, fromDate, toDate]);

  const handleSubmit = (booking) => {
    navigate("/booking", { state: { bookingData: booking } });
  };
  useEffect(() => {
    if (location.state?.reset) {
      resetNewBookings();
    }
  }, []);
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchBookings(newPage);
  };

  return (
    <Box p={8}>
      {/* Heading + Filters */}
      <Box position="sticky" top={0} zIndex={10} bg={"Transpreant"} pb={4}>
        <HStack mb={6} w="100%" justify="space-between" align="end">
          <Heading fontSize={{ base: "xl", md: "2xl" }} fontWeight="600" color="purple.700" mt={8}>
            Online Enquiries
          </Heading>
          <HStack spacing={3} align="end">
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
            <IconButton
              aria-label="Search Bookings"
              icon={<FiSearch />}
              colorScheme="purple"
              onClick={() => fetchBookings(1)}
            />
          </HStack>
        </HStack>
      </Box>

      {/* Scrollable Table */}
      <Box bg={cardBg} borderRadius="2xl" boxShadow="xl" p={6} overflowX="auto" maxHeight="70vh" overflowY="auto">
        <Table variant="simple" size="md">
          <Thead position="sticky" top={0} bgGradient="linear(to-r, purple.600, purple.500)" zIndex={5}>
            <Tr>
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
              bookings.map((b, idx) => (
                <Tr
                  key={b.id}
                  bg={idx % 2 === 0 ? "white" : "purple.50"} // alternating row colors
                  _hover={{
                    bg: "purple.100",
                    transform: "translateY(-1px)",
                    boxShadow: "md",
                    transition: "all 0.2s",
                  }}
                >
                  <Td px={3} py={2}>
                    {b.cusname}
                  </Td>
                  <Td px={3} py={2}>
                    {b.email || "-"}
                  </Td>
                  <Td px={3} py={2}>
                    {b.phone}
                  </Td>
                  <Td px={3} py={2}>
                    {b.check_in?.toLocaleDateString()}
                  </Td>
                  <Td px={3} py={2}>
                    {b.check_out?.toLocaleDateString()}
                  </Td>
                  <Td px={3} py={2} textAlign="center">
                    <IconButton
                      aria-label="Submit Booking"
                      icon={<FiSend />}
                      isDisabled={b.sts === 1}
                      size="sm"
                      variant="solid"
                      onClick={() => handleSubmit(b)}
                      bg="transparent"
                      _hover={{ bg: "purple.200", transform: "scale(1.1)" }}
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

        {/* Pagination */}
        <HStack mt={4} justify="center" spacing={2}>
          <Button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
            Prev
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" colorScheme={p === page ? "purple" : "gray"} onClick={() => handlePageChange(p)}>
              {p}
            </Button>
          ))}

          <Button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
            Next
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default OnlineBookings;
