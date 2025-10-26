import React from "react";
import { Navigate } from "react-router-dom";

// Accepts the component to render and allowed roles
export default function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("slmms_user")); // stored at login
  const token = localStorage.getItem("slmms_token");

  // If no token or user → redirect to login
  if (!token || !user) return <Navigate to="/" replace />;

  // If role not allowed → redirect to login
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
