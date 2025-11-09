// src/pages/student/MyGeneratedPapers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Spin } from "antd";
import { FileText, Download } from "lucide-react";

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
        Swal.fire("⚠️ Error", "Unable to load your papers!", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownload = async (paperId) => {
    const { value: opts } = await Swal.fire({
      title: "📥 Download Options",
      html: `
        <div style="text-align:left; font-size:15px;">
          <label><input type="checkbox" id="withAnswers"> ✅ Include Answers</label><br/>
          <label><input type="checkbox" id="withExplanations"> 💬 Include Explanations</label><br/>
          <label><input type="checkbox" id="markBold"> 🔤 Bold Correct Answers</label>
        </div>
        <p style="font-size:13px; color:#777; margin-top:8px;">
          Tip: You can combine these for customized PDFs! 🧩
        </p>
      `,
      confirmButtonText: "📄 Download",
      cancelButtonText: "❌ Cancel",
      showCancelButton: true,
      focusConfirm: false,
      background: "#fefefe",
      confirmButtonColor: "#2563eb",
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
      title: "⏳ Preparing your paper...",
      text: "Please wait a moment.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const url = `${base}/papers/${paperId}/download?answers=${opts.answers}&explanations=${opts.explanations}&bold=${opts.bold}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Failed");

      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `paper_${paperId}.pdf`;
      link.click();

      Swal.close();
      Swal.fire(
        "🎉 Downloaded!",
        "Your paper has been saved successfully.",
        "success"
      );
    } catch (err) {
      console.error(err);
      Swal.fire("❌ Error", "Failed to download paper. Try again.", "error");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading your papers..." />
      </div>
    );

  return (
    <>
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        🧾 My Generated Papers
      </h2>

      {papers.length === 0 ? (
        <div className="flex justify-center">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-8 py-10 text-center w-full max-w-lg">
            <div className="text-4xl mb-3">😕</div>
            <div className="text-gray-700 text-lg font-medium">
              No papers found yet.
            </div>
            <div className="text-gray-500 text-sm mt-2">
              Try generating one from the MCQ section! ✨
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map((p) => (
            <div
              key={p._id}
              className="p-5 bg-white rounded-2xl shadow hover:shadow-lg transition-all border border-gray-100 flex justify-between items-center"
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <FileText className="text-blue-500" size={28} />
                </div>
                <div>
                  <div className="font-semibold text-lg">
                    {p.title || "Untitled Paper"} 📘
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    🧮 Marks:{" "}
                    <span className="font-medium">{p.totalMarks}</span>
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    🕒 Created: {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-all"
                onClick={() => handleDownload(p._id)}
              >
                <Download size={18} />
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
