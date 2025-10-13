const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

// ====================
// Middleware
// ====================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(bodyParser.json());

// --- MySQL Connection ---
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "Password",
  database: "hotel_app",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL database");
});

// ====================
// SIGN-IN API
// ====================
app.post("/api/signin", (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: "All fields required" });
  }

  db.query(
    "SELECT * FROM users WHERE username=? AND password=? AND role=?",
    [username, password, role],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (results.length === 0) return res.status(401).json({ message: "Invalid credentials" });
      res.json({ message: "Login successful", user: results[0] });
    }
  );
});

// ====================
// BOOKING APIS
// ====================

// Generate booking number
function generateBookingNo() {
  return "BKG" + Date.now();
}

// --------------------
// Check Availability
// --------------------
app.get("/api/check-availability", (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: "from and to dates are required" });
  }

  const rooms = [
    { id: "room1", label: "S1", type: "Standard" },
    { id: "room2", label: "S2", type: "Standard" },
    { id: "room3", label: "SB1", type: "Standard" },
    { id: "room4", label: "SB2", type: "Standard" },
    { id: "room5", label: "SB3", type: "Standard" },
    { id: "deluxe", label: "D1", type: "Deluxe" },
    { id: "apartment1", label: "A1", type: "Apartment" },
    { id: "apartment2", label: "A2", type: "Apartment" },
    { id: "apartment3", label: "A3", type: "Apartment" },
    { id: "hall", label: "H1", type: "Hall" },
  ];

  const sql = `
    SELECT room_no
    FROM booking_details
    WHERE status IN ('Booked','CheckedIn')
      AND NOT (to_date < ? OR from_date > ?)
  `;

  db.query(sql, [from, to], (err, results) => {
    if (err) return res.status(500).json({ message: "Error checking availability", error: err.sqlMessage });

    // Map booked room numbers to labels (match your rooms array)
    const roomMapping = {
      1: "S1",
      2: "S2",
      3: "SB1",
      4: "SB2",
      5: "SB3",
      6: "D1",
      7: "A1",
      8: "A2",
      9: "A3",
      10: "H1",
    };

    const bookedRooms = results.map((r) => roomMapping[r.room_no]);

    const availability = rooms.map((room) => ({
      ...room,
      isAvailable: !bookedRooms.includes(room.label),
    }));

    res.json(availability);
  });
});

// --------------------
// Add Booking
// --------------------
app.post("/api/addbooking", (req, res) => {
  const { customer, fromDate, toDate, rooms, total_amount } = req.body;

  if (!customer || !fromDate || !toDate || !rooms || rooms.length === 0) {
    return res.status(400).json({ message: "Invalid booking data" });
  }

  db.beginTransaction(async (err) => {
    if (err) return res.status(500).json({ message: "Transaction error", error: err.message });

    try {
      const booking_no = generateBookingNo();

      // Insert customer
      const customerSQL =
        "INSERT INTO customers (booking_no, customer_name, mobile, aadhar, address) VALUES (?, ?, ?, ?, ?)";
      const [customerResult] = await new Promise((resolve, reject) =>
        db.query(
          customerSQL,
          [booking_no, customer.name, customer.mobile, customer.aadhar, customer.address],
          (err, result) => (err ? reject(err) : resolve([result]))
        )
      );
      const customer_id = customerResult.insertId;

      // Insert rooms with availability check
      for (const room of rooms) {
        // Check if room already booked
        const checkSQL = `
          SELECT COUNT(*) AS cnt 
          FROM booking_details 
          WHERE room_no=? AND status IN ('Booked','CheckedIn') 
            AND NOT (to_date < ? OR from_date > ?)
        `;
        const [checkResult] = await new Promise((resolve, reject) =>
          db.query(checkSQL, [room.room_no, fromDate, toDate], (err, result) => (err ? reject(err) : resolve([result])))
        );

        if (checkResult[0].cnt > 0) {
          await new Promise((r) => db.rollback(r));
          return res.status(400).json({ message: `Room ${room.room_no} is already booked for selected dates.` });
        }

        // Insert booking
        const bookingSQL = `
          INSERT INTO booking_details (customer_id, room_no, room_type, from_date, to_date, room_amount) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        await new Promise((resolve, reject) =>
          db.query(
            bookingSQL,
            [customer_id, room.room_no, room.room_type, fromDate, toDate, room.room_amount || 0],
            (err, result) => (err ? reject(err) : resolve(result))
          )
        );
      }

      db.commit((err) => {
        if (err) return db.rollback(() => res.status(500).json({ message: "Commit failed", error: err.message }));
        res.json({ message: "Booking successful", booking_no });
      });
    } catch (error) {
      db.rollback(() => res.status(500).json({ message: "Booking failed", error: error.message }));
    }
  });
});

// --------------------
// Get All Bookings
// --------------------
app.get("/api/bookings", (req, res) => {
  let { page, limit } = req.query;

  page = parseInt(page) || 1; // default page = 1
  limit = parseInt(limit) || 10; // default 10 records per page
  const offset = (page - 1) * limit;

  // Total count query
  const countSql = `SELECT COUNT(*) AS total FROM booking_details`;

  db.query(countSql, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Count error", error: err.sqlMessage });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const sql = `
      SELECT 
        b.booking_id,
        c.customer_name AS name,
        c.customer_id,
        c.mobile,
        c.booking_no,
        b.room_no,
        b.room_type,
        b.room_amount AS total_amount,
        DATE_FORMAT(b.from_date, '%Y-%m-%d') AS checkIn,
        DATE_FORMAT(b.to_date, '%Y-%m-%d') AS checkOut,
        b.status
      FROM booking_details b
      JOIN customers c ON b.customer_id = c.customer_id
      ORDER BY b.from_date DESC
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [limit, offset], (err, results) => {
      if (err) return res.status(500).json({ message: "Fetch bookings error", error: err.sqlMessage });

      res.json({
        page,
        totalPages,
        totalRecords: total,
        bookings: results,
      });
    });
  });
});

// ====================
// GENERATE BILL BY CUSTOMER ID
// ====================
app.get("/api/generatebill/customer/:customer_id", (req, res) => {
  const { customer_id } = req.params;

  if (!customer_id) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  const sql = `
    SELECT 
      c.customer_name AS name,
      c.mobile,
      c.aadhar,
      c.address,
      c.booking_no,
      b.booking_id,
      b.room_no,
      b.room_type,
      b.from_date,
      b.to_date,
      b.room_amount,
      b.status
    FROM booking_details b
    JOIN customers c ON b.customer_id = c.customer_id
    WHERE c.customer_id = ?
    ORDER BY b.from_date
  `;

  db.query(sql, [customer_id], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching bill", error: err.sqlMessage });

    if (results.length === 0) return res.status(404).json({ message: "Customer or bookings not found" });

    // Calculate total amount
    const totalAmount = results.reduce((sum, room) => sum + parseFloat(room.room_amount), 0);

    // Group rooms by booking_no
    const bookings = {};
    results.forEach((r) => {
      if (!bookings[r.booking_no]) bookings[r.booking_no] = [];
      bookings[r.booking_no].push({
        room_no: r.room_no,
        room_type: r.room_type,
        from_date: r.from_date,
        to_date: r.to_date,
        status: r.status,
        room_amount: r.room_amount,
      });
    });

    res.json({
      customer: {
        id: customer_id,
        name: results[0].name,
        mobile: results[0].mobile,
        aadhar: results[0].aadhar,
        address: results[0].address,
      },
      bookings: bookings,
      total_amount: totalAmount,
    });
  });
});

