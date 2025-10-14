import React, { useEffect, useState } from "react";
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
  Avatar,
  Badge,
  VStack,
  HStack,
  useColorModeValue,
  Select,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Stack,
} from "@chakra-ui/react";
import { LuHotel, LuBuilding2 } from "react-icons/lu";
import { MdOutlineMeetingRoom, MdDownload, MdPreview } from "react-icons/md";
import { AiOutlineEye, AiOutlineFilePdf } from "react-icons/ai";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ReactDOM from "react-dom";
import InvoiceTemplate from "../components/InvoiceTemplate";

const statusColors = {
  Booked: "yellow",
  CheckedIn: "blue",
  CheckedOut: "green",
  Cancelled: "red",
};

const BookingSummary = () => {
  const [bookings, setBookings] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue("white", "gray.800");

  const limit = 10; // 10 records per page

  const fetchBookings = async (pageNumber = 1) => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings?page=${pageNumber}&limit=${limit}`);
      const data = await res.json();
      setBookings(data.bookings);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Fetch bookings error:", err);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setBookings((prev) => prev.map((b) => (b.booking_id === bookingId ? { ...b, status: newStatus } : b)));
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const downloadInvoice = async (customerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/generatebill/customer/${customerId}`);
      const data = await res.json();

      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.left = "-9999px";
      document.body.appendChild(div);

      ReactDOM.render(<InvoiceTemplate data={data} />, div);

      const canvas = await html2canvas(div, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${data.customer.name}_${Date.now()}.pdf`);

      ReactDOM.unmountComponentAtNode(div);
      document.body.removeChild(div);
    } catch (err) {
      console.error("Download invoice error:", err);
    }
  };

  const previewInvoice = async (customerId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/generatebill/customer/${customerId}`);
      const data = await res.json();
      setPreviewData(data);
      onOpen();
    } catch (err) {
      console.error("Preview invoice error:", err);
    }
  };

  useEffect(() => {
    fetchBookings(page);
  }, [page]);

  const renderPagination = () => {
    const pages = [];

    // Previous button
    pages.push(
      <Button
        key="prev"
        size="sm"
        colorScheme="gray"
        onClick={() => setPage((prev) => prev - 1)}
        isDisabled={page === 1}
      >
        Prev
      </Button>
    );

    // Numbered page buttons
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <Button key={i} size="sm" colorScheme={i === page ? "purple" : "gray"} onClick={() => setPage(i)}>
          {i}
        </Button>
      );
    }

    // Next button
    pages.push(
      <Button
        key="next"
        size="sm"
        colorScheme="gray"
        onClick={() => setPage((prev) => prev + 1)}
        isDisabled={page === totalPages}
      >
        Next
      </Button>
    );

    return <HStack spacing={2}>{pages}</HStack>;
  };

  return (
    <Box p={30}>
      {/* Heading section */}
      <VStack align="start" spacing={2} mb={6} mt="20px" >
        <Heading
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="600"
          color="purple.700"
          mt="15px" // 23 * 4px (Chakra spacing equivalent)
        >
          Today’s Bookings
        </Heading>
      </VStack>

      {/* Table Section */}
      <Box display={{ base: "none", md: "block" }} bg={cardBg} borderRadius="2xl" boxShadow="xl" p={6}>
        <Table variant="simple" size="md">
          <Thead>
            <Tr bgGradient="linear(to-r, purple.600, purple.500)">
              <Th color="white" fontSize="sm">
                Customer
              </Th>
              <Th color="white" fontSize="sm">
                Room / Hall / Apartment
              </Th>
              <Th color="white" fontSize="sm">
                Check-In
              </Th>
              <Th color="white" fontSize="sm">
                Check-Out
              </Th>
              <Th color="white" fontSize="sm">
                Booking Status
              </Th>
              <Th color="white" fontSize="sm">
                Action
              </Th>
            </Tr>
          </Thead>

          <Tbody>
            {bookings?.map((b, idx) => {
              let icon = LuHotel;
              if (b.room_type === "Conference Hall") icon = MdOutlineMeetingRoom;
              else if (b.room_type === "Service Apartment") icon = LuBuilding2;

              return (
                <Tr
                  key={b.booking_id}
                  bg={idx % 2 === 0 ? "white" : "purple.50"}
                  _hover={{
                    bg: "purple.100",
                    transform: "translateY(-1px)",
                    boxShadow: "md",
                    transition: "all 0.2s",
                  }}
                >
                  <Td>
                    <HStack spacing={3}>
                      <Avatar name={b.name} size="sm" />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="600">{b.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {b.booking_no}
                        </Text>
                      </VStack>
                    </HStack>
                  </Td>

                  <Td>
                    <HStack spacing={2}>
                      <Box as={icon} color="teal.500" boxSize={5} />
                      <Text>{b.room_no}</Text>
                    </HStack>
                  </Td>

                  <Td>
                    <Badge colorScheme="teal" px={2} py={1} borderRadius="md">
                      {b.checkIn}
                    </Badge>
                  </Td>

                  <Td>
                    <Badge colorScheme="blue" px={2} py={1} borderRadius="md">
                      {b.checkOut}
                    </Badge>
                  </Td>

                  <Td>
                    <Select
                      size="sm"
                      value={b.status}
                      onChange={(e) => handleStatusChange(b.booking_id, e.target.value)}
                      borderColor={statusColors[b.status]}
                    >
                      <option value="Booked">Booked</option>
                      <option value="CheckedIn">Checked In</option>
                      <option value="CheckedOut">Checked Out</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </Td>

                  <Td>
                    <HStack spacing={3}>
                      {/* Preview Eye Icon */}
                      <IconButton
                        aria-label="Preview Invoice"
                        icon={<AiOutlineEye size={22} />} // increase icon size
                        size="lg" // Chakra button size
                        colorScheme="green"
                        onClick={() => previewInvoice(b.customer_id)}
                        isDisabled={b.status !== "CheckedOut"}
                        variant="ghost"
                        _hover={{ bg: "green.100", color: "green.700" }}
                      />

                      {/* Download PDF Icon */}
                      <IconButton
                        aria-label="Download Invoice"
                        icon={<AiOutlineFilePdf size={22} />} // increase icon size
                        size="lg"
                        colorScheme="red"
                        onClick={() => downloadInvoice(b.customer_id)}
                        isDisabled={b.status !== "CheckedOut"}
                        variant="ghost"
                        _hover={{ bg: "red.100", color: "red.700" }}
                      />
                    </HStack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>

        <Box mt={4} display="flex" justifyContent="center">
          {renderPagination()}
        </Box>
      </Box>

      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Invoice Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{previewData && <InvoiceTemplate data={previewData} />}</ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BookingSummary;
