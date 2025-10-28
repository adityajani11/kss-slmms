import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Trash2, Power, PlusCircle } from "lucide-react";
import Loader from "../../components/Loader";

export default function ManageCategory() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const base = import.meta.env.VITE_API_BASE_URL;

  // Fetch categories (including inactive)
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base}/categories?includeDisabled=true`);
      const data = res.data?.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      Swal.fire("Error", "Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Add new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCategory.trim();

    if (!trimmed) {
      Swal.fire("Invalid Input", "Category name cannot be empty", "warning");
      return;
    }

    try {
      const res = await axios.post(`${base}/categories`, { name: trimmed });
      if (res.data.success) {
        Swal.fire(
          "Added!",
          `Category "${trimmed}" added successfully`,
          "success"
        );
        setNewCategory("");
        fetchCategories();
      } else {
        Swal.fire("Error", res.data.message || "Something went wrong", "error");
      }
    } catch (error) {
      const msg = error.response?.data?.error || "";
      if (msg.toLowerCase().includes("duplicate")) {
        Swal.fire("Duplicate", "This category already exists", "info");
      } else {
        Swal.fire("Error", msg || "Failed to add category", "error");
      }
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (id, isActive) => {
    const confirm = await Swal.fire({
      title: `${isActive ? "Deactivate" : "Activate"} Category?`,
      text: `Are you sure you want to ${
        isActive ? "deactivate" : "activate"
      } this category?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: isActive ? "#d97706" : "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${isActive ? "Deactivate" : "Activate"}`,
    });

    if (confirm.isConfirmed) {
      try {
        setTogglingId(id);
        await axios.put(`${base}/categories/${id}`);
        Swal.fire(
          "Updated!",
          `Category ${isActive ? "deactivated" : "activated"} successfully`,
          "success"
        );
        fetchCategories();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to update category status", "error");
      } finally {
        setTogglingId(null);
      }
    }
  };

  // Hard delete
  const handleDeleteCategory = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the category!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${base}/categories/${id}/hard`);
        Swal.fire("Deleted!", "Category has been deleted", "success");
        fetchCategories();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to delete category", "error");
      }
    }
  };

  return (
    <div className="px-2">
      {/* Header + Add Form */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Manage Categories
        </h1>

        <form
          onSubmit={handleAddCategory}
          className="flex items-center gap-3 w-full sm:w-auto"
        >
          <input
            type="text"
            placeholder="Enter category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
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

      {/* Loader / No Data / List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500 text-lg shadow-sm">
          No categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white border rounded-xl p-5 shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800 capitalize">
                  {cat.name}
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    cat.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {cat.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-4">
                <button
                  onClick={() => handleToggleActive(cat._id, cat.isActive)}
                  className={`flex justify-center items-center gap-1 px-2.5 py-1.5 text-sm rounded-md font-medium transition w-full sm:w-auto ${
                    cat.isActive
                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                  disabled={togglingId === cat._id}
                >
                  {togglingId === cat._id ? (
                    <Loader size={16} />
                  ) : (
                    <>
                      <Power size={14} />
                      {cat.isActive ? "Deactivate" : "Activate"}
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDeleteCategory(cat._id)}
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
