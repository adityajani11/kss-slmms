// src/pages/student/MyGeneratedPapers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Spin } from "antd";

export default function MyGeneratedPapers() {
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState([]);
  const base = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${base}/papers/mine`);
        if (res.data.success) setPapers(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownload = async (paperId) => {
    const { value: opts } = await Swal.fire({
      title: "Download Options",
      html: `<div style="text-align:left">
           <label><input type="checkbox" id="withAnswers"> With Answers</label><br/>
           <label><input type="checkbox" id="withExplanations"> With Explanations</label><br/>
           <label><input type="checkbox" id="markBold"> Bold Answers</label>
         </div>`,
      showCancelButton: true,
      preConfirm: () => {
        return {
          answers: document.getElementById("withAnswers").checked,
          explanations: document.getElementById("withExplanations").checked,
          bold: document.getElementById("markBold").checked,
        };
      },
    });

    if (!opts) return;
    Swal.fire({
      title: "Preparing...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      // For bold marking, either pass a query param; server uses includeAnswers + includeExplanations
      const url = `${base}/papers/${paperId}/download?answers=${opts.answers}&explanations=${opts.explanations}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Failed");
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `paper_${paperId}.pdf`;
      link.click();
      Swal.close();
      Swal.fire("Downloaded", "Paper downloaded.", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to download", "error");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Spin />
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">My Generated Papers</h2>
      {papers.length === 0 && <div>No generated papers yet.</div>}
      <div className="space-y-3">
        {papers.map((p) => (
          <div
            key={p._id}
            className="p-4 bg-white rounded shadow flex justify-between"
          >
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-500">Marks: {p.totalMarks}</div>
              <div className="text-sm text-gray-500">
                Created: {new Date(p.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => handleDownload(p._id)}
              >
                Download
              </button>
              {/* optionally show download with answers / explanations presets */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
