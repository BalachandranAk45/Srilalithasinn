import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  Card,
  CardBody,
  Textarea,
  Divider,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useDisclosure,
} from "@chakra-ui/react";
import { LuHotel, LuBuilding2 } from "react-icons/lu";
import { MdOutlineMeetingRoom } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { showStatusToast, ToastMessageContainer } from "../components/toast";
import { useLocation } from "react-router-dom";

export default function BookingPage() {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [selected, setSelected] = useState([]);
  const [customer, setCustomer] = useState({ name: "", mobile: "", email: "", aadhar: "", address: "" });
  const [occupancy, setOccupancy] = useState({});
  const [roomPrices, setRoomPrices] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [availability, setAvailability] = useState({});
  const [currentAsset, setCurrentAsset] = useState(null);
  const [modalPrice, setModalPrice] = useState(0);
  const [errors, setErrors] = useState({});
  const [onlineId, setOnlineId] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const location = useLocation();

  const assets = [
    { id: "room1", label: "S1", price: 2000, beds: 2, type: "Standard", maxIncluded: 2, icon: LuHotel },
    { id: "room2", label: "S2", price: 2000, beds: 2, type: "Standard", maxIncluded: 2, icon: LuHotel },
    { id: "room3", label: "SB1", price: 2500, beds: 2, type: "Standard", maxIncluded: 2, icon: LuHotel },
    { id: "room4", label: "SB2", price: 2500, beds: 2, type: "Standard", maxIncluded: 2, icon: LuHotel },
    { id: "room5", label: "SB3", price: 2500, beds: 2, type: "Standard", maxIncluded: 2, icon: LuHotel },
    { id: "deluxe", label: "D1", price: 3000, beds: 2, type: "Deluxe", maxIncluded: 4, icon: LuHotel },
    { id: "apartment1", label: "A1", price: 4000, beds: 2, type: "Apartment", maxIncluded: 2, icon: LuBuilding2 },
    { id: "apartment2", label: "A2", price: 4000, beds: 2, type: "Apartment", maxIncluded: 2, icon: LuBuilding2 },
    { id: "apartment3", label: "A3", price: 4000, beds: 2, type: "Apartment", maxIncluded: 2, icon: LuBuilding2 },
    { id: "hall", label: "H1", price: 20000, beds: 0, type: "Hall", maxIncluded: 0, icon: MdOutlineMeetingRoom },
  ];

  useEffect(() => {
    const fetchAvailability = async (from, to) => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/check-availability?from=${from.toLocaleDateString("en-CA")}&to=${to.toLocaleDateString("en-CA")}`
        );
        const data = await res.json();
        const availObj = {};
        data.forEach((room) => (availObj[room.id] = room.isAvailable));
        setAvailability(availObj);
      } catch {
        showStatusToast("error", "Failed to check availability.");
      }
    };
    fetchAvailability(fromDate, toDate);
  }, [fromDate, toDate]);

  const openModal = (asset) => {
    if (availability[asset.id] === false) {
      showStatusToast("error", `${asset.label} is not available.`);
      return;
    }
    setCurrentAsset(asset);
    setModalPrice(roomPrices[asset.id] || asset.price);
    onOpen();
  };

  const confirmModalPrice = () => {
    setRoomPrices({ ...roomPrices, [currentAsset.id]: modalPrice });
    if (!selected.includes(currentAsset.id)) setSelected([...selected, currentAsset.id]);
    onClose();
    showStatusToast("success", `${currentAsset.label} added to booking.`);
  };

  useEffect(() => {
    let total = 0;
    selected.forEach((id) => (total += roomPrices[id] || assets.find((a) => a.id === id).price));
    setTotalPrice(total);
  }, [selected, roomPrices]);

  const handleConfirmBooking = () => {
    const newErrors = {
      name: customer.name ? "" : "Name required",
      mobile: /^\d{10}$/.test(customer.mobile) ? "" : "Invalid mobile number",
      aadhar: /^\d{12}$/.test(customer.aadhar) ? "" : "Invalid Aadhaar",
      address: customer.address ? "" : "Address required",
      rooms: selected.length > 0 ? "" : "Select at least one room",
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some((e) => e)) return showStatusToast("error", "Please fill all fields properly.");
    onConfirmOpen();
  };

  const confirmBooking = async () => {
    const payload = {
      online_id: onlineId,
      customer,
      fromDate: fromDate.toISOString().split("T")[0],
      toDate: toDate.toISOString().split("T")[0],
      rooms: selected.map((id) => {
        const a = assets.find((x) => x.id === id);
        const occ = occupancy[id] || { adults: 1, children: 0 };
        return { room_no: a.label, room_type: a.type, ...occ, room_amount: roomPrices[id] || a.price };
      }),
      total_amount: totalPrice,
    };
    try {
      const res = await fetch("http://localhost:8000/api/addbooking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showStatusToast("success", `Booking confirmed! No: ${data.booking_no}`);
        setSelected([]);
        setCustomer({ name: "", mobile: "", aadhar: "", address: "", email: "" });
        setRoomPrices({});
        setTotalPrice(0);
        onConfirmClose();
      } else showStatusToast("error", data.message || "Booking failed.");
    } catch {
      showStatusToast("error", "Server error.");
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }} bgGradient="linear(to-br, purple.50, white)" minH="100vh">
      <ToastMessageContainer />

      <Box
        position="sticky"
        top="0"
        zIndex="sticky"
        py={4}
        mb={8}
        borderRadius="xl"
        bgGradient="linear(to-r, purple.100, pink.50, white)"
        boxShadow="0 2px 20px rgba(128,0,128,0.15)"
        textAlign="center"
      >
        <Heading
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="extrabold"
          bgGradient="linear(to-r, purple.600, pink.400)"
          bgClip="text"
        >
          Room Booking
        </Heading>
      </Box>

      {/* Room Selection */}
      <Card
        shadow="xl"
        borderRadius="2xl"
        bgGradient="linear(to-br, whiteAlpha.900, purple.50)"
        border="1px solid"
        borderColor="purple.100"
        mb={8}
      >
        <CardBody>
          <SimpleGrid columns={{ base: 2, sm: 3, md: 5, lg: 6 }} spacing={4}>
            {assets.map((asset) => {
              const isSelected = selected.includes(asset.id);
              const isAvailable = availability[asset.id] !== false;
              return (
                <Box
                  key={asset.id}
                  bgGradient={
                    isSelected
                      ? "linear(to-br, purple.400, purple.600)"
                      : "linear(to-br, white, gray.50)"
                  }
                  p={4}
                  rounded="xl"
                  shadow={isSelected ? "2xl" : "sm"}
                  border={isSelected ? "2px solid purple" : "1px solid #E2E8F0"}
                  cursor={isAvailable ? "pointer" : "not-allowed"}
                  onClick={() => isAvailable && openModal(asset)}
                  _hover={{
                    transform: isAvailable ? "scale(1.05)" : "none",
                    boxShadow: isAvailable ? "0 0 20px rgba(128,0,128,0.3)" : "none",
                  }}
                  textAlign="center"
                  opacity={isAvailable ? 1 : 0.5}
                  transition="all 0.3s ease"
                >
                  <Icon
                    as={asset.icon}
                    boxSize={8}
                    mb={2}
                    color={isSelected ? "white" : "purple.500"}
                  />
                  <Text fontWeight="600" color={isSelected ? "white" : "purple.700"}>
                    {asset.label}
                  </Text>
                  <Text color={isSelected ? "white" : "gray.700"} fontWeight="bold">
                    ₹{roomPrices[asset.id] || asset.price}
                  </Text>
                </Box>
              );
            })}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Dates & Customer */}
      <Card
        shadow="xl"
        borderRadius="2xl"
        bgGradient="linear(to-br, whiteAlpha.900, purple.50)"
        border="1px solid"
        borderColor="purple.100"
      >
        <CardBody>
          <VStack spacing={6} align="stretch">
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6}>
              <Box>
                <Text fontWeight="600" color="purple.700" mb={2}>
                  From Date
                </Text>
                <DatePicker
                  selected={fromDate}
                  onChange={(date) => setFromDate(date)}
                  selectsStart
                  startDate={fromDate}
                  endDate={toDate}
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  customInput={<Input />}
                />
              </Box>
              <Box>
                <Text fontWeight="600" color="purple.700" mb={2}>
                  To Date
                </Text>
                <DatePicker
                  selected={toDate}
                  onChange={(date) => setToDate(date)}
                  selectsEnd
                  startDate={fromDate}
                  endDate={toDate}
                  minDate={fromDate}
                  dateFormat="dd/MM/yyyy"
                  customInput={<Input />}
                />
              </Box>
            </SimpleGrid>

            {/* Customer */}
            <VStack spacing={3} align="stretch">
              <Text fontWeight="600" color="purple.700">
                Customer Details
              </Text>
              <Input
                placeholder="Customer Name"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
              <Input
                placeholder="Mobile Number"
                value={customer.mobile}
                onChange={(e) => /^\d*$/.test(e.target.value) && setCustomer({ ...customer, mobile: e.target.value })}
              />
              <Input
                placeholder="Email (Optional)"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
              <Input
                placeholder="Aadhaar Number"
                value={customer.aadhar}
                onChange={(e) => /^\d*$/.test(e.target.value) && setCustomer({ ...customer, aadhar: e.target.value })}
              />
              <Textarea
                placeholder="Address"
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              />
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      <Divider my={8} />
      <Box textAlign="center">
        <Button
          size="lg"
          bgGradient="linear(to-r, purple.500, pink.400)"
          color="white"
          px={10}
          _hover={{
            bgGradient: "linear(to-r, purple.600, pink.500)",
            boxShadow: "0 0 20px rgba(128,0,128,0.3)",
          }}
          onClick={handleConfirmBooking}
        >
          Confirm Booking
        </Button>
      </Box>

      {/* Room Details Modal */}
      {currentAsset && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent
            borderRadius="2xl"
            bgGradient="linear(to-br, whiteAlpha.900, purple.50)"
            border="1px solid"
            borderColor="purple.100"
          >
            <ModalHeader color="purple.700">{currentAsset.label} Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Type: {currentAsset.type}</Text>
                {currentAsset.maxIncluded > 0 && (
                  <HStack spacing={4}>
                    <Box>
                      <Text>Adults:</Text>
                      <NumberInput
                        value={occupancy[currentAsset.id]?.adults || 1}
                        min={1}
                        onChange={(v) =>
                          setOccupancy({
                            ...occupancy,
                            [currentAsset.id]: { ...occupancy[currentAsset.id], adults: Number(v) },
                          })
                        }
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Box>
                    <Box>
                      <Text>Children:</Text>
                      <NumberInput
                        value={occupancy[currentAsset.id]?.children || 0}
                        min={0}
                        onChange={(v) =>
                          setOccupancy({
                            ...occupancy,
                            [currentAsset.id]: { ...occupancy[currentAsset.id], children: Number(v) },
                          })
                        }
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Box>
                  </HStack>
                )}
                <Box>
                  <Text>Price:</Text>
                  <NumberInput
                    value={modalPrice}
                    min={0}
                    onChange={(v) => setModalPrice(Number(v))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="purple" mr={3} onClick={confirmModalPrice}>
                Add
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} size="2xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" p={6} bgGradient="linear(to-br, whiteAlpha.900, purple.50)">
          <ModalHeader textAlign="center" fontSize="2xl" color="purple.700">
            Booking Confirmation
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Box p={5} bgGradient="linear(to-br, whiteAlpha.900, purple.50)" borderRadius="xl">
                <Text fontWeight="700" color="purple.600" mb={3}>
                  Customer Information
                </Text>
                <SimpleGrid columns={2} spacing={3}>
                  <Text><b>Name:</b> {customer.name}</Text>
                  <Text><b>Mobile:</b> {customer.mobile}</Text>
                  <Text><b>Aadhaar:</b> {customer.aadhar}</Text>
                  <Text><b>Address:</b> {customer.address}</Text>
                </SimpleGrid>
              </Box>
              <Box p={5} bgGradient="linear(to-br, whiteAlpha.900, purple.50)" borderRadius="xl">
                <Text fontWeight="700" color="purple.600" mb={3}>
                  Booking Dates
                </Text>
                <HStack spacing={8}>
                  <Text><b>From:</b> {fromDate.toLocaleDateString()}</Text>
                  <Text><b>To:</b> {toDate.toLocaleDateString()}</Text>
                </HStack>
              </Box>
              <Box p={5} bgGradient="linear(to-br, whiteAlpha.900, purple.50)" borderRadius="xl">
                <Text fontWeight="700" color="purple.600" mb={3}>
                  Rooms Summary
                </Text>
                <VStack spacing={3} align="stretch">
                  {selected.map((id, i) => {
                    const a = assets.find((x) => x.id === id);
                    const occ = occupancy[id] || { adults: 1, children: 0 };
                    return (
                      <Box key={id} p={3} border="1px solid #E2E8F0" borderRadius="md">
                        <HStack justify="space-between">
                          <Text fontWeight="600">{i + 1}. {a.label} ({a.type})</Text>
                          <Text fontWeight="bold">₹{roomPrices[id] || a.price}</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          Adults: {occ.adults}, Children: {occ.children}
                        </Text>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
              <Box textAlign="right" p={5} bg="purple.50" borderRadius="xl">
                <Text fontWeight="bold" fontSize="xl" color="purple.700">
                  Total: ₹{totalPrice}
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter justifyContent="center">
            <Button
              colorScheme="purple"
              size="lg"
              mr={4}
              onClick={confirmBooking}
              bgGradient="linear(to-r, purple.500, pink.400)"
            >
              Confirm
            </Button>
            <Button variant="outline" size="lg" onClick={onConfirmClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
