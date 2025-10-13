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
  useColorModeValue,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Textarea,
  useDisclosure,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Flex,
  IconButton,
} from "@chakra-ui/react";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { showStatusToast, ToastMessageContainer } from "../components/toast";

export default function ExpensePage() {
  const cardBg = useColorModeValue("white", "gray.800");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDelOpen, onOpen: onDelOpen, onClose: onDelClose } = useDisclosure();

  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({ invoice: "", description: "", amount: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // Fetch expenses
  const fetchExpenses = async (page = 1) => {
    try {
      const res = await fetch(`http://localhost:5000/api/getexpense?page=${page}&limit=${ITEMS_PER_PAGE}`);
      const data = await res.json();
      if (!res.ok) {
        showStatusToast("error", data.message || "Failed to fetch expenses");
        return;
      }
      setExpenses(data.expenses);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      showStatusToast("error", "Server not reachable");
    }
  };

  useEffect(() => {
    fetchExpenses(currentPage);
  }, [currentPage]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddExpense = async () => {
    const { invoice, description, amount } = formData;
    if (!invoice || !description || !amount) {
      showStatusToast("error", "All fields are required");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/addexpense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice, description, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        showStatusToast("error", data.message || "Failed to add expense");
        return;
      }
      showStatusToast("success", "Expense added successfully!");
      setFormData({ invoice: "", description: "", amount: "" });
      onClose();
      fetchExpenses(currentPage);
    } catch (err) {
      console.error(err);
      showStatusToast("error", "Server not reachable");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    onDelOpen();
  };

const handleConfirmDelete = async () => {
  if (!deleteId) return;
  try {
    const res = await fetch(`http://localhost:5000/api/deleteexpense/${deleteId}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok) {
      showStatusToast("error", data.message || "Failed to delete expense");
      return;
    }

    showStatusToast("success", "Expense deleted successfully!");
    onDelClose();

    // Refresh current page
    fetchExpenses(currentPage);
  } catch (err) {
    console.error(err);
    showStatusToast("error", "Server not reachable");
  }
};

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <Box p={6}>
      <ToastMessageContainer />

      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap">
        <VStack align="start" spacing={1}>
          <Heading fontSize={{ base: "xl", md: "2xl" }} fontWeight="600" color="purple.700">
            Expense Report
          </Heading>
        
        </VStack>
        <Button colorScheme="purple" onClick={onOpen} mt={{ base: 4, md: 0 }}>
          + Add Expense
        </Button>
      </Flex>

      {/* Desktop Table */}
      <Box display={{ base: "none", md: "block" }} bg="white" borderRadius="2xl" boxShadow="xl" p={6}>
        <Table variant="simple" size="md">
          <Thead>
            <Tr bgGradient="linear(to-r, purple.600, purple.800)">
              <Th color="white" fontSize="sm" fontWeight="600">Invoice No</Th>
              <Th color="white" fontSize="sm" fontWeight="600">Description</Th>
              <Th color="white" fontSize="sm" fontWeight="600">Amount</Th>
              <Th color="white" fontSize="sm" fontWeight="600">Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {expenses.map((exp, idx) => (
              <Tr
                key={exp.id}
                bg={idx % 2 === 0 ? "white" : "purple.50"}
                _hover={{
                  bg: "purple.100",
                  transform: "translateY(-2px)",
                  boxShadow: "md",
                  transition: "all 0.2s",
                }}
              >
                <Td>
                  <Badge colorScheme="purple" borderRadius="full" px={3} py={1} fontSize="0.9em" fontWeight="500">
                    {exp.invoice}
                  </Badge>
                </Td>
                <Td color="gray.700" fontWeight="500">{exp.description}</Td>
                <Td color="gray.800" fontWeight="600">₹{exp.amount.toLocaleString()}</Td>
                <Td>
                  <IconButton
                    aria-label="Delete"
                    icon={<Trash2 />}
                    colorScheme="red"
                    variant="ghost"
                    _hover={{ bg: "red.100", transform: "scale(1.1)" }}
                    transition="all 0.2s"
                    onClick={() => handleDeleteClick(exp.id)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {/* Pagination */}
        <Flex justify="center" mt={6} align="center">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevPage}
            leftIcon={<ChevronLeft />}
            mr={2}
            _hover={{ bg: "purple.100", color: "purple.700" }}
          >
            Prev
          </Button>

          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              size="sm"
              colorScheme={currentPage === i + 1 ? "purple" : "gray"}
              onClick={() => setCurrentPage(i + 1)}
              mx={1}
              _hover={{ bg: currentPage === i + 1 ? "purple.400" : "gray.200" }}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            size="sm"
            variant="outline"
            onClick={handleNextPage}
            rightIcon={<ChevronRight />}
            ml={2}
            _hover={{ bg: "purple.100", color: "purple.700" }}
          >
            Next
          </Button>
        </Flex>
      </Box>

      {/* Mobile View */}
      <SimpleGrid columns={{ base: 1 }} spacing={4} display={{ base: "grid", md: "none" }} mt={2}>
        {expenses.map((exp) => (
          <Card key={exp.id} bg={cardBg} shadow="md" borderRadius="xl">
            <CardBody>
              <VStack align="start" spacing={2}>
                <Flex justify="space-between" w="100%">
                  <Badge colorScheme="purple">{exp.invoice}</Badge>
                  <IconButton
                    aria-label="Delete"
                    icon={<Trash2 />}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(exp.id)}
                  />
                </Flex>
                <Text fontSize="sm">Description: {exp.description}</Text>
                <Text fontWeight="600">Amount: ₹{exp.amount.toLocaleString()}</Text>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Add Expense Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Expense</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input placeholder="Invoice No" name="invoice" value={formData.invoice} onChange={handleChange} />
              <Textarea
                placeholder="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
              <Input placeholder="Amount" name="amount" type="number" value={formData.amount} onChange={handleChange} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="purple" mr={3} onClick={handleAddExpense}>
              Add
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDelOpen} onClose={onDelClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>Are you sure you want to delete this expense?</ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleConfirmDelete}>
              Delete
            </Button>
            <Button variant="ghost" onClick={onDelClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
