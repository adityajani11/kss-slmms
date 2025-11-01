import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./ProtectedRoute";

import AdminLayout from "./layouts/AdminLayout";
import StaffLayout from "./layouts/StaffLayout";
import StudentLayout from "./layouts/StudentLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStaff from "./pages/admin/ManageStaff";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ManageStudent from "./pages/admin/ManageStudent";
import ManageStandard from "./pages/admin/ManageStandard";
import ManageCategory from "./pages/admin/ManageCategory";
import ManageSubject from "./pages/admin/ManageSubject";
import ManageMCQ from "./pages/admin/ManageMCQ";
import ManageMaterial from "./pages/admin/ManageMaterial";
import StudentForm from "./components/StudentForm";
import StudentProfileManage from "./pages/student/StudentProfileManage";

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Login />} />

      {/* Route for student register */}
      <Route path="/student/register" element={<StudentForm />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="manage-staff" element={<ManageStaff />} />
        <Route path="manage-student" element={<ManageStudent />} />
        <Route path="manage-standard" element={<ManageStandard />} />
        <Route path="manage-categories" element={<ManageCategory />} />
        <Route path="manage-subjects" element={<ManageSubject />} />
        <Route path="manage-mcqs" element={<ManageMCQ />} />
        <Route path="manage-materials" element={<ManageMaterial />} />
      </Route>

      {/* Staff Routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="manage-mcqs" element={<ManageMCQ />} />
        <Route path="manage-materials" element={<ManageMaterial />} />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="manage-profile" element={<StudentProfileManage />} />
      </Route>
    </Routes>
  );
}

export default App;
