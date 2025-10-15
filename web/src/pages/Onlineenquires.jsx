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

const OnlineEnquiries = () => {
  const cardBg = useColorModeValue("white", "gray.800");

  const [enquiries, setEnquiries] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Fetch enquiries from backend
  const fetchEnquiries = async (pageNum = 1) => {
    try {
      const params = new URLSearchParams();
      params.append("page", pageNum);
      params.append("limit", limit);

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      if (fromDate) params.append("fromDate", formatDate(fromDate));
      if (toDate) params.append("toDate", formatDate(toDate));

      const res = await fetch(`http://localhost:5000/api/online-enquiries?${params.toString()}`);
      const data = await res.json();

      // Convert string dates to Date objects
      const formattedData = data.enquiries.map((e) => ({
        ...e,
        checkIn: new Date(e.checkIn),
        checkOut: new Date(e.checkOut),
      }));

      setEnquiries(formattedData);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Error fetching enquiries:", err);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleSearch = () => {
    fetchEnquiries(1); // reset to first page
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchEnquiries(newPage);
    }
  };

  return (
    <Box p={8}>
      {/* Heading + Date Filters */}
      <Box
        mb={6}
        display="flex"
        flexDirection={{ base: "column", md: "row" }}
        alignItems="center"
        justifyContent="space-between"
      >
        <Heading
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="600"
          color="purple.700"
          mt={10}
          mb={{ base: 3, md: 0 }}
        >
          Online Enquiries
        </Heading>

        <HStack spacing={3}>
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
            aria-label="Search Enquiries"
            icon={<FiSearch />}
            colorScheme="purple"
            onClick={handleSearch}
            size="md"
            mt={{ base: 4, md: 6 }}
          />
        </HStack>
      </Box>

      {/* Desktop Table */}
      <Box display={{ base: "none", md: "block" }} bg={cardBg} borderRadius="2xl" boxShadow="xl" p={6}>
        <Table variant="simple" size="md">
          <Thead>
            <Tr bgGradient="linear(to-r, purple.600, purple.500)">
              <Th color="white" fontSize="sm">Name</Th>
              <Th color="white" fontSize="sm">Email</Th>
              <Th color="white" fontSize="sm">Phone</Th>
              <Th color="white" fontSize="sm">Check-In</Th>
              <Th color="white" fontSize="sm">Check-Out</Th>
            </Tr>
          </Thead>
          <Tbody>
            {enquiries.map((e, idx) => (
              <Tr
                key={e.id}
                bg={idx % 2 === 0 ? "white" : "purple.50"}
                _hover={{
                  bg: "purple.100",
                  transform: "translateY(-1px)",
                  boxShadow: "md",
                  transition: "all 0.2s",
                }}
              >
                <Td>{e.name}</Td>
                <Td>{e.email}</Td>
                <Td>{e.phone}</Td>
                <Td>{e.checkIn.toLocaleDateString()}</Td>
                <Td>{e.checkOut.toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {/* Pagination */}
        <HStack mt={4} justify="center" spacing={2}>
          <Button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
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

          <Button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
            Next
          </Button>
        </HStack>
      </Box>

      {/* Mobile / Tablet View */}
      <SimpleGrid columns={{ base: 1 }} spacing={4} display={{ base: "grid", md: "none" }} mt={2}>
        {enquiries.map((e) => (
          <Card key={e.id} bg={cardBg} shadow="md" borderRadius="xl">
            <CardBody>
              <VStack align="start" spacing={3}>
                <Text fontWeight="600">
                  {e.name} ({e.phone})
                </Text>
                <Text fontSize="sm">Email: {e.email}</Text>
                <Text fontSize="sm">Check-In: {e.checkIn.toLocaleDateString()}</Text>
                <Text fontSize="sm">Check-Out: {e.checkOut.toLocaleDateString()}</Text>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default OnlineEnquiries;
