import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Trash2, Power, PlusCircle } from "lucide-react";
import Loader from "../../components/Loader";

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const base = import.meta.env.VITE_API_BASE_URL;

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base}/subjects`);
      const data = res.data?.data || [];
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      Swal.fire("Error", "Failed to load subjects", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Add subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    const name = newSubject.trim();

    if (!name) {
      Swal.fire("Warning", "Please enter a subject name", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${base}/subjects`, { name });
      if (res.data.success) {
        Swal.fire("Added!", `Subject "${name}" added successfully`, "success");
        setNewSubject("");
        fetchSubjects();
      } else {
        Swal.fire("Error", res.data.message || "Something went wrong", "error");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "";
      if (msg.toLowerCase().includes("exists")) {
        Swal.fire("Duplicate", "This subject already exists", "info");
      } else {
        Swal.fire("Error", msg || "Failed to add subject", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle active/inactive (with confirmation)
  const handleToggleActive = async (id, isActive) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to ${
        isActive ? "deactivate" : "activate"
      } this subject.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isActive ? "#d97706" : "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${isActive ? "Deactivate" : "Activate"}`,
    });

    if (confirm.isConfirmed) {
      try {
        setLoading(true);
        await axios.put(`${base}/subjects/${id}`);
        Swal.fire(
          "Updated!",
          `Subject ${isActive ? "deactivated" : "activated"} successfully`,
          "success"
        );
        fetchSubjects();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to update subject status", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete subject
  const handleDeleteSubject = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the subject!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        setLoading(true);
        await axios.delete(`${base}/subjects/${id}`);
        Swal.fire("Deleted!", "Subject has been deleted", "success");
        fetchSubjects();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to delete subject", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="px-2">
      {/* Header + Add Form */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Manage Subjects
        </h1>

        <form
          onSubmit={handleAddSubject}
          className="flex items-center gap-3 w-full sm:w-auto"
        >
          <input
            type="text"
            placeholder="Enter subject name"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <PlusCircle size={16} />
            Add
          </button>
        </form>
      </div>

      {/* Loader or No Data */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500 text-lg shadow-sm">
          No subjects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subj) => (
            <div
              key={subj._id}
              className="bg-white border rounded-xl p-5 shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  {subj.name}
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    subj.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {subj.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-4">
                <button
                  onClick={() => handleToggleActive(subj._id, subj.isActive)}
                  className={`flex justify-center items-center gap-1 px-2.5 py-1.5 text-sm rounded-md font-medium transition w-full sm:w-auto ${
                    subj.isActive
                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  } disabled:opacity-60 `}
                >
                  <Power size={15} />
                  {subj.isActive ? "Deactivate" : "Activate"}
                </button>

                <button
                  onClick={() => handleDeleteSubject(subj._id)}
                  className="flex justify-center items-center gap-1 px-2.5 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium transition w-full sm:w-auto disabled:opacity-60"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
