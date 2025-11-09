import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Spin, Switch, Select, Tag, Checkbox } from "antd";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react"; // for toggle icons

const { Option } = Select;

/* ---------- Utility: Render text with KaTeX parsing ---------- */
function renderMath(text = "") {
  if (!text) return null;
  try {
    const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
    return parts.map((part, idx) => {
      const inlineMatch = part.match(/^\$([^$]+)\$$/);
      const blockMatch = part.match(/^\$\$([^$]+)\$\$$/);
      if (blockMatch) {
        const html = katex.renderToString(blockMatch[1], {
          throwOnError: false,
          displayMode: true,
        });
        return (
          <div
            key={idx}
            className="inline-block my-1"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } else if (inlineMatch) {
        const html = katex.renderToString(inlineMatch[1], {
          throwOnError: false,
          displayMode: false,
        });
        return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
      } else {
        return <span key={idx}>{part}</span>;
      }
    });
  } catch (err) {
    console.warn("KaTeX render error:", err);
    return <>{text}</>;
  }
}

export default function ViewAllMCQs() {
  const [mcqs, setMcqs] = useState([]);
  const [filteredMCQs, setFilteredMCQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMCQs, setSelectedMCQs] = useState([]);
  const [isBarExpanded, setIsBarExpanded] = useState(true);

  const base = import.meta.env.VITE_API_BASE_URL;
  const fileBase = base.replace("/api/v1", "");
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  /* ---------- Fetch MCQs ---------- */
  useEffect(() => {
    if (!user?.standardId) {
      Swal.fire(
        "⚠️ Missing Data",
        "Standard ID not found for this user.",
        "warning"
      );
      setLoading(false);
      return;
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [mcqRes, subRes, catRes] = await Promise.all([
        axios.get(`${base}/mcqs/by-standard/${user.standardId}`),
        axios.get(`${base}/subjects`),
        axios.get(`${base}/categories`),
      ]);
      const mcqData = mcqRes?.data?.data || [];
      setMcqs(mcqData);
      setFilteredMCQs(mcqData);
      setSubjects(subRes?.data?.data || []);
      setCategories(catRes?.data?.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire("❌ Error", "Failed to fetch MCQs or filters.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith("http")) return imgPath;
    return `${fileBase}/${imgPath.replace(/^\/+/, "")}`;
  };

  /* ---------- Filtering ---------- */
  useEffect(() => {
    let filtered = [...mcqs];
    if (selectedSubject)
      filtered = filtered.filter((m) => m.subjectId?._id === selectedSubject);
    if (selectedCategory)
      filtered = filtered.filter((m) => m.categoryId?._id === selectedCategory);
    setFilteredMCQs(filtered);
  }, [selectedSubject, selectedCategory, mcqs]);

  /* ---------- Selection Logic ---------- */
  const toggleMCQSelection = (mcqId) => {
    setSelectedMCQs((prev) => {
      if (prev.includes(mcqId)) {
        return prev.filter((id) => id !== mcqId);
      } else {
        if (prev.length >= 120) {
          Swal.fire(
            "⚠️ Limit Reached",
            "You can select a maximum of 120 MCQs.",
            "warning"
          );
          return prev;
        }
        return [...prev, mcqId];
      }
    });
  };

  /* ---------- Smart Select/Deselect All ---------- */
  const handleToggleSelectAll = () => {
    const visibleIds = filteredMCQs.map((m) => m._id);
    const allSelected = visibleIds.every((id) => selectedMCQs.includes(id));

    if (allSelected) {
      const remaining = selectedMCQs.filter((id) => !visibleIds.includes(id));
      setSelectedMCQs(remaining);
    } else {
      const available = visibleIds.filter((id) => !selectedMCQs.includes(id));
      const spaceLeft = 120 - selectedMCQs.length;
      const toAdd = available.slice(0, spaceLeft);

      if (toAdd.length === 0) {
        Swal.fire(
          "⚠️ Limit Reached",
          "You have already selected 120 MCQs.",
          "warning"
        );
        return;
      }

      setSelectedMCQs([...selectedMCQs, ...toAdd]);
    }
  };

  /* ---------- PDF Download ---------- */
  const handleDownloadPDF = async () => {
    if (selectedMCQs.length === 0)
      return Swal.fire(
        "⚠️ No MCQs Selected",
        "Please select at least one MCQ.",
        "info"
      );

    const { value: includeAnswers } = await Swal.fire({
      title: "Download PDF",
      input: "select",
      inputOptions: {
        withAnswers: "With Answers",
        withoutAnswers: "Without Answers",
      },
      inputPlaceholder: "Select PDF type",
      showCancelButton: true,
      confirmButtonText: "Download",
    });

    if (!includeAnswers) return;

    try {
      const response = await axios.post(
        `${base}/mcqs/pdf`,
        {
          mcqs: mcqs.filter((m) => selectedMCQs.includes(m._id)),
          pdfHeading:
            includeAnswers === "withAnswers"
              ? "MCQ Paper (With Answers)"
              : "MCQ Paper",
          includeAnswers: includeAnswers === "withAnswers",
        },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        includeAnswers === "withAnswers"
          ? "MCQs_With_Answers.pdf"
          : "MCQs_Without_Answers.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire("❌ Error", "Failed to download PDF.", "error");
    }
  };

  /* ---------- Save Draft Paper ---------- */
  const handleSavePaper = async () => {
    if (selectedMCQs.length === 0) {
      return Swal.fire(
        "⚠️ No MCQs Selected",
        "Please select at least one MCQ.",
        "info"
      );
    }

    const { value: paperTitle } = await Swal.fire({
      title: "Enter Paper Title",
      input: "text",
      inputPlaceholder: "e.g. My Practice Paper",
      showCancelButton: true,
      confirmButtonText: "Save Paper",
    });

    if (!paperTitle) return;

    try {
      const response = await axios.post(
        `${base}/papers/generate`,
        {
          mcqs: selectedMCQs, // send only IDs, backend fetches full data
          pdfHeading: paperTitle,
          includeAnswers: showAnswers,
          title: paperTitle,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Paper Saved!",
          text: `Your paper "${paperTitle}" has been saved successfully.`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire("❌ Error", "Failed to save paper.", "error");
    }
  };

  /* ---------- Prepare Live Test ---------- */
  const handleLiveTest = () => {
    if (selectedMCQs.length === 0)
      return Swal.fire(
        "⚠️ No MCQs Selected",
        "Please select at least one MCQ.",
        "info"
      );

    localStorage.setItem("selectedLiveTestMCQs", JSON.stringify(selectedMCQs));
    navigate("/student/live-test");
  };

  return (
    <div className="min-h-fit">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 text-center sm:text-left flex items-center justify-center gap-2">
          📘 <span>View All MCQs</span>
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <span className="text-gray-700 font-medium text-center sm:text-left">
            {showAnswers ? "Showing Answers" : "🙈 Hidden Answers"}
          </span>
          <Switch
            checked={showAnswers}
            onChange={(checked) => setShowAnswers(checked)}
            checkedChildren="Hide"
            unCheckedChildren="Show"
            className="scale-110"
          />
        </div>
      </div>

      {/* ---------- Filters ---------- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Select
            allowClear
            placeholder="Filter by Subject"
            className="min-w-[180px]"
            value={selectedSubject}
            onChange={(value) => setSelectedSubject(value || null)}
          >
            {subjects.map((s) => (
              <Option key={s._id} value={s._id}>
                {s.name}
              </Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="Filter by Category"
            className="min-w-[180px]"
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value || null)}
          >
            {categories.map((c) => (
              <Option key={c._id} value={c._id}>
                {c.name}
              </Option>
            ))}
          </Select>
        </div>

        <button
          onClick={() => {
            setSelectedCategory(null);
            setSelectedSubject(null);
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-md transition-all"
        >
          🔄 Reset Filters
        </button>
      </div>

      {/* ---------- Main MCQ Grid ---------- */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : filteredMCQs.length === 0 ? (
        <div className="text-center text-gray-500 text-lg bg-white p-10 rounded-2xl shadow-sm">
          😕 No MCQs found with selected filters.
        </div>
      ) : (
        <>
          {/* ---------- Grid ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-28">
            {filteredMCQs.map((mcq, index) => {
              const isSelected = selectedMCQs.includes(mcq._id);
              return (
                <div
                  key={mcq._id || index}
                  className={`relative bg-white p-5 rounded-2xl shadow hover:shadow-lg transition-all duration-200 border ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-300"
                      : "border-gray-200"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleMCQSelection(mcq._id)}
                    className="absolute top-3 right-3"
                  />

                  {/* ---------- Badges ---------- */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {mcq.categoryId && (
                      <Tag
                        color="blue"
                        className="text-sm px-2 py-1 rounded-md"
                      >
                        📂 {mcq.categoryId.name}
                      </Tag>
                    )}
                    {mcq.subjectId && (
                      <Tag
                        color="green"
                        className="text-sm px-2 py-1 rounded-md"
                      >
                        📘 {mcq.subjectId.name}
                      </Tag>
                    )}
                  </div>

                  {/* ---------- Question ---------- */}
                  <h2 className="text-lg font-semibold text-gray-800 flex items-start gap-2">
                    <span className="text-blue-600">{index + 1}.</span>
                    <span
                      style={{
                        fontFamily:
                          mcq.question.font === "Nilkanth"
                            ? "Nilkanth"
                            : mcq.question.font === "HareKrishna"
                            ? "HareKrishna"
                            : "inherit",
                      }}
                    >
                      {renderMath(mcq.question.text)}
                    </span>
                  </h2>

                  {mcq.question.image && (
                    <img
                      src={getImageUrl(mcq.question.image)}
                      alt="Question"
                      className="mt-3 rounded-lg border w-full object-contain max-h-52"
                    />
                  )}

                  {/* ---------- Options ---------- */}
                  <div className="mt-3 space-y-2">
                    {mcq.options.map((opt, idx) => {
                      const isCorrect = opt.isCorrect && showAnswers;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center p-2 border rounded-xl ${
                            isCorrect
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200"
                          }`}
                        >
                          <span className="font-medium mr-2 text-gray-700">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <div className="flex-1 text-gray-800">
                            {opt.label && (
                              <span
                                style={{
                                  fontFamily:
                                    mcq.question.font === "Nilkanth"
                                      ? "Nilkanth"
                                      : mcq.question.font === "HareKrishna"
                                      ? "HareKrishna"
                                      : "inherit",
                                }}
                              >
                                {renderMath(opt.label)}
                              </span>
                            )}
                            {opt.image && (
                              <img
                                src={getImageUrl(opt.image)}
                                alt={`Option ${idx + 1}`}
                                className="mt-1 rounded-lg w-full object-contain max-h-32"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {showAnswers && mcq.explanation && (
                    <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                      💡 <strong>સમજૂતી :</strong> {renderMath(mcq.explanation)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ---------- Sticky Collapsible Floating Bar (Glass Tint Effect) ---------- */}
          <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-auto backdrop-blur-lg bg-gradient-to-r from-blue-50/60 via-white/60 to-blue-100/50 shadow-2xl border border-blue-300/40 px-4 py-3 rounded-2xl z-50 transition-all duration-300">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-gray-800">
                🧩 {selectedMCQs.length} MCQs Selected
              </span>
              <button
                onClick={() => setIsBarExpanded(!isBarExpanded)}
                className="text-gray-600 hover:text-blue-700 transition"
              >
                {isBarExpanded ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronUp size={20} />
                )}
              </button>
            </div>

            <div
              className={`transition-all overflow-hidden ${
                isBarExpanded
                  ? "max-h-48 mt-3 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                <button
                  onClick={handleToggleSelectAll}
                  className="bg-white/50 hover:bg-blue-100/60 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm backdrop-blur-sm border border-blue-200/40 transition-all duration-200 shadow-sm"
                >
                  {filteredMCQs.every((id) => selectedMCQs.includes(id._id))
                    ? "❌ Deselect All"
                    : "Select All"}
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="bg-blue-600/90 hover:bg-blue-700 text-white px-4 py-2 rounded-lg 
        font-semibold text-sm shadow-md backdrop-blur-sm transition-all duration-200"
                >
                  🧾 Save as PDF
                </button>

                <button
                  onClick={handleSavePaper}
                  className="bg-purple-600/90 hover:bg-purple-700 text-white px-4 py-2 rounded-lg 
  font-semibold text-sm shadow-md backdrop-blur-sm transition-all duration-200"
                >
                  💾 Save as Draft Paper
                </button>

                <button
                  onClick={handleLiveTest}
                  className="bg-green-600/90 hover:bg-green-700 text-white px-4 py-2 rounded-lg 
        font-semibold text-sm shadow-md backdrop-blur-sm transition-all duration-200"
                >
                  🧠 Prepare for Live Test
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
