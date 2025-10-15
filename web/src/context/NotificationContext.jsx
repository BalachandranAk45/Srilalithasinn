import React, { createContext, useState, useEffect, useRef } from "react";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [newBookings, setNewBookings] = useState(0);
  const maxIdRef = useRef(0); // track latest maxId from API

  // Poll API every 10 seconds
  const fetchNewBookings = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/online-bookings/new-count");
      const data = await res.json();

      setNewBookings(data.newCount || 0);
      maxIdRef.current = data.maxId || maxIdRef.current;
    } catch (err) {
      console.error("Error fetching new bookings:", err);
    }
  };

  useEffect(() => {
    fetchNewBookings(); // initial fetch
    const interval = setInterval(fetchNewBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  // Reset badge when bell clicked
  const resetNewBookings = async () => {
    try {
      await fetch("http://localhost:5000/api/online-bookings/mark-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxId: maxIdRef.current }),
      });

      setNewBookings(0);
    } catch (err) {
      console.error("Error resetting bookings:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ newBookings, resetNewBookings }}>{children}</NotificationContext.Provider>
  );
};
