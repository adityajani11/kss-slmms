import React, { useEffect, useState } from "react";
import axios from "axios";
import { Download, BookOpen, Search, Eye } from "lucide-react";
import Swal from "sweetalert2";
import { Spin, message } from "antd";

export default function MyMaterial() {
  const [materials, setMaterials] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const base = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || !storedUser.standardId) {
          Swal.fire(
            "Error",
            "User information missing. Please log in again.",
            "error"
          );
          return;
        }

        const res = await axios.get(
          `${base}/materials/by-standard/${storedUser.standardId}`
        );

        if (res.data.success && res.data.data.length > 0) {
          setMaterials(res.data.data);
          setFiltered(res.data.data);
        } else {
          message.info(
            res.data.message || "No material found for your standard."
          );
          setMaterials([]);
          setFiltered([]);
        }
      } catch (err) {
        console.error(err);
        message.error("Something went wrong while fetching materials.");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  // Search filter
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      materials.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.subjectId?.name?.toLowerCase().includes(q) ||
          m.categoryId?.name?.toLowerCase().includes(q)
      )
    );
  }, [search, materials]);

  // View file
  const handleView = (record) => {
    if (!record.file?.fileId) {
      message.warning("No file available to view.");
      return;
    }
    const fileUrl = `${base.replace(/\/api\/v1$/, "")}/${record.file.fileId}`;
    window.open(fileUrl, "_blank");
  };

  // Download file with confirmation
  const handleDownload = async (record) => {
    if (!record.file?.fileId) {
      Swal.fire("No File", "No file available to download.", "warning");
      return;
    }

    const fileUrl = `${base.replace(/\/api\/v1$/, "")}/${record.file.fileId}`;

    Swal.fire({
      title: "Confirm Download",
      text: `Do you want to download "${record.title}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Download",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      preConfirm: async () => {
        try {
          const response = await fetch(fileUrl);
          if (!response.ok) throw new Error("Network error");

          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = record.title || "material.pdf";
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.error("Download error:", err);
          Swal.showValidationMessage("Failed to download the file.");
        }
      },
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="text-blue-600" /> My Materials
        </h1>

        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subject, or category..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
          />
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" tip="Loading materials..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No materials found.
        </div>
      ) : (
        // Material grid
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((m) => (
            <div
              key={m._id}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border border-gray-100"
            >
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-gray-800 line-clamp-1">
                    {m.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">Subject:</span>{" "}
                    {m.subjectId?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Category:</span>{" "}
                    {m.categoryId?.name || "N/A"}
                  </p>
                </div>

                <div className="mt-auto flex justify-between items-center">
                  <p className="text-xs text-gray-400">
                    Uploaded on{" "}
                    {new Date(m.createdAt).toLocaleDateString("en-IN")}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(m)}
                      className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      <Eye size={18} /> View
                    </button>
                    <button
                      onClick={() => handleDownload(m)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Download size={18} /> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
