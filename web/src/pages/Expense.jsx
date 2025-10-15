import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  HStack,
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
  const [formErrors, setFormErrors] = useState({ invoice: "", description: "", amount: "", apiError: "" });

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
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage); // ✅ update state first
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: "" }); // clear error for this field
  };
  const handleAddExpense = async () => {
    const { invoice, description, amount } = formData;

    // Validation
    const errors = {
      invoice: invoice ? "" : "Invoice number is required",
      description: description ? "" : "Description is required",
      amount: amount ? "" : "Amount is required",
      apiError: "",
    };
    setFormErrors(errors);

    const hasError = Object.values(errors).some((err) => err !== "");
    if (hasError) return; // stop if any errors

    try {
      const res = await fetch("http://localhost:5000/api/addexpense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice, description, amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Inline API error
        setFormErrors({ ...formErrors, apiError: data.message || "Failed to add expense" });
        return;
      }

      // Success toast
      showStatusToast("success", "Expense added successfully!");

      setFormData({ invoice: "", description: "", amount: "" });
      onClose();
      fetchExpenses(currentPage);
    } catch (err) {
      console.error(err);
      setFormErrors({ ...formErrors, apiError: "Server not reachable" });
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
    <Box p={8}>
      <ToastMessageContainer />

      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap">
        <VStack align="start" spacing={1}>
          <Heading fontSize={{ base: "xl", md: "2xl" }} fontWeight="600" color="purple.700" mt={8}>
            Expense Report
          </Heading>
        </VStack>
        <Button colorScheme="purple" onClick={onOpen} mt={{ base: 4, md: 0 }}>
          + Add Expense
        </Button>
      </Flex>

      <Box display={{ base: "none", md: "block" }} bg={cardBg} borderRadius="2xl" boxShadow="xl" p={6}>
        <Table variant="simple" size="md">
          <Thead>
            <Tr bgGradient="linear(to-r, purple.600, purple.500)">
              <Th color="white" fontSize="sm" p={3}>
                Invoice No
              </Th>
              <Th color="white" fontSize="sm" p={3}>
                Description
              </Th>
              <Th color="white" fontSize="sm" p={3}>
                Amount
              </Th>
              <Th color="white" fontSize="sm" p={3}>
                Action
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {expenses.map((exp, idx) => (
              <Tr
                key={exp.id}
                bg={idx % 2 === 0 ? "white" : "purple.50"}
                _hover={{ bg: "purple.100", transform: "translateY(-1px)", boxShadow: "md", transition: "all 0.2s" }}
              >
                <Td p={2}>{exp.invoice}</Td>
                <Td p={2} color="gray.700" fontWeight="400">
                  {exp.description}
                </Td>
                <Td p={2} color="gray.800" fontWeight="400">
                  ₹{exp.amount.toLocaleString()}
                </Td>
                <Td p={2}>
                  <IconButton
                    aria-label="Delete"
                    icon={<Trash2 />}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    _hover={{ bg: "red.100", transform: "scale(1.05)", transition: "all 0.2s" }}
                    onClick={() => handleDeleteClick(exp.id)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {/* Pagination */}
        <HStack mt={4} justify="center" spacing={2}>
          <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Prev
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              size="sm"
              colorScheme={p === currentPage ? "purple" : "gray"}
              onClick={() => handlePageChange(p)}
            >
              {p}
            </Button>
          ))}

          <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </Button>
        </HStack>
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
            <VStack spacing={4} align="stretch">
              <Box>
                <Input placeholder="Invoice No" name="invoice" value={formData.invoice} onChange={handleChange} />
                {formErrors.invoice && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {formErrors.invoice}
                  </Text>
                )}
              </Box>

              <Box>
                <Textarea
                  placeholder="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
                {formErrors.description && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {formErrors.description}
                  </Text>
                )}
              </Box>

              <Box>
                <Input
                  placeholder="Amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                />
                {formErrors.amount && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {formErrors.amount}
                  </Text>
                )}
              </Box>

              {formErrors.apiError && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {formErrors.apiError}
                </Text>
              )}
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
