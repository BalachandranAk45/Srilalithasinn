// src/context/NotificationContext.js
import React, { createContext, useState, useEffect } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [newBookings, setNewBookings] = useState(0);

  const fetchNewBookings = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/online-bookings?limit=1&page=1");
      const data = await res.json();
      const totalNew = (data.bookings || []).filter(b => b.sts === 0).length;
      setNewBookings(totalNew);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  useEffect(() => {
    fetchNewBookings();
    const interval = setInterval(fetchNewBookings, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ newBookings }}>
      {children}
    </NotificationContext.Provider>
  );
};
