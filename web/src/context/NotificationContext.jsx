import React, { createContext, useState, useEffect, useRef } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [newBookings, setNewBookings] = useState(0);
  const maxIdRef = useRef(0);

  // Fetch baseline latest ID on first login or refresh
  const fetchLatestId = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/online-bookings/latest-id");
      const data = await res.json();

      // Save baseline so old records aren't treated as new
      maxIdRef.current = data.latestId || 0;
      localStorage.setItem("lastMaxId", data.latestId || 0);
    } catch (err) {
      console.error("Error fetching latest booking ID:", err);
    }
  };

  // Fetch new bookings since last seen
  const fetchNewBookings = async () => {
    try {
      const lastSeen = localStorage.getItem("lastMaxId") || 0;
      const res = await fetch(`http://localhost:8000/api/online-bookings/new-count?lastSeen=${lastSeen}`);
      const data = await res.json();

      setNewBookings(data.newCount || 0);
      if (data.maxId > maxIdRef.current) {
        maxIdRef.current = data.maxId;
      }
    } catch (err) {
      console.error("Error fetching new bookings:", err);
    }
  };

  useEffect(() => {
    fetchLatestId().then(() => {
      fetchNewBookings(); // first check after baseline set
    });

    const interval = setInterval(fetchNewBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  // Reset when user clicks bell
  const resetNewBookings = async () => {
    try {
      await fetch("http://localhost:8000/api/online-bookings/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxId: maxIdRef.current }),
      });
      localStorage.setItem("lastMaxId", maxIdRef.current);
      setNewBookings(0);
    } catch (err) {
      console.error("Error resetting bookings:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ newBookings, resetNewBookings }}>{children}</NotificationContext.Provider>
  );
};