// --------------------
// Update Booking Status
// --------------------
app.patch("/api/bookings/:id/status", (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  if (!["Booked", "CheckedIn", "CheckedOut", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  db.query("UPDATE booking_details SET status=? WHERE booking_id=?", [status, bookingId], (err, result) => {
    if (err) return res.status(500).json({ message: "Update booking status error", error: err.sqlMessage });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking status updated successfully", booking_id: bookingId, status });
  });
});
// --------------------
// REPORT API
// --------------------
app.get("/api/report", (req, res) => {
  let { page, limit, fromDate, toDate } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const offset = (page - 1) * limit;

  let whereClauses = ["b.status='CheckedOut'"];
  let params = [];

  if (fromDate) {
    whereClauses.push("b.to_date >= ?");
    params.push(fromDate);
  }
  if (toDate) {
    whereClauses.push("b.to_date <= ?");
    params.push(toDate);
  }

  const whereSQL = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

  // First get total count after filters
  const countSql = `
    SELECT COUNT(*) AS total
    FROM booking_details b
    JOIN customers c ON b.customer_id = c.customer_id
    ${whereSQL}
  `;

  db.query(countSql, params, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Count error", error: err.sqlMessage });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const sql = `
      SELECT 
        b.booking_id,
        c.customer_name AS name,
        c.customer_id,
        c.mobile,
        c.booking_no,
        b.room_no,
        b.room_type,
        b.room_amount AS total_amount,
        DATE_FORMAT(b.from_date, '%Y-%m-%d') AS checkIn,
        DATE_FORMAT(b.to_date, '%Y-%m-%d') AS checkOut,
        b.status
      FROM booking_details b
      JOIN customers c ON b.customer_id = c.customer_id
      ${whereSQL}
      ORDER BY b.to_date DESC
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [...params, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ message: "Fetch report error", error: err.sqlMessage });

      res.json({
        page,
        totalPages,
        totalRecords: total,
        bookings: results,
      });
    });
  });
});

// ====================
// EXPENSE APIS
// ====================
app.post("/api/addexpense", (req, res) => {
  const { invoice, description, amount } = req.body;
  if (!invoice || !description || !amount) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "INSERT INTO expenses (invoice, description, amount, created_at) VALUES (?, ?, ?, NOW())";
  db.query(sql, [invoice, description, amount], (err, result) => {
    if (err) return res.status(500).json({ message: "Add expense failed", error: err.sqlMessage });
    res.json({ message: "Expense added successfully", id: result.insertId });
  });
});

app.get("/api/getexpense", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.query("SELECT COUNT(*) AS total FROM expenses", (err, countResult) => {
    if (err) return res.status(500).json({ message: err.message });

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    db.query("SELECT * FROM expenses ORDER BY created_at DESC LIMIT ?, ?", [offset, limit], (err, results) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ expenses: results, totalPages });
    });
  });
});

app.delete("/api/deleteexpense/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM expenses WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Delete expense failed", error: err.sqlMessage });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted successfully" });
  });
});

// ====================
// TEST ROUTE
// ====================
app.get("/", (req, res) => res.send("🏨 Hotel App Backend Running!"));

// ====================
// Start server
// ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
