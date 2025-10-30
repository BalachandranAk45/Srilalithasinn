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
  ModalFooter,
  useDisclosure,
  IconButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
} from "@chakra-ui/react";
import { LuHotel, LuBuilding2 } from "react-icons/lu";
import { MdOutlineMeetingRoom } from "react-icons/md";
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
  const [gstPercent, setGstPercent] = useState(18);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceAction, setInvoiceAction] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Modals
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isGstOpen, onOpen: onGstOpen, onClose: onGstClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();

  const cardBg = useColorModeValue("white", "gray.800");
  const cancelRef = React.useRef();
  const toast = useToast();

  const limit = 10;

  const fetchBookings = async (pageNumber = 1) => {
    try {
      const res = await fetch(`http://localhost:8000/api/bookings?page=${pageNumber}&limit=${limit}`);
      const data = await res.json();
      setBookings(data.bookings);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Fetch bookings error:", err);
    }
  };

  const handleStatusChange = async (bookingIds, newStatus) => {
    if (!bookingIds || bookingIds.length === 0) return;

    try {
      await fetch(`http://localhost:8000/api/bookings/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingIds, status: newStatus }),
      });

      setBookings((prev) =>
        prev.map((b) => {
          const ids = Array.isArray(b.booking_ids) ? b.booking_ids : [b.booking_id];
          return ids.some((id) => bookingIds.includes(id)) ? { ...b, status: newStatus } : b;
        })
      );
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const updateGSTInDatabase = async (customerId, gstPercentage, bookingIds) => {
    try {
      const response = await fetch("http://localhost:8000/api/update-gst", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: customerId,
          booking_ids: bookingIds,
          gst_percent: gstPercentage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update GST in database");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error updating GST:", error);
      throw error;
    }
  };

  const handleInvoiceAction = (customerId, action) => {
    setSelectedCustomer(customerId);
    setInvoiceAction(action);
    
    if (action === "preview") {
      // For preview, directly show the invoice without GST confirmation
      previewInvoice(customerId);
    } else {
      // For download, show GST confirmation
      onConfirmOpen();
    }
  };

  const previewInvoice = async (customerId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/generatebill/customer/${customerId}`);
      const data = await res.json();
      setPreviewData(data);
      onPreviewOpen();
    } catch (err) {
      console.error("Preview invoice error:", err);
      toast({
        title: "Error",
        description: "Failed to preview invoice",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const proceedWithGst = () => {
    onConfirmClose();
    onGstOpen();
  };

  const proceedWithoutGst = async () => {
    onConfirmClose();
    try {
      const res = await fetch(`http://localhost:8000/api/generatebill/customer/${selectedCustomer}`);
      const data = await res.json();
      generatePDF(data);
    } catch (err) {
      console.error("Invoice generation error:", err);
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const generateInvoiceWithGst = async () => {
    setIsUpdating(true);
    try {
      // First get the base data to extract booking IDs
      const res = await fetch(`http://localhost:8000/api/generatebill/customer/${selectedCustomer}`);
      const data = await res.json();

      console.log("API Response:", data); // Debug log to see the structure

      // Extract booking IDs from the data - handle different possible structures
      const bookingIds = [];

      // Method 1: Check if bookings is an object with booking arrays
      if (data.bookings && typeof data.bookings === "object") {
        Object.values(data.bookings).forEach((bookingArray) => {
          if (Array.isArray(bookingArray)) {
            bookingArray.forEach((booking) => {
              if (booking.booking_id) {
                bookingIds.push(booking.booking_id);
              }
            });
          }
        });
      }

      // Method 2: If no booking IDs found, try to get from current bookings state
      if (bookingIds.length === 0) {
        const currentBooking = bookings.find((b) => b.customer_id === selectedCustomer);
        if (currentBooking) {
          // Try different possible property names
          if (currentBooking.booking_ids && Array.isArray(currentBooking.booking_ids)) {
            bookingIds.push(...currentBooking.booking_ids);
          } else if (currentBooking.booking_id) {
            bookingIds.push(currentBooking.booking_id);
          }
        }
      }

      // If still no booking IDs found, throw error with details
      if (bookingIds.length === 0) {
        console.error("No booking IDs found. Data structure:", data);
        throw new Error("No booking IDs found for this customer. Please check the booking data.");
      }

      console.log("Booking IDs to update:", bookingIds); // Debug log

      // Update GST in database
      await updateGSTInDatabase(selectedCustomer, gstPercent, bookingIds);

      // Fetch updated data with GST calculations
      const updatedRes = await fetch(`http://localhost:8000/api/generatebill/customer/${selectedCustomer}`);
      const updatedData = await updatedRes.json();

      generatePDF(updatedData);

      toast({
        title: "GST Updated",
        description: `GST ${gstPercent}% applied successfully to ${bookingIds.length} booking(s)`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Invoice generation error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update GST and generate invoice",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
      onGstClose();
    }
  };

  const generatePDF = async (invoiceData) => {
    try {
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.left = "-9999px";
      document.body.appendChild(div);

      ReactDOM.render(<InvoiceTemplate data={invoiceData} />, div);

      const canvas = await html2canvas(div, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoiceData.customer.name}_${Date.now()}.pdf`);

      ReactDOM.unmountComponentAtNode(div);
      document.body.removeChild(div);

      toast({
        title: "Invoice Downloaded",
        description: "Invoice has been downloaded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchBookings(page);
  }, [page]);

  const renderPagination = () => {
    const pages = [];

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

    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <Button key={i} size="sm" colorScheme={i === page ? "purple" : "gray"} onClick={() => setPage(i)}>
          {i}
        </Button>
      );
    }

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
    <Box p={{ base: 4, md: 8 }}>
      {/* Heading */}
      <VStack align="start" spacing={2} mb={6} mt={8}>
        <Heading fontSize={{ base: "xl", md: "2xl" }} fontWeight="600" color="purple.700">
          Our Bookings
        </Heading>
      </VStack>

      {/* Desktop Table */}
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
                  _hover={{ bg: "purple.100", transform: "translateY(-1px)", boxShadow: "md", transition: "all 0.2s" }}
                >
                  <Td>
                    <HStack spacing={3}>
                      <Avatar name={b.name} size="sm" />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
                          {b.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {b.booking_no}
                        </Text>
                      </VStack>
                    </HStack>
                  </Td>

                  <Td>
                    <HStack spacing={2}>
                      <Box as={icon} color="teal.500" boxSize={5} />
                      <Text fontSize={{ base: "sm", md: "md" }}>{b.room_no}</Text>
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
                      onChange={(e) => handleStatusChange(b.booking_ids, e.target.value)}
                      borderColor={statusColors[b.status]}
                    >
                      <option value="Booked">Booked</option>
                      <option value="CheckedIn">Checked In</option>
                      <option value="CheckedOut">Checked Out</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </Td>

                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Preview Invoice"
                        icon={<AiOutlineEye size={22} />}
                        size="sm"
                        colorScheme="green"
                        onClick={() => handleInvoiceAction(b.customer_id, "preview")}
                        isDisabled={b.status !== "CheckedOut"}
                        variant="ghost"
                      />
                      <IconButton
                        aria-label="Download Invoice"
                        icon={<AiOutlineFilePdf size={22} />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleInvoiceAction(b.customer_id, "download")}
                        isDisabled={b.status !== "CheckedOut"}
                        variant="ghost"
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

      {/* Mobile View */}
      <Box display={{ base: "block", md: "none" }}>
        <VStack spacing={4}>
          {bookings?.map((b) => {
            let icon = LuHotel;
            if (b.room_type === "Conference Hall") icon = MdOutlineMeetingRoom;
            else if (b.room_type === "Service Apartment") icon = LuBuilding2;

            return (
              <Box key={b.booking_id} bg="white" p={4} borderRadius="xl" shadow="sm" w="100%">
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Avatar name={b.name} size="sm" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="600">{b.name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {b.booking_no}
                      </Text>
                    </VStack>
                  </HStack>
                  <Box as={icon} color="teal.500" boxSize={5} />
                </HStack>

                <HStack justify="space-between" mb={2}>
                  <Badge colorScheme="teal">{b.checkIn}</Badge>
                  <Badge colorScheme="blue">{b.checkOut}</Badge>
                </HStack>

                <Select
                  size="sm"
                  value={b.status}
                  onChange={(e) => handleStatusChange(b.booking_ids, e.target.value)}
                  borderColor={statusColors[b.status]}
                  mb={2}
                >
                  <option value="Booked">Booked</option>
                  <option value="CheckedIn">Checked In</option>
                  <option value="CheckedOut">Checked Out</option>
                  <option value="Cancelled">Cancelled</option>
                </Select>

                <HStack spacing={2} justify="flex-end">
                  <IconButton
                    aria-label="Preview Invoice"
                    icon={<AiOutlineEye size={20} />}
                    size="sm"
                    colorScheme="green"
                    onClick={() => handleInvoiceAction(b.customer_id, "preview")}
                    isDisabled={b.status !== "CheckedOut"}
                    variant="ghost"
                  />
                  <IconButton
                    aria-label="Download Invoice"
                    icon={<AiOutlineFilePdf size={20} />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleInvoiceAction(b.customer_id, "download")}
                    isDisabled={b.status !== "CheckedOut"}
                    variant="ghost"
                  />
                </HStack>
              </Box>
            );
          })}
        </VStack>
      </Box>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Invoice Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{previewData && <InvoiceTemplate data={previewData} />}</ModalBody>
        </ModalContent>
      </Modal>

      {/* GST Confirmation Modal (Only for download) */}
      <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={onConfirmClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Add GST to Invoice?
            </AlertDialogHeader>

            <AlertDialogBody>
              Would you like to include GST in this invoice? You can specify the GST percentage in the next step.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={proceedWithoutGst}>
                Without GST
              </Button>
              <Button colorScheme="purple" onClick={proceedWithGst} ml={3}>
                Add GST
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* GST Details Modal */}
      <Modal isOpen={isGstOpen} onClose={onGstClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add GST Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>GST Percentage (%)</FormLabel>
              <NumberInput
                min={0}
                max={100}
                value={gstPercent}
                onChange={(valueString) => setGstPercent(parseFloat(valueString) || 0)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="purple"
              onClick={generateInvoiceWithGst}
              isLoading={isUpdating}
              loadingText="Updating..."
            >
              Generate Invoice
            </Button>
            <Button variant="ghost" onClick={onGstClose} ml={3} isDisabled={isUpdating}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BookingSummary;