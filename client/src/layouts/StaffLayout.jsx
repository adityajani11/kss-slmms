import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function StaffLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar panelType="staff" />
      <main className="flex-1 p-6 bg-gray-50 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
