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
// NOTE: Assuming this path is correct for your project
import { showStatusToast, ToastMessageContainer } from "../components/toast";

export default function BookingPage() {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [selected, setSelected] = useState([]);
  const [customer, setCustomer] = useState({ name: "", mobile: "", aadhar: "", address: "" });
  const [occupancy, setOccupancy] = useState({});
  const [roomPrices, setRoomPrices] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [availability, setAvailability] = useState({});
  const [currentAsset, setCurrentAsset] = useState(null);
  const [modalPrice, setModalPrice] = useState(0);

  // Room details modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Booking confirmation modal
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();

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

  // -----------------------------
  // Fetch availability whenever dates change
  // -----------------------------
  useEffect(() => {
    if (!fromDate || !toDate) return;

    const fetchAvailability = async () => {
      try {
        const from = fromDate.toISOString().split("T")[0];
        const to = toDate.toISOString().split("T")[0];
        const res = await fetch(`http://localhost:5000/api/check-availability?from=${from}&to=${to}`);
        const data = await res.json();
        const availObj = {};
        data.forEach((room) => {
          availObj[room.id] = room.isAvailable;
        });
        setAvailability(availObj);
        setSelected((prev) => prev.filter((id) => availObj[id]));
      } catch (err) {
        console.error("Availability check failed:", err);
        showStatusToast("error", "Failed to check availability.");
      }
    };

    fetchAvailability();
  }, [fromDate, toDate]);

  // -----------------------------
  // Open room modal
  // -----------------------------
  const openModal = (asset) => {
    if (availability[asset.id] === false) {
      showStatusToast("error", `${asset.label} is not available for selected dates.`);
      return;
    }
    setCurrentAsset(asset);
    setModalPrice(roomPrices[asset.id] || asset.price);
    onOpen();
  };

  const confirmModalPrice = () => {
    setRoomPrices({ ...roomPrices, [currentAsset.id]: modalPrice });
    if (!selected.includes(currentAsset.id)) {
      setSelected([...selected, currentAsset.id]);
    }
    onClose();
    showStatusToast("success", `${currentAsset.label} added to booking.`);
  };

  // -----------------------------
  // Calculate total price
  // -----------------------------
  useEffect(() => {
    let total = 0;
    selected.forEach((id) => {
      total += roomPrices[id] || assets.find((a) => a.id === id).price;
    });
    setTotalPrice(total);
  }, [selected, roomPrices, assets]);

  // -----------------------------
  // Open confirmation modal
  // -----------------------------
  const handleConfirmBooking = () => {
    if (!customer.name || !customer.mobile || !fromDate || !toDate || selected.length === 0) {
      showStatusToast("error", "Please fill all customer details and select at least one room.");
      return;
    }
    onConfirmOpen();
  };

  // -----------------------------
  // Final booking from modal
  // -----------------------------
  const confirmBooking = async () => {
    const payload = {
      customer,
      fromDate: fromDate.toISOString().split("T")[0],
      toDate: toDate.toISOString().split("T")[0],
      rooms: selected.map((id) => {
        const asset = assets.find((a) => a.id === id);
        const occ = occupancy[id] || { adults: 1, children: 0 };
        return {
          room_no: asset.label,
          room_type: asset.type,
          adults: occ.adults,
          children: occ.children,
          room_amount: roomPrices[id] || asset.price,
        };
      }),
      total_amount: totalPrice,
    };

    try {
      const response = await fetch("http://localhost:5000/api/addbooking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        showStatusToast("success", `Booking confirmed! Booking No: ${data.booking_no}`);
        // Reset form
        setCustomer({ name: "", mobile: "", aadhar: "", address: "" });
        setSelected([]);
        setOccupancy({});
        setRoomPrices({});
        setFromDate(new Date());
        setToDate(new Date());
        setTotalPrice(0);
        onConfirmClose();
      } else {
        showStatusToast("error", data.message || "Booking failed.");
      }
    } catch (error) {
      console.error(error);
      showStatusToast("error", "Something went wrong. Please try again.");
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Box p={{ base: 4, md: 8 }}>
      {/* Toast container */}
      <ToastMessageContainer />

      {/* STICKY HEADER BOX - Added top and zIndex for stickiness */}
      <Box 
        position="sticky" 
        top="0" 
        mt={4}
        zIndex="sticky" 
        py={4} 
        mx={{ base: -4, md: -8 }} // Compensate for padding in main box
        px={{ base: 4, md: 8 }}
      >
        <Heading 
          fontSize={{ base: "xl", md: "2xl" }} 
          fontWeight="600" 
          color="purple.700"
        >
          Room Booking
        </Heading>
      </Box>
      <br />

      {/* Room Selection */}
      <Card shadow="lg" borderRadius="2xl" bg="white" mb="6">
        <CardBody>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 10 }} spacing="4" width="100%">
            {assets.map((asset) => {
              const isAvailable = availability[asset.id] !== false;
              return (
                <Box
                  key={asset.id}
                  bgGradient={selected.includes(asset.id) ? "linear(to-br, purple.400, purple.600)" : "gray.50"}
                  p="4"
                  rounded="lg"
                  shadow={selected.includes(asset.id) ? "xl" : "sm"}
                  border={selected.includes(asset.id) ? "2px solid purple" : "1px solid #e2e8f0"}
                  cursor={isAvailable ? "pointer" : "not-allowed"}
                  onClick={() => openModal(asset)}
                  _hover={{ transform: isAvailable ? "scale(1.05)" : "none", shadow: isAvailable ? "md" : "sm" }}
                  textAlign="center"
                  opacity={isAvailable ? 1 : 0.5}
                  title={isAvailable ? "" : "Room not available for selected dates"}
                >
                  <Icon
                    as={asset.icon}
                    boxSize={8}
                    mb="1"
                    color={selected.includes(asset.id) ? "white" : "purple.500"}
                  />
                  <Text fontWeight="600">{asset.label}</Text>
                  <Text fontWeight="bold" mt="1" color={selected.includes(asset.id) ? "white" : "gray.700"}>
                    ₹{roomPrices[asset.id] || asset.price}
                  </Text>
                </Box>
              );
            })}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Dates & Customer Details */}
      <Card shadow="lg" borderRadius="2xl" bg="white" mb="6">
        <CardBody>
          <VStack spacing="6" align="stretch">
            <Box>
              <Text fontWeight="600" color="purple.700" mb="2">
                From Date
              </Text>
              <DatePicker
                selected={fromDate}
                onChange={setFromDate}
                selectsStart
                startDate={fromDate}
                endDate={toDate}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                customInput={<Input />}
              />
            </Box>
            <Box>
              <Text fontWeight="600" color="purple.700" mb="2">
                To Date
              </Text>
              <DatePicker
                selected={toDate}
                onChange={setToDate}
                selectsEnd
                startDate={fromDate}
                endDate={toDate}
                minDate={fromDate || new Date()}
                dateFormat="dd/MM/yyyy"
                customInput={<Input />}
              />
            </Box>
            <Box>
              <Text fontWeight="600" color="purple.700" mb="2">
                Customer Details
              </Text>
              <VStack spacing="3" align="stretch">
                <Input
                  placeholder="Customer Name"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
                <Input
                  placeholder="Mobile Number"
                  value={customer.mobile}
                  onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                />
                <Input
                  placeholder="Aadhaar Number"
                  value={customer.aadhar}
                  onChange={(e) => setCustomer({ ...customer, aadhar: e.target.value })}
                />
                <Textarea
                  placeholder="Address"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                />
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      <Divider my="4" />
      <Box textAlign="center">
        <Button
          size="lg"
          bgGradient="linear(to-r, purple.400, purple.600)"
          color="white"
          _hover={{ bgGradient: "linear(to-r, purple.500, purple.700)" }}
          onClick={handleConfirmBooking}
        >
          Confirm Booking
        </Button>
      </Box>

      {/* Modal for Room Details */}
      {currentAsset && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{currentAsset.label} Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing="4" align="stretch">
                <Text>Beds: {currentAsset.beds}</Text>
                <Text>Type: {currentAsset.type}</Text>
                {currentAsset.maxIncluded > 0 && (
                  <HStack spacing="4">
                    <Box>
                      <Text>Adults:</Text>
                      <NumberInput
                        size="sm"
                        value={occupancy[currentAsset.id]?.adults || 1}
                        min={1}
                        max={10}
                        onChange={(value) =>
                          setOccupancy({
                            ...occupancy,
                            [currentAsset.id]: { ...occupancy[currentAsset.id], adults: Number(value) },
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
                        size="sm"
                        value={occupancy[currentAsset.id]?.children || 0}
                        min={0}
                        max={10}
                        onChange={(value) =>
                          setOccupancy({
                            ...occupancy,
                            [currentAsset.id]: { ...occupancy[currentAsset.id], children: Number(value) },
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
                  <Text>Price (Editable):</Text>
                  <NumberInput value={modalPrice} min={0} onChange={(value) => setModalPrice(Number(value))}>
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

      {/* Booking Confirmation Modal (Cleaned up, using the 'Professional' version structure) */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} size="2xl" isCentered scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" p={6}>
          <ModalHeader textAlign="center" fontSize="2xl" color="purple.700">
            Booking Confirmation
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Customer Details */}
              <Box p={5} bg="gray.50" borderRadius="xl" shadow="sm">
                <Text fontWeight="700" color="purple.600" mb={3}>
                  Customer Information
                </Text>
                <SimpleGrid columns={2} spacing={3}>
                  <Text>
                    <strong>Name:</strong> {customer.name}
                  </Text>
                  <Text>
                    <strong>Mobile:</strong> {customer.mobile}
                  </Text>
                  <Text>
                    <strong>Aadhaar:</strong> {customer.aadhar}
                  </Text>
                  <Text>
                    <strong>Address:</strong> {customer.address}
                  </Text>
                </SimpleGrid>
              </Box>

              {/* Booking Dates */}
              <Box p={5} bg="gray.50" borderRadius="xl" shadow="sm">
                <Text fontWeight="700" color="purple.600" mb={3}>
                  Booking Dates
                </Text>
                <HStack spacing={10}>
                  <Text>
                    <strong>From:</strong> {fromDate.toLocaleDateString()}
                  </Text>
                  <Text>
                    <strong>To:</strong> {toDate.toLocaleDateString()}
                  </Text>
                </HStack>
              </Box>

              {/* Rooms & Occupancy Table */}
              <Box p={5} bg="gray.50" borderRadius="xl" shadow="sm">
                <Text fontWeight="700" color="purple.600" mb={3}>
                  Rooms Summary
                </Text>
                <VStack spacing={3} align="stretch">
                  {selected.map((id, index) => {
                    const asset = assets.find((a) => a.id === id);
                    const occ = occupancy[id] || { adults: 1, children: 0 };
                    return (
                      <Box key={id} p={3} bg="white" borderRadius="md" shadow="sm" border="1px solid #E2E8F0">
                        <HStack justify="space-between">
                          <Text fontWeight="600">
                            {index + 1}. {asset.label} ({asset.type})
                          </Text>
                          <Text fontWeight="bold">₹{roomPrices[id] || asset.price}</Text>
                        </HStack>
                        <Text mt={1} color="gray.600">
                          Adults: {occ.adults}, Children: {occ.children}
                        </Text>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>

              {/* Total Amount */}
              <Box p={5} bg="purple.50" borderRadius="xl" shadow="sm" textAlign="right">
                <Text fontSize="xl" fontWeight="700" color="purple.700">
                  Total: ₹{totalPrice}
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter justifyContent="center">
            <Button colorScheme="purple" size="lg" mr={4} onClick={confirmBooking}>
              Confirm Booking
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