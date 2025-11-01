import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Trash2, Power, PlusCircle } from "lucide-react";
import Loader from "../../components/Loader";

export default function ManageStandards() {
  const [standards, setStandards] = useState([]);
  const [newStandard, setNewStandard] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const base = import.meta.env.VITE_API_BASE_URL;

  // Fetch all standards
  const fetchStandards = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base}/standards?includeDisabled=true`);
      const data = res.data?.data || [];
      setStandards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch standards:", error);
      Swal.fire("Error", "Failed to load standards", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandards();
  }, []);

  // Add new standard
  const handleAddStandard = async (e) => {
    e.preventDefault();
    const standardNum = Number(newStandard);

    if (!standardNum || standardNum < 9 || standardNum > 12) {
      Swal.fire(
        "Invalid Input",
        "Standard must be between 9 and 12",
        "warning"
      );
      return;
    }

    try {
      const res = await axios.post(`${base}/standards`, {
        standard: standardNum,
      });
      if (res.data.success) {
        Swal.fire(
          "Added!",
          `Standard ${standardNum} added successfully`,
          "success"
        );
        setNewStandard("");
        fetchStandards();
      } else {
        Swal.fire("Error", res.data.message || "Something went wrong", "error");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "";
      if (msg.toLowerCase().includes("exists")) {
        Swal.fire("Duplicate", "This standard already exists", "info");
      } else {
        Swal.fire("Error", msg || "Failed to add standard", "error");
      }
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (id, isActive) => {
    const confirm = await Swal.fire({
      title: `${isActive ? "Deactivate" : "Activate"} Standard?`,
      text: `Are you sure you want to ${
        isActive ? "deactivate" : "activate"
      } this standard?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: isActive ? "#d97706" : "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${isActive ? "Deactivate" : "Activate"}`,
    });

    if (confirm.isConfirmed) {
      try {
        setTogglingId(id);
        await axios.put(`${base}/standards/${id}`);
        Swal.fire(
          "Updated!",
          `Standard ${isActive ? "deactivated" : "activated"} successfully`,
          "success"
        );
        fetchStandards();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to update standard status", "error");
      } finally {
        setTogglingId(null);
      }
    }
  };

  // Delete standard (hard delete)
  const handleDeleteStandard = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the standard!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${base}/standards/${id}/hard`);
        Swal.fire("Deleted!", "Standard has been deleted", "success");
        fetchStandards();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to delete standard", "error");
      }
    }
  };

  return (
    <div className="px-2">
      {/* Header + Add Form */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Manage Standards
        </h1>

        <form
          onSubmit={handleAddStandard}
          className="flex items-center gap-3 w-full sm:w-auto"
        >
          <input
            type="number"
            min="9"
            max="12"
            placeholder="Enter standard (9 - 12)"
            value={newStandard}
            onChange={(e) => setNewStandard(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48"
          />
          <button
            type="submit"
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
      ) : standards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500 text-lg shadow-sm">
          No standards found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {standards.map((std) => (
            <div
              key={std._id}
              className="bg-white border rounded-xl p-5 shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  Standard {std.standard}
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    std.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {std.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-4">
                <button
                  onClick={() => handleToggleActive(std._id, std.isActive)}
                  className={`flex justify-center items-center gap-1 px-2.5 py-1.5 text-sm rounded-md font-medium transition w-full sm:w-auto ${
                    std.isActive
                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                  disabled={togglingId === std._id}
                >
                  {togglingId === std._id ? (
                    <Loader size={16} />
                  ) : (
                    <>
                      <Power size={14} />
                      {std.isActive ? "Deactivate" : "Activate"}
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDeleteStandard(std._id)}
                  className="flex justify-center items-center gap-1 px-2.5 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium transition w-full sm:w-auto"
                >
                  <Trash2 size={14} />
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
