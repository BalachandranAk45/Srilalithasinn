// src/components/InvoiceTemplate.jsx
import React from "react";

// --- Theme Configuration & Styles ---

const THEME = {
  primaryGradient: "linear-gradient(90deg, #B19CD9, #A084CA)", // Soft purple gradient
  secondary: "#F5F3FA", // Light background for info boxes
  text: "#333333",
  lightText: "#666666",
  borderColor: "#DDD6F3",
  tableOdd: "#FFFFFF",
  tableEven: "#F9F8FC",
};

const styles = {
  container: {
    width: "850px",
    margin: "20px auto",
    padding: "40px",
    fontFamily: "'Lato', 'Helvetica', 'Arial', sans-serif",
    backgroundColor: "#ffffff",
    color: THEME.text,
    border: `1px solid ${THEME.borderColor}`,
    borderRadius: "12px",
    boxShadow: "0 15px 30px rgba(0,0,0,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderRadius: "10px",
    padding: "20px",
    background: THEME.primaryGradient,
    color: "#fff",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  },
  hotelTitle: {
    margin: 0,
    fontSize: "32px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    letterSpacing: "1px",
  },
  invoiceTitle: {
    margin: 0,
    fontSize: "24px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    letterSpacing: "1px",
  },
  infoContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "30px",
  },
  infoBox: {
    width: "48%",
    padding: "20px",
    backgroundColor: THEME.secondary,
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.03)",
    fontFamily: "'Lato', sans-serif",
  },
  infoBoxTitle: {
    marginBottom: "10px",
    color: "#A084CA",
    borderBottom: "2px solid #A084CA",
    paddingBottom: "5px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "20px",
    fontSize: "14px",
    fontFamily: "'Lato', sans-serif",
    boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  tableHead: {
    background: THEME.primaryGradient,
    color: "#fff",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
  },
  tableCell: {
    padding: "12px",
    border: `1px solid ${THEME.borderColor}`,
  },
  totalSection: {
    textAlign: "right",
    padding: "20px",
    background: THEME.primaryGradient,
    color: "#fff",
    borderRadius: "10px",
    fontSize: "18px",
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  },
  footer: {
    textAlign: "center",
    paddingTop: "20px",
    marginTop: "30px",
    borderTop: "1px dashed #ccc",
    color: "#777",
    fontStyle: "italic",
    fontSize: "13px",
    fontFamily: "'Lato', sans-serif",
  },
};

const InvoiceTemplate = ({ data }) => {
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-GB");

  const getRowStyle = (idx) => ({
    backgroundColor: idx % 2 === 0 ? THEME.tableOdd : THEME.tableEven,
    transition: "background-color 0.3s",
  });

  return (
    <div id="invoice" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.hotelTitle}>Hotel Sri Lalitha's Inn</h1>
          <p style={{ margin: "5px 0", fontSize: "14px", color: "#fff" }}>
            Luxury Stay & Comfort
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={styles.invoiceTitle}>INVOICE</h2>
          <p style={{ margin: "5px 0", fontSize: "14px" }}>
            {new Date().toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      {/* Info Sections */}
      <div style={styles.infoContainer}>
        <div style={styles.infoBox}>
          <h3 style={styles.infoBoxTitle}>Customer Details</h3>
          <p><strong>Name:</strong> {data.customer.name}</p>
          <p><strong>Mobile:</strong> {data.customer.mobile}</p>
          <p><strong>Aadhar:</strong> {data.customer.aadhar}</p>
          <p><strong>Address:</strong> {data.customer.address}</p>
        </div>
        <div style={styles.infoBox}>
          <h3 style={styles.infoBoxTitle}>Hotel Details</h3>
          <p><strong>Hotel Sri Lalitha's Inn</strong></p>
          <p>Luxury Street, Thanjavur</p>
          <p>Contact: 93682792</p>
        </div>
      </div>

      {/* Booking Table */}
      <table style={styles.table}>
        <thead style={styles.tableHead}>
          <tr>
            <th style={styles.tableCell}>Booking No</th>
            <th style={styles.tableCell}>Room</th>
            <th style={styles.tableCell}>Type</th>
            <th style={styles.tableCell}>From</th>
            <th style={styles.tableCell}>To</th>
            <th style={styles.tableCell}>Status</th>
            <th style={styles.tableCell}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(data.bookings).map((bookingNo) =>
            data.bookings[bookingNo].map((b, idx) => (
              <tr key={idx} style={getRowStyle(idx)}>
                <td style={styles.tableCell}>{bookingNo}</td>
                <td style={styles.tableCell}>{b.room_no}</td>
                <td style={styles.tableCell}>{b.room_type}</td>
                <td style={styles.tableCell}>{formatDate(b.from_date)}</td>
                <td style={styles.tableCell}>{formatDate(b.to_date)}</td>
                <td style={styles.tableCell}>{b.status}</td>
                <td style={{ ...styles.tableCell, textAlign: "right" }}>{b.room_amount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Total Amount */}
      <div style={styles.totalSection}>Total: ₹{data.total_amount}</div>

      {/* Footer */}
      <div style={styles.footer}>
        Thank you for choosing <strong>Hotel Sri Lalitha's Inn</strong>! We hope to see you again.
      </div>
    </div>
  );
};

export default InvoiceTemplate;
