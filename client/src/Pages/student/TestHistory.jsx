// src/pages/student/TestHistory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spin } from "antd";

export default function TestHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  const base = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${base}/exams/history`);
        if (res.data.success) setHistory(res.data.data.items || []);
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
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Test History</h2>
      <div className="space-y-3">
        {history.length === 0 && <div>No attempts found</div>}
        {history.map((h) => {
          const timeTaken =
            h.submittedAt && h.startedAt
              ? Math.round(
                  (new Date(h.submittedAt) - new Date(h.startedAt)) / 1000
                )
              : null;
          return (
            <div
              key={h._id}
              className="p-4 bg-white rounded shadow flex justify-between"
            >
              <div>
                <div className="font-medium">{h.paperId?.title || "Paper"}</div>
                <div className="text-sm text-gray-500">
                  Score: {h.score?.total}/{h.score?.max}
                </div>
                <div className="text-sm text-gray-500">
                  Started: {new Date(h.startedAt).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  Submitted:{" "}
                  {h.submittedAt
                    ? new Date(h.submittedAt).toLocaleString()
                    : "In Progress"}
                </div>
              </div>
              <div className="text-right">
                {timeTaken !== null ? (
                  <div>
                    Time: {Math.floor(timeTaken / 60)}m {timeTaken % 60}s
                  </div>
                ) : (
                  <div>-</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
