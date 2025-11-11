import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spin } from "antd";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

export default function TestHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [openGroups, setOpenGroups] = useState({});
  const base = import.meta.env.VITE_API_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base}/exam-attempts/history`, {
        params: { studentId: user.id || user._id },
      });

      if (res.data.success) {
        const grouped = {};
        (res.data.data || []).forEach((item) => {
          const pid = item.paperId?._id || "unknown";
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push(item);
        });
        setHistory(grouped);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const toggleGroup = (paperId) =>
    setOpenGroups((prev) => ({ ...prev, [paperId]: !prev[paperId] }));

  // 🧹 Delete all attempts for a paper
  const handleDeleteAll = async (paperId) => {
    const confirm = await Swal.fire({
      title: "Delete All Attempts?",
      text: "This will permanently delete all attempts for this paper.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete all",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          `${base}/exam-attempts/delete-all/${user.id}/${paperId}`
        );
        Swal.fire("Deleted!", "All attempts deleted successfully.", "success");
        loadHistory();
      } catch (err) {
        Swal.fire("Error", "Failed to delete attempts.", "error");
      }
    }
  };

  // 🧾 Delete specific attempt
  const handleDeleteOne = async (attemptId, paperId) => {
    const confirm = await Swal.fire({
      title: "Delete Attempt?",
      text: "Are you sure you want to delete this attempt?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          `${base}/exam-attempts/delete/${user.id}/${attemptId}`
        );
        Swal.fire("Deleted!", "Attempt deleted successfully.", "success");
        loadHistory();
      } catch (err) {
        Swal.fire("Error", "Failed to delete attempt.", "error");
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Spin />
      </div>
    );

  const paperIds = Object.keys(history);

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        🧾 My Test History
      </h2>

      {paperIds.length === 0 ? (
        <div className="text-center bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-10">
          <div className="text-4xl mb-3">🕓</div>
          <div className="text-gray-700 text-lg font-medium">
            No test attempts found yet.
          </div>
          <div className="text-gray-500 text-sm mt-2">
            Try taking a live exam to see results here! ✨
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {paperIds.map((paperId) => {
            const attempts = history[paperId];
            const paperTitle = attempts[0]?.paperId?.title || "Untitled Paper";
            const isOpen = openGroups[paperId];

            return (
              <div
                key={paperId}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all"
              >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <button
                    onClick={() => toggleGroup(paperId)}
                    className="flex-1 text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-base sm:text-lg">
                        📘 {paperTitle}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {attempts.length} attempt
                        {attempts.length > 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-gray-500">
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                    </div>
                  </button>

                  <button
                    onClick={() => handleDeleteAll(paperId)}
                    className="ml-3 p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                    title="Delete all attempts"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Collapsible Body */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="border-t border-gray-100 overflow-hidden"
                    >
                      {attempts.map((h, idx) => {
                        const timeTaken =
                          h.startedAt && h.submittedAt
                            ? Math.round(
                                (new Date(h.submittedAt) -
                                  new Date(h.startedAt)) /
                                  1000
                              )
                            : 0;
                        const minutes = Math.floor(timeTaken / 60);
                        const seconds = timeTaken % 60;

                        return (
                          <div
                            key={h._id}
                            className={`p-4 flex justify-between items-center transition-colors ${
                              idx < attempts.length - 1
                                ? "border-b border-gray-100"
                                : ""
                            } bg-white`}
                          >
                            <div>
                              <div className="text-gray-700 text-sm">
                                🧮 Score:{" "}
                                <span className="font-semibold">
                                  {h.score?.total}/{h.score?.max}
                                </span>{" "}
                                (
                                {Math.round(
                                  (h.score?.total / h.score?.max) * 100
                                )}
                                %)
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                🕒 Started:{" "}
                                {new Date(h.startedAt).toLocaleString()}
                              </div>
                              <div className="text-gray-500 text-xs">
                                ✅ Submitted:{" "}
                                {new Date(h.submittedAt).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right text-sm text-gray-700">
                                ⏱️ {minutes}m {seconds}s
                              </div>
                              <button
                                onClick={() => handleDeleteOne(h._id, paperId)}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                                title="Delete this attempt"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
