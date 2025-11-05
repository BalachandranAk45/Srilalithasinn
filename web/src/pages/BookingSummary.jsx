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
import { AiOutlineEye, AiOutlinePrinter } from "react-icons/ai";
import ReactDOM from "react-dom";
import InvoiceTemplate from "../components/InvoiceTemplate";

const statusColors = {
  Booked: "yellow",
  CheckedIn: "blue",
  CheckedOut: "green",
  Cancelled: "red",
};

export default function BookingSummary() {
  const [bookings, setBookings] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [gstPercent, setGstPercent] = useState(18);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isGstOpen, onOpen: onGstOpen, onClose: onGstClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();

  const cardBg = useColorModeValue("whiteAlpha.900", "gray.800");
  const cancelRef = React.useRef();
  const toast = useToast();
  const limit = 10;

  const fetchBookings = async (pageNumber = 1) => {
    try {
      const res = await fetch(`http://localhost:8000/api/bookings?page=${pageNumber}&limit=${limit}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Fetch bookings error:", err);
    }
  };

  useEffect(() => { fetchBookings(page); }, [page]);

  const handleStatusChange = async (bookingIds, newStatus) => {
    try {
      await fetch(`http://localhost:8000/api/bookings/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingIds, status: newStatus }),
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_ids?.includes(bookingIds[0])
            ? { ...b, status: newStatus }
            : b
        )
      );
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleInvoiceAction = async (customerId, action) => {
    setSelectedCustomer(customerId);
    if (action === "preview") previewInvoice(customerId);
    else if (action === "print") printInvoice(customerId);
    else onConfirmOpen();
  };

  const previewInvoice = async (customerId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/generatebill/customer/${customerId}`);
      const data = await res.json();
      setPreviewData(data);
      onPreviewOpen();
    } catch {
      toast({
        title: "Error",
        description: "Failed to load invoice preview",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const printInvoice = async (customerId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/generatebill/customer/${customerId}`);
      const data = await res.json();

      const div = document.createElement("div");
      document.body.appendChild(div);
      ReactDOM.render(<InvoiceTemplate data={data} />, div);

      const printWindow = window.open("", "_blank");
      printWindow.document.write("<html><head><title>Invoice</title></head><body>");
      printWindow.document.write(div.innerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();

      ReactDOM.unmountComponentAtNode(div);
      document.body.removeChild(div);

      toast({
        title: "Invoice Printed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to print invoice",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // ✅ Pagination — unchanged in position or layout
  const renderPagination = () => {
    const pages = [];
    pages.push(
      <Button key="prev" size="sm" colorScheme="gray" onClick={() => setPage(page - 1)} isDisabled={page === 1}>
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
      <Button key="next" size="sm" colorScheme="gray" onClick={() => setPage(page + 1)} isDisabled={page === totalPages}>
        Next
      </Button>
    );
    return <HStack spacing={2}>{pages}</HStack>;
  };

  return (
    <Box p={{ base: 4, md: 8 }} bgGradient="linear(to-br, purple.50, white)" minH="100vh">
      <VStack align="start" spacing={2} mb={6}>
        <Heading fontSize={{ base: "xl", md: "2xl" }} fontWeight="extrabold" bgGradient="linear(to-r, purple.600, pink.400)" bgClip="text">
          Booking Summary
        </Heading>
      </VStack>

      {/* Table */}
      <Box bgGradient="linear(to-br, whiteAlpha.900, purple.50)" border="1px solid" borderColor="purple.100" borderRadius="2xl" boxShadow="xl" p={6}>
        <Table variant="simple" size="md">
          <Thead>
            <Tr bgGradient="linear(to-r, purple.600, pink.400)">
              <Th color="white" fontSize="sm">Customer</Th>
              <Th color="white" fontSize="sm">Room / Hall</Th>
              <Th color="white" fontSize="sm">Check-In</Th>
              <Th color="white" fontSize="sm">Check-Out</Th>
              <Th color="white" fontSize="sm">Status</Th>
              <Th color="white" fontSize="sm">Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {bookings.map((b, idx) => {
              let icon = LuHotel;
              if (b.room_type === "Conference Hall") icon = MdOutlineMeetingRoom;
              else if (b.room_type === "Service Apartment") icon = LuBuilding2;

              return (
                <Tr
                  key={b.booking_id}
                  bg={idx % 2 === 0 ? "white" : "purple.50"}
                  _hover={{
                    bg: "purple.100",
                    transform: "translateY(-2px)",
                    transition: "0.3s ease",
                  }}
                >
                  <Td>
                    <HStack spacing={3}>
                      <Avatar name={b.name} size="sm" />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="600">{b.name}</Text>
                        <Text fontSize="xs" color="gray.500">{b.booking_no}</Text>
                      </VStack>
                    </HStack>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Box as={icon} color="teal.500" boxSize={5} />
                      <Text>{b.room_no}</Text>
                    </HStack>
                  </Td>
                  <Td><Badge colorScheme="teal" px={3}>{b.checkIn}</Badge></Td>
                  <Td><Badge colorScheme="blue" px={3}>{b.checkOut}</Badge></Td>
                  <Td>
                    <Select size="sm" value={b.status} onChange={(e) => handleStatusChange(b.booking_ids, e.target.value)} borderColor={`${statusColors[b.status]}.400`}>
                      <option value="Booked">Booked</option>
                      <option value="CheckedIn">Checked In</option>
                      <option value="CheckedOut">Checked Out</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton aria-label="Preview" icon={<AiOutlineEye size={20} />} colorScheme="green" variant="ghost" onClick={() => handleInvoiceAction(b.customer_id, "preview")} isDisabled={b.status !== "CheckedOut"} />
                      <IconButton aria-label="Print" icon={<AiOutlinePrinter size={20} />} colorScheme="blue" variant="ghost" onClick={() => handleInvoiceAction(b.customer_id, "print")} isDisabled={b.status !== "CheckedOut"} />
                    </HStack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>

        {/* ✅ Pagination unchanged - same place */}
        <Box mt={4} display="flex" justifyContent="center">
          {renderPagination()}
        </Box>
      </Box>

      {/* Invoice Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="4xl">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={6} bgGradient="linear(to-br, whiteAlpha.900, purple.50)">
          <ModalHeader color="purple.700">Invoice Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{previewData && <InvoiceTemplate data={previewData} />}</ModalBody>
        </ModalContent>
      </Modal>

      {/* GST Confirmation Dialog */}
      <AlertDialog isOpen={isConfirmOpen} leastDestructiveRef={cancelRef} onClose={onConfirmClose}>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader fontWeight="bold" color="purple.700">Add GST to Invoice?</AlertDialogHeader>
            <AlertDialogBody>Would you like to include GST in this invoice? You can set it in the next step.</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => printInvoice(selectedCustomer)}>Without GST</Button>
              <Button colorScheme="purple" ml={3} onClick={onGstOpen}>Add GST</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* GST Modal */}
      <Modal isOpen={isGstOpen} onClose={onGstClose}>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" p={6} bgGradient="linear(to-br, whiteAlpha.900, purple.50)">
          <ModalHeader color="purple.700">Add GST Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>GST Percentage (%)</FormLabel>
              <NumberInput min={0} max={100} value={gstPercent} onChange={(v) => setGstPercent(parseFloat(v) || 0)}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="purple" onClick={() => printInvoice(selectedCustomer)} isLoading={isUpdating} bgGradient="linear(to-r, purple.500, pink.400)">
              Generate Invoice
            </Button>
            <Button variant="ghost" ml={3} onClick={onGstClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
