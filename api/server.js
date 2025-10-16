const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const fs = require("fs");
const mysql = require("mysql2/promise");
const util = require("util");
const { google } = require("googleapis");
const cron = require("node-cron");

// ---- GOOGLE SHEETS SETUP ----
const credentials = JSON.parse(fs.readFileSync("./credentials.json"));
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key.replace(/\\n/g, "\n"),
  scopes: SCOPES,
});

(async () => {
  try {
    await auth.authorize();
    console.log("✅ Google Service Account authenticated successfully!");
  } catch (err) {
    console.error("❌ Google Auth failed:", err);
  }
})();

const sheets = google.sheets({ version: "v4", auth });

// ---- CONFIG ----
const SPREADSHEET_ID = "1UJ1kk2du9_HtvdhFAbmoZpV8doQyQhO8IFWEWsxNWcs";
const SHEET_NAME = "Bookings";
const DB_CONFIG = {
  host: "127.0.0.1",
  user: "root",
  password: "password",
  database: "hotel_app",
};

// ---- UTILITIES ----
function formatToMySQLDateTime(dateStr) {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date)) {
      const [datePart, timePart, meridian] = dateStr.split(" ");
      if (!datePart || !timePart) return null;
      let [year, month, day] = datePart.split("-");
      let [hour, minute] = timePart.split(":");
      hour = parseInt(hour);
      minute = parseInt(minute);
      if (meridian?.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (meridian?.toUpperCase() === "AM" && hour === 12) hour = 0;
      return `${year}-${month}-${day} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    } else {
      return date.toISOString().slice(0, 19).replace("T", " ");
    }
  } catch {
    return null;
  }
}

// ---- SYNC FUNCTION ----
async function syncNewRows() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!B2:J`, // skip header row
    });

    const rows = res.data.values || [];
    if (rows.length === 0) {
      console.log("⚠️ No data found in Google Sheet.");
      return;
    }

    console.log(`📋 Found ${rows.length} rows in sheet.`);

    const connection = await mysql.createConnection(DB_CONFIG);
    const query = util.promisify(connection.query).bind(connection);

    for (const [index, row] of rows.entries()) {
      const fullRow = [...row, "", "", "", "", "", "", "", "", ""].slice(0, 9);
      const [name, email, phone, room_type, check_in, check_out, guests_adult, guests_kids, submitted_at] = fullRow;

      if (!name || !email || !phone) {
        console.log(`⚠️ Skipping incomplete row ${index + 2}`);
        continue;
      }

      const formattedCheckIn = formatToMySQLDateTime(check_in);
      const formattedCheckOut = formatToMySQLDateTime(check_out);

      const existing = await query(
        `SELECT id FROM online_booking 
         WHERE email = ? AND phone = ? AND check_in = ? LIMIT 1`,
        [email.trim(), phone.trim(), formattedCheckIn]
      );

      if (existing.length > 0) {
        console.log(`⏩ Row ${index + 2} skipped — already exists`);
        continue;
      }

      console.log(`🟢 Inserting row ${index + 2}: ${name}`);

      await connection.execute(
        `INSERT INTO online_booking
        (cusname, email, phone, room_type, check_in, check_out, adults, children, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name.trim(),
          email.trim(),
          phone.trim(),
          room_type || "Not specified",
          formattedCheckIn,
          formattedCheckOut,
          guests_adult || 0,
          guests_kids || 0,
          submitted_at || new Date(),
        ]
      );
    }

    await connection.end();
    console.log("✅ All rows inserted successfully into MySQL!");
  } catch (error) {
    console.error("❌ Error syncing:", error.message);
  }
}

// ---- AUTO SYNC EVERY MINUTE ----
cron.schedule("*/1 * * * *", () => {
  console.log("🔁 Checking for new rows in Google Sheet...");
  syncNewRows();
});

// ---- OPTIONAL: Run Once on Server Start ----
syncNewRows();


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
    WHERE status IN ('Booked', 'CheckedIn')
      AND NOT (to_date < ? OR from_date > ?)
  `;

  db.query(sql, [from, to], (err, results) => {
    if (err) return res.status(500).json({ message: "Error checking availability", error: err.sqlMessage });

    // ✅ Directly use room_no values from DB since they are now labels (e.g., "S1", "D1")
    const bookedRooms = results.map((r) => r.room_no);

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
  const { online_id, customer, fromDate, toDate, rooms, total_amount } = req.body;

  if (!customer || !fromDate || !toDate || !rooms || rooms.length === 0) {
    return res.status(400).json({ message: "Invalid booking data" });
  }

  db.beginTransaction(async (err) => {
    if (err) return res.status(500).json({ message: "Transaction error", error: err.message });

    try {
      const booking_no = generateBookingNo();

      // Insert customer into 'customers' table
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

      // Insert into booking_details and update online_booking sts
      for (const room of rooms) {
        // Optional: check if room already booked in booking_details
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

        // Insert into booking_details
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

      // Update online_booking sts = 1 for the given online_id
      if (online_id) {
        const updateOnlineSQL = `
          UPDATE online_booking 
          SET sts = 1, updated_at = NOW() 
          WHERE id = ?
        `;
        const updateResult = await new Promise((resolve, reject) =>
          db.query(updateOnlineSQL, [online_id], (err, result) => (err ? reject(err) : resolve(result)))
        );
        console.log("Online booking update result:", updateResult);
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
app.get("/api/online-bookings", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const from = req.query.from || "";
  const to = req.query.to || "";
  const offset = (page - 1) * limit;

  let whereClause = "WHERE 1=1";
  const params = [];

  if (from) {
    whereClause += " AND check_in >= ?";
    params.push(from);
  }
  if (to) {
    whereClause += " AND check_out <= ?";
    params.push(to);
  }

  const countSQL = `SELECT COUNT(*) AS total FROM online_booking ${whereClause}`;
  db.query(countSQL, params, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Failed to fetch online bookings", error: err.message });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const dataSQL = `
      SELECT * FROM online_booking
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    db.query(dataSQL, [...params, limit, offset], (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch online bookings", error: err.message });

      res.json({
        bookings: rows, // <-- this must be an array
        page,
        totalPages,
        total,
      });
    });
  });
});

// --------------------
// Get All Bookings
// --------------------
app.get("/api/bookings", (req, res) => {
  let { page, limit } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const offset = (page - 1) * limit;

  // Count unique bookings per customer per check-in date
  const countSql = `
    SELECT COUNT(DISTINCT c.customer_id, b.from_date) AS total
    FROM booking_details b
    JOIN customers c ON b.customer_id = c.customer_id
  `;

  db.query(countSql, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Count error", error: err.sqlMessage });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const sql = `
      SELECT
        c.customer_id,
        c.customer_name AS name,
        c.mobile,
        c.booking_no,
        GROUP_CONCAT(b.booking_id) AS booking_ids,         -- added booking_ids
        GROUP_CONCAT(b.room_no SEPARATOR ', ') AS room_no,
        GROUP_CONCAT(b.room_type SEPARATOR ', ') AS room_types,
        SUM(b.room_amount) AS total_amount,
        DATE_FORMAT(MIN(b.from_date), '%Y-%m-%d') AS checkIn,
        DATE_FORMAT(MAX(b.to_date), '%Y-%m-%d') AS checkOut,
        GROUP_CONCAT(b.status SEPARATOR ', ') AS status
      FROM booking_details b
      JOIN customers c ON b.customer_id = c.customer_id
      GROUP BY c.customer_id, b.from_date
      ORDER BY checkIn DESC
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [limit, offset], (err, results) => {
      if (err) return res.status(500).json({ message: "Fetch bookings error", error: err.sqlMessage });

      // Optional: convert booking_ids string to array
      const bookings = results.map((r) => ({
        ...r,
        booking_ids: r.booking_ids.split(",").map(Number),
      }));

      res.json({
        page,
        totalPages,
        totalRecords: total,
        bookings,
      });
    });
  });
});
app.get("/api/online-enquiries", (req, res) => {
  let { page, limit, fromDate, toDate } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const offset = (page - 1) * limit;

  // Build base SQL
  let countSql = "SELECT COUNT(*) AS total FROM online_enquiries WHERE 1=1";
  let dataSql = `
    SELECT 
      id, 
      name, 
      email, 
      phone, 
      DATE_FORMAT(check_in, '%Y-%m-%d') AS checkIn, 
      DATE_FORMAT(check_out, '%Y-%m-%d') AS checkOut,
      created_at
    FROM online_enquiries
    WHERE 1=1
  `;

  const params = [];

  // Apply date filters if provided
  if (fromDate) {
    countSql += " AND check_in >= ?";
    // Add sorting and pagination by creation date
    dataSql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(fromDate);
  }

  if (toDate) {
    countSql += " AND check_out <= ?";
    dataSql += " AND check_out <= ?";
    params.push(toDate);
  }

  // Count total records first
  db.query(countSql, params, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Count error", error: err.sqlMessage });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    // Add sorting and pagination
    dataSql += " ORDER BY check_in DESC LIMIT ? OFFSET ?";
    const finalParams = [...params, limit, offset];

    db.query(dataSql, finalParams, (err, results) => {
      if (err) return res.status(500).json({ message: "Fetch enquiries error", error: err.sqlMessage });

      res.json({
        page,
        totalPages,
        totalRecords: total,
        enquiries: results,
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
app.patch("/api/bookings/status", (req, res) => {
  const { bookingIds, status } = req.body;

  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return res.status(400).json({ message: "bookingIds must be a non-empty array" });
  }

  if (!["Booked", "CheckedIn", "CheckedOut", "Cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const placeholders = bookingIds.map(() => "?").join(", ");
  const sql = `UPDATE booking_details SET status=? WHERE booking_id IN (${placeholders})`;
  const params = [status, ...bookingIds];

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ message: "Update booking status error", error: err.sqlMessage });
    res.json({ message: "Booking status updated successfully", updatedRows: result.affectedRows, status });
  });
});

let lastSeenBookingId = 0;

// GET /new-count → returns number of new bookings since lastSeenBookingId
app.get("/api/online-bookings/new-count", (req, res) => {
  const countQuery = `
    SELECT COUNT(*) AS newCount, COALESCE(MAX(id), ?) AS maxId
    FROM online_booking
    WHERE id > ?
  `;

  db.query(countQuery, [lastSeenBookingId, lastSeenBookingId], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.sqlMessage });

    const newCount = result[0]?.newCount || 0;
    const maxId = result[0]?.maxId || lastSeenBookingId;

    res.json({ newCount, maxId });
  });
});
// Get latest booking ID (for initializing)
app.get("/api/online-bookings/latest-id", (req, res) => {
  const sql = "SELECT COALESCE(MAX(id), 0) AS latestId FROM online_booking";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "DB error", error: err.sqlMessage });
    res.json({ latestId: result[0].latestId });
  });
});

// POST /mark-seen → reset the badge by updating lastSeenBookingId
app.post("/api/online-bookings/mark-seen", (req, res) => {
  const { maxId } = req.body;

  if (!maxId) {
    return res.status(400).json({ message: "maxId is required" });
  }

  lastSeenBookingId = maxId; // update global last seen
  res.json({ success: true, lastSeenBookingId });
});

// --------------------
// REPORT API
// --------------------
app.get("/api/report", (req, res) => {
  let { page, limit, fromDate, toDate } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10; // Default 5 records per page
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

  // Get total count after filters
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
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
