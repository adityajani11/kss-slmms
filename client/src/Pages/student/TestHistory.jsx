// src/pages/student/TestHistory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spin } from "antd";

export default function TestHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const base = import.meta.env.VITE_API_BASE_URL;
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${base}/exam-attempts/history`, {
          params: { studentId: user._id || user.id },
        });
        if (res.data.success) setHistory(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Spin />
      </div>
    );

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        🧾 My Test History
      </h2>

      {history.length === 0 ? (
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
        <div className="grid gap-4">
          {history.map((h) => {
            const timeTaken =
              h.startedAt && h.submittedAt
                ? Math.round(
                    (new Date(h.submittedAt) - new Date(h.startedAt)) / 1000
                  )
                : 0;
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;
            return (
              <div
                key={h._id}
                className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition-all"
              >
                <div>
                  <div className="font-semibold text-base sm:text-lg">
                    📘 {h.paperId?.title || "Untitled Paper"}
                  </div>
                  <div className="text-gray-600 text-sm">
                    🧮 Score:{" "}
                    <span className="font-semibold">
                      {h.score?.total}/{h.score?.max}
                    </span>{" "}
                    ({Math.round((h.score?.total / h.score?.max) * 100)}%)
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    🕒 Started: {new Date(h.startedAt).toLocaleString()}
                  </div>
                  <div className="text-gray-500 text-xs">
                    ✅ Submitted: {new Date(h.submittedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-700">
                  ⏱️ {minutes}m {seconds}s
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
