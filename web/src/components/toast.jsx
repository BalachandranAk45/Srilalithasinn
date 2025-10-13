import React from "react"; // Add this line
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

export const showStatusToast = (status, message) => {
  const baseStyle = {
    width: "380px",
    height: "60px",
    fontSize: "24",
    color: "#000000",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "bold",
  };

  const icons = {
    success: <CheckCircle size={22} color="#fff" />,
    error: <XCircle size={22} color="#fff" />,
    warning: <AlertTriangle size={22} color="#fff" />,
    info: <Info size={22} color="#fff" />,
    loading: <Loader2 size={22} color="#fff" className="animate-spin" />,
  };

  const backgrounds = {
    success: "linear-gradient(90deg, #00b09b, #96c93d)",
    error: "linear-gradient(90deg, #ff5f6d, #ffc371)",
    warning: "linear-gradient(90deg, #f7971e, #ffd200)",
    info: "linear-gradient(90deg, #56ccf2, #2f80ed)",
    loading: "linear-gradient(90deg, #999, #666)",
  };

  toast(
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {icons[status] || icons.info}
      <span>{message}</span>
    </div>,
    {
      position: "top-right",
      autoClose: status === "loading" ? false : 4000,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
      style: {
        ...baseStyle,
        background: backgrounds[status] || backgrounds.info,
      },
    }
  );
};

export const ToastMessageContainer = () => <ToastContainer />;
