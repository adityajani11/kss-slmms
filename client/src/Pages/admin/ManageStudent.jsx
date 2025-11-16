import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Eye, Edit, Trash2, UserPlus, Search, Filter } from "lucide-react";
import Loader from "../../components/Loader";
import StudentForm from "../../components/StudentForm";

export default function ManageStudent() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOptions, setSearchOptions] = useState({
    city: false,
    schoolName: false,
    cast: false,
    religion: false,
  });
  const [filterStandard, setFilterStandard] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const base = import.meta.env.VITE_API_BASE_URL;

  // Fetch all students
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${base}/students/`);
      const list = res.data?.data?.items || [];
      setStudents(list);
      setFiltered(list);
    } catch (error) {
      console.error("Error fetching students:", error);
      Swal.fire("Error", "Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    document.body.style.overflow = editModalOpen ? "hidden" : "auto";
  }, [editModalOpen]);

  // Handle search + filters
  useEffect(() => {
    let result = [...students];

    if (filterGender) {
      result = result.filter((s) => s.gender === filterGender);
    }

    if (filterStandard) {
      result = result.filter(
        (s) => String(s.standardId?.standard) === String(filterStandard)
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s) => {
        const defaultMatch =
          s.fullName?.toLowerCase().includes(term) ||
          s.username?.toLowerCase().includes(term);

        const cityMatch =
          searchOptions.city && s.city?.toLowerCase().includes(term);
        const districtMatch =
          searchOptions.district && s.district?.toLowerCase().includes(term);
        const schoolMatch =
          searchOptions.schoolName &&
          s.schoolName?.toLowerCase().includes(term);
        const castMatch =
          searchOptions.cast && s.cast?.toLowerCase().includes(term);

        return (
          defaultMatch || cityMatch || districtMatch || schoolMatch || castMatch
        );
      });
    }

    setFiltered(result);
  }, [students, searchTerm, searchOptions, filterStandard, filterGender]);

  // View details
  const handleView = (student) => {
    Swal.fire({
      icon: "info",
      title: `<strong>${student.fullName}</strong>`,
      html: `
      <div style="text-align: left; line-height: 1.6;">
        <p><b>Username:</b> ${student.username || "N/A"}</p>
        <p><b>City:</b> ${student.city || "N/A"}</p>
        <p><b>District:</b> ${student.district || "N/A"}</p>
        <p><b>School Name:</b> ${student.schoolName || "N/A"}</p>
        <p><b>Standard:</b> ${student.standardId?.standard || "N/A"}</p>
        ${
          student.stream
            ? `<p><b>Stream:</b> ${student.stream}</p>`
            : `<p><b>Stream:</b> -</p>`
        }
        <p><b>Gender:</b> ${student.gender || "N/A"}</p>
        <p><b>Cast:</b> ${student.cast || "N/A"}</p>
        <p><b>Category:</b> ${student.category || "N/A"}</p>
        <p><b>Contact:</b> ${student.contactNumber || "N/A"}</p>
        <p><b>WhatsApp:</b> ${student.whatsappNumber || "N/A"}</p>
        <p><b>Registered On:</b> ${
          student.createdAt
            ? new Date(student.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
            : "N/A"
        }</p>
      </div>
    `,
      confirmButtonColor: "#2563eb",
    });
  };

  // Edit
  const handleEdit = (student) => {
    setSelectedStudent(student);
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    // Step 1: Ask for deletion password
    const { value: password } = await Swal.fire({
      title: "Enter Delete Password",
      input: "password",
      inputLabel: "This action requires admin delete password",
      inputPlaceholder: "Enter delete password",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Verify",
    });

    if (!password) return; // user cancelled

    try {
      setLoading(true);

      // Step 2: Verify delete password
      const verifyRes = await axios.post(
        `${base}/students/verify-student-delete-password`,
        {
          password,
        }
      );

      if (!verifyRes.data.success) {
        Swal.fire("Denied", "Invalid delete password!", "error");
        return;
      }

      // Step 3: Ask final confirmation
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "This student record will be deleted permanently!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete!",
      });

      if (!confirm.isConfirmed) return;

      // Step 4: Delete student
      await axios.delete(`${base}/students/${id}/hard`);

      Swal.fire("Deleted!", "Student record has been deleted.", "success");
      fetchStudents();
    } catch (error) {
      Swal.fire("Error", "Failed to verify or delete student", "error");
    } finally {
      setLoading(false);
    }
  };

  // Download as PDF with confirmation
  const downloadPDF = async () => {
    if (filtered.length === 0) return;

    const confirm = await Swal.fire({
      title: "Download PDF?",
      text: "Do you want to download the student list as a PDF file?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, download",
    });

    if (!confirm.isConfirmed) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "A4",
    });

    doc.setFontSize(14);
    doc.text("Student List", 40, 40);

    const tableColumn = [
      "#",
      "Full Name",
      "Username",
      "City",
      "District",
      "School Name",
      "Standard",
      "Stream",
      "Gender",
      "Cast",
      "Category",
      "Contact Number",
      "WhatsApp Number",
    ];

    const tableRows = filtered.map((s, i) => [
      i + 1,
      s.fullName || "N/A",
      s.username || "N/A",
      s.city || "N/A",
      s.district || "N/A",
      s.schoolName || "N/A",
      s.standardId?.standard || "N/A",
      s.stream || "-",
      s.gender || "N/A",
      s.cast || "N/A",
      s.category || "N/A",
      s.contactNumber || "N/A",
      s.whatsappNumber || "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 50, bottom: 30 },
      didDrawPage: function (data) {
        // Add footer with page number + date
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          `Generated on: ${new Date().toLocaleDateString()}`,
          40,
          doc.internal.pageSize.height - 20
        );
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width - 100,
          doc.internal.pageSize.height - 20
        );
      },
    });

    doc.save("STUDENTS.pdf");
  };

  // Download as Excel with confirmation (all data)
  const downloadExcel = async () => {
    if (filtered.length === 0) return;

    const confirm = await Swal.fire({
      title: "Download Excel?",
      text: "Do you want to download the complete student list as an Excel file?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, download",
    });

    if (!confirm.isConfirmed) return;

    // Include all relevant fields
    const wsData = filtered.map((s, index) => ({
      "#": index + 1,
      "Full Name": s.fullName || "N/A",
      Username: s.username || "N/A",
      City: s.city || "N/A",
      District: s.district || "N/A",
      "School Name": s.schoolName || "N/A",
      Standard: s.standardId?.standard || "N/A",
      Stream: s.stream || "-",
      Gender: s.gender || "N/A",
      Cast: s.cast || "N/A",
      Category: s.category || "N/A",
      "Contact Number": s.contactNumber || "N/A",
      "WhatsApp Number": s.whatsappNumber || "N/A",
      "Registered On": s.createdAt
        ? new Date(s.createdAt).toLocaleDateString("en-IN")
        : "N/A",
    }));

    // Create worksheet + workbook
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Auto width for columns
    const columnWidths = Object.keys(wsData[0] || {}).map((key) => ({
      wch: Math.max(key.length + 2, 15),
    }));
    worksheet["!cols"] = columnWidths;

    // Write Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "STUDENTS.xlsx");
  };

  if (loading) return <Loader />;

  return (
    <div className="px-3 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
          Manage Students
        </h1>

        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
          <button
            onClick={downloadPDF}
            disabled={filtered.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all ${
              filtered.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-red-100 hover:bg-red-200 text-red-700"
            }`}
          >
            PDF
          </button>

          <button
            onClick={downloadExcel}
            disabled={filtered.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all ${
              filtered.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-green-100 hover:bg-green-200 text-green-700"
            }`}
          >
            Excel
          </button>

          <button
            onClick={() => {
              setSelectedStudent(null);
              setEditModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-all"
          >
            <UserPlus size={18} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg transition-all"
          >
            <Filter size={18} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Collapsible Filters */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            showFilters
              ? "max-h-96 mt-4 opacity-100 cursor-pointer"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Checkboxes */}
            <div className="flex flex-wrap gap-3">
              {["city", "district", "schoolName", "cast"].map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={searchOptions[key]}
                    onChange={(e) =>
                      setSearchOptions({
                        ...searchOptions,
                        [key]: e.target.checked,
                      })
                    }
                    className="accent-indigo-600"
                  />
                  Search by {key === "schoolName" ? "school" : key}
                </label>
              ))}
            </div>

            {/* Dropdown filters */}
            <div className="flex flex-wrap p-2 gap-3">
              <select
                value={filterStandard}
                onChange={(e) => setFilterStandard(e.target.value)}
                className="border cursor-pointer border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Standards</option>
                {[...new Set(students.map((s) => s.standardId?.standard))].map(
                  (std) =>
                    std && (
                      <option key={std} value={std}>
                        {std}
                      </option>
                    )
                )}
              </select>

              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="border cursor-pointer border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 🧾 Student Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500 text-lg shadow-sm">
          No students found.
        </div>
      ) : (
        <>
          {/* Table for md+ */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-indigo-100">
                <tr className="text-left">
                  <th className="p-3">#</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">City</th>
                  <th className="p-3">School Name</th>
                  <th className="p-3">Standard</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => (
                  <tr
                    key={student._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{student.fullName || "N/A"}</td>
                    <td className="p-3">{student.city || "N/A"}</td>
                    <td className="p-3">{student.schoolName || "N/A"}</td>
                    <td className="p-3">
                      {student.standardId?.standard || "N/A"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleView(student)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card layout for mobile */}
          <div className="sm:hidden grid grid-cols-1 gap-3">
            {filtered.map((student) => (
              <div
                key={student._id}
                className="border p-3 rounded-lg shadow-sm bg-white flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {student.fullName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {student.city} • {student.schoolName}
                  </p>
                  <p className="text-sm">
                    <b>Standard:</b> {student.standardId?.standard || "N/A"}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <button
                    onClick={() => handleView(student)}
                    className="text-blue-600 hover:text-blue-800 transition"
                    title="View"
                  >
                    <Eye size={22} />
                  </button>
                  <button
                    onClick={() => handleEdit(student)}
                    className="text-green-600 hover:text-green-800 transition"
                    title="Edit"
                  >
                    <Edit size={22} />
                  </button>
                  <button
                    onClick={() => handleDelete(student._id)}
                    className="text-red-600 hover:text-red-800 transition"
                    title="Delete"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {editModalOpen && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
          >
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative bg-white rounded-2xl shadow-lg w-[90%] sm:w-[600px] max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute cursor-pointer top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              <StudentForm
                editingStudent={selectedStudent}
                onClose={() => setEditModalOpen(false)}
                onSave={fetchStudents}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
