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
  const [errors, setErrors] = useState({
    name: "",
    mobile: "",
    aadhar: "",
    address: "",
    fromDate: "",
    toDate: "",
    rooms: "",
  });
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

  // -----------------------------
  // Fetch availability whenever dates change
  // -----------------------------
  useEffect(() => {
    fetchAvailability(fromDate, toDate);
  }, []);

  useEffect(() => {
    const booking = location.state?.bookingData;
    if (booking) {
      setOnlineId(booking.id || null);
      setCustomer((prev) => ({
        ...prev,
        name: booking.cusname || prev.name,
        mobile: booking.phone || prev.mobile,
        email: booking.email || prev.email,
      }));
      if (booking.check_in) setFromDate(new Date(booking.check_in));
      if (booking.check_out) setToDate(new Date(booking.check_out));
      if (booking.rooms && Array.isArray(booking.rooms)) {
        const roomIds = [];
        const prices = {};
        const occ = {};
        booking.rooms.forEach((r) => {
          const asset = assets.find((a) => a.label === r.room_no);
          if (asset) {
            roomIds.push(asset.id);
            prices[asset.id] = r.room_amount || asset.price;
            occ[asset.id] = { adults: r.adults || 1, children: r.children || 0 };
          }
        });
        setSelected(roomIds);
        setRoomPrices(prices);
        setOccupancy(occ);
      }
    }
  }, [location.state, assets]);

  const handleFromDateChange = (date) => {
    setFromDate(date);
    fetchAvailability(date, toDate);
  };

  const handleToDateChange = (date) => {
    setToDate(date);
    fetchAvailability(fromDate, date);
  };

  const fetchAvailability = async (from, to) => {
    try {
      const fromStr = from.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
      const toStr = to.toLocaleDateString("en-CA");

      const res = await fetch(`http://localhost:5000/api/check-availability?from=${fromStr}&to=${toStr}`);
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

  useEffect(() => {
    let total = 0;
    selected.forEach((id) => {
      total += roomPrices[id] || assets.find((a) => a.id === id).price;
    });
    setTotalPrice(total);
  }, [selected, roomPrices, assets]);

  const handleConfirmBooking = () => {
    const newErrors = {
      name: customer.name ? "" : "Name is required",
      mobile: customer.mobile
        ? /^\d{10}$/.test(customer.mobile)
          ? ""
          : "Mobile number must be 10 digits"
        : "Mobile number is required",
      aadhar: customer.aadhar
        ? /^\d{12}$/.test(customer.aadhar)
          ? ""
          : "Aadhaar number must be 12 digits"
        : "Aadhaar number is required",
      address: customer.address ? "" : "Address is required",
      fromDate: fromDate ? "" : "From date is required",
      toDate: toDate ? "" : "To date is required",
      rooms: selected.length > 0 ? "" : "Please select at least one room to proceed with the booking.",
    };

    setErrors(newErrors);

    const hasError = Object.values(newErrors).some((err) => err !== "");

    if (newErrors.rooms) showStatusToast("error", newErrors.rooms);

    if (!hasError) onConfirmOpen();
  };

  const confirmBooking = async () => {
    const payload = {
      online_id: onlineId,
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
        setCustomer({ name: "", mobile: "", aadhar: "", address: "", email: "" });
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
      <ToastMessageContainer />

      <Box position="sticky" top="0" zIndex="sticky" py={{ base: 3, md: 4 }} px={0} bg="white">
        <Heading fontSize={{ base: "lg", md: "2xl" }} fontWeight="600" color="purple.700">
          Room Booking
        </Heading>
      </Box>

      {/* Room Selection */}
      <Card shadow="lg" borderRadius="2xl" bg="white" mb="6">
        <CardBody>
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6, xl: 10 }} spacing={3} width="100%">
            {assets.map((asset) => {
              const isAvailable = availability[asset.id] !== false;
              const isSelected = selected.includes(asset.id);
              return (
                <Box
                  key={asset.id}
                  bgGradient={isSelected ? "linear(to-br, purple.400, purple.600)" : "gray.50"}
                  p={4}
                  rounded="lg"
                  shadow={isSelected ? "xl" : "sm"}
                  border={isSelected ? "2px solid purple" : "1px solid #e2e8f0"}
                  cursor={isAvailable ? "pointer" : "not-allowed"}
                  onClick={() => isAvailable && openModal(asset)}
                  _hover={{ transform: isAvailable ? "scale(1.05)" : "none", shadow: isAvailable ? "md" : "sm" }}
                  textAlign="center"
                  opacity={isAvailable ? 1 : 0.5}
                  title={isAvailable ? "" : "Room not available"}
                >
                  <Icon
                    as={asset.icon}
                    boxSize={{ base: 6, sm: 7, md: 8 }}
                    mb={1}
                    color={isSelected ? "white" : "purple.500"}
                  />
                  <Text fontWeight="600" fontSize={{ base: "sm", md: "md" }}>
                    {asset.label}
                  </Text>
                  <Text
                    fontWeight="bold"
                    mt={1}
                    color={isSelected ? "white" : "gray.700"}
                    fontSize={{ base: "sm", md: "md" }}
                  >
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
          <VStack spacing={6} align="stretch">
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="600" color="purple.700" mb={2}>
                  From Date
                </Text>
                <DatePicker
                  selected={fromDate}
                  onChange={handleFromDateChange}
                  selectsStart
                  startDate={fromDate}
                  endDate={toDate}
                  minDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  customInput={<Input />}
                />
                {errors.fromDate && (
                  <Text color="red.500" fontSize="sm">
                    {errors.fromDate}
                  </Text>
                )}
              </Box>
              <Box>
                <Text fontWeight="600" color="purple.700" mb={2}>
                  To Date
                </Text>
                <DatePicker
                  selected={toDate}
                  onChange={handleToDateChange}
                  selectsEnd
                  startDate={fromDate}
                  endDate={toDate}
                  minDate={fromDate || new Date()}
                  dateFormat="dd/MM/yyyy"
                  customInput={<Input />}
                />
                {errors.toDate && (
                  <Text color="red.500" fontSize="sm">
                    {errors.toDate}
                  </Text>
                )}
              </Box>
            </SimpleGrid>

            {/* Customer Details */}
            <VStack spacing={3} align="stretch">
              <Text fontWeight="600" color="purple.700">
                Customer Details
              </Text>
              <Input
                placeholder="Customer Name"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
              {errors.name && (
                <Text color="red.500" fontSize="sm">
                  {errors.name}
                </Text>
              )}
              <Input
                placeholder="Mobile Number"
                value={customer.mobile}
                onChange={(e) => /^\d*$/.test(e.target.value) && setCustomer({ ...customer, mobile: e.target.value })}
              />
              {errors.mobile && (
                <Text color="red.500" fontSize="sm">
                  {errors.mobile}
                </Text>
              )}
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
              {errors.aadhar && (
                <Text color="red.500" fontSize="sm">
                  {errors.aadhar}
                </Text>
              )}
              <Textarea
                placeholder="Address"
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              />
              {errors.address && (
                <Text color="red.500" fontSize="sm">
                  {errors.address}
                </Text>
              )}
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      <Divider my={4} />
      <Box textAlign="center">
        <Button
          size={{ base: "md", md: "lg" }}
          bgGradient="linear(to-r, purple.400, purple.600)"
          color="white"
          _hover={{ bgGradient: "linear(to-r, purple.500, purple.700)" }}
          onClick={handleConfirmBooking}
        >
          Confirm Booking
        </Button>
      </Box>

      {/* Room Details Modal */}
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

      {/* Booking Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} size="2xl" isCentered scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" p={6}>
          <ModalHeader textAlign="center" fontSize="2xl" color="purple.700">
            Booking Confirmation
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Customer Info */}
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

              {/* Rooms Summary */}
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
