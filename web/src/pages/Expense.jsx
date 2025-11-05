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
import { Trash2 } from "lucide-react";
import { showStatusToast, ToastMessageContainer } from "../components/toast";

export default function ExpensePage() {
  const cardBg = useColorModeValue("whiteAlpha.900", "gray.800");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDelOpen, onOpen: onDelOpen, onClose: onDelClose } = useDisclosure();

  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({ invoice: "", description: "", amount: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [formErrors, setFormErrors] = useState({
    invoice: "",
    description: "",
    amount: "",
    apiError: "",
  });

  // Fetch expenses
  const fetchExpenses = async (page = 1) => {
    try {
      const res = await fetch(`http://localhost:8000/api/getexpense?page=${page}&limit=${ITEMS_PER_PAGE}`);
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
    setFormErrors({ ...formErrors, [e.target.name]: "" });
  };

  const handleAddExpense = async () => {
    const { invoice, description, amount } = formData;
    const errors = {
      invoice: invoice ? "" : "Invoice number is required",
      description: description ? "" : "Description is required",
      amount: amount ? "" : "Amount is required",
      apiError: "",
    };
    setFormErrors(errors);

    if (Object.values(errors).some((err) => err !== "")) return;

    try {
      const res = await fetch("http://localhost:8000/api/addexpense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice, description, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErrors({ ...formErrors, apiError: data.message || "Failed to add expense" });
        return;
      }
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
    try {
      const res = await fetch(`http://localhost:8000/api/deleteexpense/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showStatusToast("error", data.message || "Failed to delete expense");
        return;
      }
      showStatusToast("success", "Expense deleted successfully!");
      onDelClose();
      fetchExpenses(currentPage);
    } catch (err) {
      console.error(err);
      showStatusToast("error", "Server not reachable");
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <Box p={{ base: 4, md: 8 }} bgGradient="linear(to-br, purple.50, white)" minH="100vh">
      <ToastMessageContainer />

      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap">
        <Heading
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="extrabold"
          bgGradient="linear(to-r, purple.600, pink.400)"
          bgClip="text"
          mt={8}
        >
          Expense Report
        </Heading>
        <Button
          bgGradient="linear(to-r, purple.500, pink.400)"
          color="white"
          boxShadow="0 0 10px rgba(128,0,128,0.3)"
          _hover={{
            transform: "scale(1.05)",
            boxShadow: "0 0 15px rgba(128,0,128,0.5)",
          }}
          onClick={onOpen}
          mt={{ base: 4, md: 0 }}
        >
          + Add Expense
        </Button>
      </Flex>

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
              {["Invoice No", "Description", "Amount", "Action"].map((h) => (
                <Th key={h} color="white" fontSize="sm" p={3}>
                  {h}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {expenses.map((exp, idx) => (
              <Tr
                key={exp.id}
                bg={idx % 2 === 0 ? "white" : "purple.50"}
                _hover={{
                  bg: "purple.100",
                  transform: "translateY(-1px)",
                  transition: "0.2s ease",
                  boxShadow: "md",
                }}
              >
                <Td p={2}>{exp.invoice}</Td>
                <Td p={2}>{exp.description}</Td>
                <Td p={2} fontWeight="600" color="purple.700">
                  ₹{exp.amount.toLocaleString()}
                </Td>
                <Td p={2}>
                  <IconButton
                    aria-label="Delete"
                    icon={<Trash2 />}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    _hover={{
                      bg: "red.100",
                      transform: "scale(1.05)",
                      transition: "0.2s ease",
                    }}
                    onClick={() => handleDeleteClick(exp.id)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {/* ✅ Pagination (same centered position) */}
        <HStack mt={4} justify="center" spacing={2}>
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
          >
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

          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
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
        {expenses.map((exp) => (
          <Card
            key={exp.id}
            bgGradient="linear(to-br, whiteAlpha.900, purple.50)"
            border="1px solid"
            borderColor="purple.100"
            borderRadius="2xl"
            shadow="xl"
            _hover={{
              transform: "translateY(-2px)",
              transition: "0.3s ease",
              boxShadow: "0 0 15px rgba(128,0,128,0.25)",
            }}
          >
            <CardBody>
              <VStack align="start" spacing={2}>
                <Flex justify="space-between" w="100%">
                  <Badge colorScheme="purple" px={2} py={1}>
                    {exp.invoice}
                  </Badge>
                  <IconButton
                    aria-label="Delete"
                    icon={<Trash2 />}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(exp.id)}
                  />
                </Flex>
                <Text fontSize="sm">{exp.description}</Text>
                <Text fontWeight="bold" color="purple.700">
                  ₹{exp.amount.toLocaleString()}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Add Expense Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          borderRadius="2xl"
          p={6}
          bgGradient="linear(to-br, whiteAlpha.900, purple.50)"
        >
          <ModalHeader color="purple.700">Add New Expense</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Input
                placeholder="Invoice No"
                name="invoice"
                value={formData.invoice}
                onChange={handleChange}
              />
              {formErrors.invoice && (
                <Text color="red.500" fontSize="sm">
                  {formErrors.invoice}
                </Text>
              )}

              <Textarea
                placeholder="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
              {formErrors.description && (
                <Text color="red.500" fontSize="sm">
                  {formErrors.description}
                </Text>
              )}

              <Input
                placeholder="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
              />
              {formErrors.amount && (
                <Text color="red.500" fontSize="sm">
                  {formErrors.amount}
                </Text>
              )}

              {formErrors.apiError && (
                <Text color="red.500" fontSize="sm">
                  {formErrors.apiError}
                </Text>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="purple"
              mr={3}
              onClick={handleAddExpense}
              bgGradient="linear(to-r, purple.500, pink.400)"
            >
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
        <ModalContent borderRadius="2xl" p={6}>
          <ModalHeader color="purple.700">Confirm Delete</ModalHeader>
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
