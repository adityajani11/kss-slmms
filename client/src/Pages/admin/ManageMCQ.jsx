import React, { useState, useEffect } from "react";
import MathEditor from "../../components/MathEditor";
import MCQQuestion from "../../components/MCQQuestion";
import MCQOptions from "../../components/MCQOptions";
import MCQList from "../../components/MCQList";
import Swal from "sweetalert2";
import "katex/dist/katex.min.css";
import {
  Button,
  Form,
  Select,
  Upload,
  message,
  Card,
  Row,
  Col,
  Modal,
  Switch,
  Input,
} from "antd";
import { AppstoreAddOutlined, EyeOutlined } from "@ant-design/icons";
import "react-quill-new/dist/quill.snow.css";
import axios from "axios";

const { Option } = Select;

export default function ManageMCQ() {
  const [form] = Form.useForm();
  const [standards, setStandards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [options, setOptions] = useState([
    { label: "", isCorrect: false, image: null },
  ]);
  const [questionImage, setQuestionImage] = useState(null);
  const [questionText, setQuestionText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [editingMCQ, setEditingMCQ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("select");
  const [mcqs, setMcqs] = useState([]);
  const [filteredMCQs, setFilteredMCQs] = useState([]);
  const [loadingMCQs, setLoadingMCQs] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [preview, setPreview] = useState({ visible: false, src: "" });
  const [selectedFilters, setSelectedFilters] = useState({
    standard: null,
    category: null,
    subject: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForPaper, setSelectedForPaper] = useState(new Set());
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [generateForm] = Form.useForm();

  const base = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    if (view === "view") {
      const fetchMCQs = async () => {
        try {
          setLoadingMCQs(true);
          const res = await axios.get(`${base}/mcqs`);
          setMcqs(res.data.data || []);
          setFilteredMCQs(res.data.data || []);
        } catch (err) {
          message.error("Failed to load MCQs");
        } finally {
          setLoadingMCQs(false);
        }
      };
      fetchMCQs();
    }
  }, [view, base]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [std, cat, sub] = await Promise.all([
          axios.get(`${base}/standards`),
          axios.get(`${base}/categories`),
          axios.get(`${base}/subjects`),
        ]);
        setStandards(std?.data?.data || []);
        setCategories(cat?.data?.data || []);
        setSubjects(sub?.data?.data || []);
      } catch (err) {
        message.error("Failed to load dropdowns");
      }
    };
    fetchAll();
  }, [base]);

  useEffect(() => {
    let filtered = [...mcqs];

    if (selectedFilters.standard) {
      filtered = filtered.filter(
        (m) => m.standardId?._id === selectedFilters.standard
      );
    }

    if (selectedFilters.category) {
      filtered = filtered.filter(
        (m) => m.categoryId?._id === selectedFilters.category
      );
    }

    if (selectedFilters.subject) {
      filtered = filtered.filter(
        (m) => m.subjectId?._id === selectedFilters.subject
      );
    }

    setFilteredMCQs(filtered);
    // Clear selection if an MCQ no longer in filtered list
    setSelectedForPaper((prev) => {
      const next = new Set(
        Array.from(prev).filter((id) =>
          filtered.some((f) => String(f._id) === String(id))
        )
      );
      return next;
    });
  }, [selectedFilters, mcqs]);

  const uploadProps = {
    beforeUpload: (file) => {
      if (file.size > 200 * 1024) {
        message.error("Image must be smaller than 200KB!");
        return Upload.LIST_IGNORE;
      }
      return false;
    },
  };

  const handleDownloadPDF = async () => {
    if (filteredMCQs.length === 0) {
      Swal.fire("No MCQs to export!", "Please adjust your filters.", "info");
      return;
    }

    const { value: pdfHeading } = await Swal.fire({
      title: "Download PDF",
      input: "text",
      inputLabel: "Enter PDF Heading (leave blank if not needed)",
      inputPlaceholder: "e.g. ધોરણ 10 - વિજ્ઞાન અધ્યાય 5",
      showCancelButton: true,
      confirmButtonText: "Download",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
    });

    if (pdfHeading === undefined) return;

    setLoadingExport(true);
    try {
      const response = await axios.post(
        `${base}/mcqs/pdf`,
        { mcqs: filteredMCQs, pdfHeading: pdfHeading || "" },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "MCQs.pdf";
      a.click();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "PDF Downloaded",
        text: "Your filtered MCQs have been downloaded successfully!",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Unable to download filtered PDF", "error");
    } finally {
      setLoadingExport(false);
    }
  };

  const handleEdit = (mcq) => {
    setEditingMCQ(mcq);
    setQuestionText(mcq?.question?.text || "");

    // Keep old question image reference (for displaying or replacing later)
    setQuestionImage(null);

    // Preserve old option images for preview + backend reference
    setOptions(
      mcq.options.map((opt) => ({
        label: opt.label,
        isCorrect: opt.isCorrect,
        image: null, // For new upload
        existingImage: opt.image || null, // Keep old reference
      }))
    );

    form.setFieldsValue({
      standardId: mcq.standardId?._id,
      categoryId: mcq.categoryId?._id,
      subjectId: mcq.subjectId?._id,
    });

    setExplanation(mcq?.explanation || "");

    setView("manage");
  };

  const handleDeleted = (deletedId) => {
    setMcqs((prev) => prev.filter((m) => m._id !== deletedId));
    setSelectedForPaper((prev) => {
      const next = new Set(prev);
      next.delete(deletedId);
      return next;
    });
  };

  const handleSubmit = async (values) => {
    if (options.filter((o) => o.isCorrect).length !== 1) {
      return message.error("Exactly one option must be marked as correct.");
    }

    const fd = new FormData();
    fd.append("standardId", values.standardId);
    fd.append("categoryId", values.categoryId);
    fd.append("subjectId", values.subjectId);
    fd.append("questionText", questionText || "");
    fd.append("language", "gu");
    fd.append("font", "Nilkanth");

    if (questionImage) fd.append("questionImage", questionImage);

    // Send options as JSON (labels, correctness, and existing image path)
    const formattedOptions = options.map((opt) => ({
      label: opt.label,
      isCorrect: opt.isCorrect,
      image: opt.existingImage || null, // Keep image if not re-uploaded
    }));

    fd.append("options", JSON.stringify(formattedOptions));

    // Append only new images (if replaced)
    options.forEach((opt, idx) => {
      if (opt.image) fd.append(`optionImage_${idx}`, opt.image);
    });
    fd.append("explanation", explanation || "");

    try {
      setLoading(true);

      if (editingMCQ) {
        await axios.put(`${base}/mcqs/${editingMCQ._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success("MCQ updated successfully!");
      } else {
        await axios.post(`${base}/mcqs`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        message.success("MCQ created successfully!");
      }

      form.resetFields();
      setOptions([{ label: "", isCorrect: false, image: null }]);
      setQuestionText("");
      setQuestionImage(null);
      setEditingMCQ(null);
      setView("view");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error saving MCQ";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // === Selection helpers ===
  const toggleSelectForPaper = (mcqId) => {
    setSelectedForPaper((prev) => {
      const next = new Set(prev);
      if (next.has(mcqId)) next.delete(mcqId);
      else {
        if (next.size >= 120) {
          message.warning("You can select up to 120 MCQs only.");
          return prev;
        }
        next.add(mcqId);
      }
      return next;
    });
  };

  const clearSelectedForPaper = () => setSelectedForPaper(new Set());

  const selectAllFiltered = () => {
    // only allow when both standard & subject are selected
    if (!selectedFilters.standard || !selectedFilters.subject) {
      message.info("Please select Standard and Subject to select MCQs.");
      return;
    }
    const ids = filteredMCQs.map((m) => m._id).slice(0, 120);
    setSelectedForPaper(new Set(ids));
    if (filteredMCQs.length > 120) {
      message.info("Only first 120 filtered MCQs were selected.");
    }
  };

  // Generate paper submission (modal values include: pdfHeading, includeBoth)
  const handleGeneratePaperSubmit = async (values) => {
    // checks (same as before)
    if (!selectedFilters.standard || !selectedFilters.subject) {
      message.error(
        "Please select Standard and Subject before generating paper."
      );
      return;
    }

    const mcqIds = Array.from(selectedForPaper);
    if (mcqIds.length === 0) {
      message.error("Select at least one MCQ to generate paper.");
      return;
    }
    if (mcqIds.length > 120) {
      message.error("You can generate a paper with at most 120 MCQs.");
      return;
    }

    // Ask for title if not provided earlier (you used SweetAlert)
    const { value: title } = await Swal.fire({
      title: "Enter PDF Title",
      input: "text",
      inputLabel: "PDF Title (required)",
      inputPlaceholder: "e.g. Midterm Practice Test",
      inputValidator: (val) => {
        if (!val || !val.trim()) return "Title is required";
        return null;
      },
      showCancelButton: true,
      confirmButtonText: "Generate",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
    });

    if (!title) return;

    // get logged in user id
    const loggedInUserString = localStorage.getItem("user");
    const loggedInUser = loggedInUserString
      ? JSON.parse(loggedInUserString)
      : null;
    const userId = loggedInUser?.id || loggedInUser?._id;

    const payload = {
      mcqs: mcqIds,
      pdfHeading: values.pdfHeading || "",
      includeAnswers: !!values.includeBoth,
      includeExplanations: !!values.includeBoth,
      title: title.trim(),
      standardId: selectedFilters.standard,
      subjectId: selectedFilters.subject,
      userId,
    };

    setLoadingExport(true);

    try {
      // Confirm final generation
      const confirmation = await Swal.fire({
        title: "Generate & Save Paper?",
        html: `<div style="text-align:left">You are about to generate a paper with <strong>${
          mcqIds.length
        }</strong> MCQs.<br/><br/>Title: <strong>${title.trim()}</strong></div>`,
        showCancelButton: true,
        confirmButtonText: "Yes, Generate",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563eb",
      });
      if (!confirmation.isConfirmed) {
        setLoadingExport(false);
        return;
      }

      // call API - expecting PDF blob and DB entry created on server
      const response = await axios.post(
        `${base}/papers/generate-admin`,
        payload,
        {
          responseType: "blob",
        }
      );

      // download blob
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = title.trim().replace(/\s+/g, "_").slice(0, 120);
      a.href = url;
      a.download = `${safeName || "AdminPaper"}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      // success feedback
      Swal.fire({
        icon: "success",
        title: "Paper generated & saved",
        text: "Paper has been saved to the server and downloaded.",
        timer: 1800,
        showConfirmButton: false,
      });

      // Clear selections + close modal
      clearSelectedForPaper();
      setGenerateModalVisible(false);
      generateForm.resetFields();

      // Optionally refresh admin papers page (if open)
      // (we don't navigate automatically; keep it mild)
    } catch (err) {
      console.error("Generate Paper error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Server error while generating paper";
      Swal.fire("❌ Error", msg, "error");
    } finally {
      setLoadingExport(false);
    }
  };

  // === Selection Cards (Top-left aligned + wider) ===
  if (view === "select") {
    return (
      <div className="min-h-fit bg-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          MCQ Management
        </h2>

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{
                width: "100%",
                minHeight: 150,
                borderRadius: 16,
                padding: 20,
              }}
              className="shadow-md hover:shadow-xl transition-all duration-300"
              onClick={() => setView("manage")}
            >
              <div className="flex flex-col items-start">
                <AppstoreAddOutlined className="text-4xl text-blue-600 mb-3" />
                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  Manage MCQs
                </h3>
                <p className="text-gray-500 text-sm">
                  Create and manage questions
                </p>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{
                width: "100%",
                minHeight: 150,
                borderRadius: 16,
                padding: 20,
              }}
              className="shadow-md hover:shadow-xl transition-all duration-300"
              onClick={() => setView("view")}
            >
              <div className="flex flex-col items-start">
                <EyeOutlined className="text-4xl text-green-600 mb-3" />
                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                  View MCQs
                </h3>
                <p className="text-gray-500 text-sm">
                  Browse and review all MCQs
                </p>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // === View MCQs ===
  if (view === "view") {
    const bothFiltersSelected =
      !!selectedFilters.standard && !!selectedFilters.subject;

    return (
      <div className="bg-gray-100">
        {/* Header */}
        <div className="mx-auto flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">All MCQs</h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-600">
              Selected: {selectedForPaper.size}
            </div>

            <Button
              onClick={selectAllFiltered}
              disabled={!bothFiltersSelected || filteredMCQs.length === 0}
            >
              Select MCQs (up to 120)
            </Button>

            <Button onClick={() => setView("select")}>Back</Button>

            <Button
              onClick={() => setGenerateModalVisible(true)}
              disabled={!bothFiltersSelected || selectedForPaper.size === 0}
            >
              Generate Paper
            </Button>

            <Button
              type="primary"
              onClick={handleDownloadPDF}
              loading={loadingExport}
            >
              Download PDF
            </Button>
          </div>
        </div>

        {/* MCQ List */}
        <div className="mx-auto">
          <MCQList
            mcqs={filteredMCQs}
            loading={loadingMCQs}
            onEdit={handleEdit}
            onDeleted={handleDeleted}
            preview={preview}
            setPreview={setPreview}
            standards={standards}
            categories={categories}
            subjects={subjects}
            selectedFilters={selectedFilters}
            setSelectedFilters={setSelectedFilters}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedForPaper={selectedForPaper}
            toggleSelectForPaper={toggleSelectForPaper}
            allowSelection={bothFiltersSelected}
            selectedStandard={selectedFilters.standard}
            selectedSubject={selectedFilters.subject}
          />
        </div>

        {/* Modal */}
        <Modal
          title="Generate Paper (Admin)"
          open={generateModalVisible}
          onCancel={() => {
            setGenerateModalVisible(false);
            generateForm.resetFields();
          }}
          footer={null}
          centered
        >
          <Form
            form={generateForm}
            layout="vertical"
            onFinish={handleGeneratePaperSubmit}
            initialValues={{ includeBoth: false }}
          >
            <Form.Item name="pdfHeading" label="PDF Heading (optional)">
              <Input placeholder="Heading inside the PDF (optional)" />
            </Form.Item>

            <Form.Item
              name="includeBoth"
              label="Include Answers & Explanations"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <div className="text-right mt-4">
              <Button
                onClick={() => {
                  setGenerateModalVisible(false);
                  generateForm.resetFields();
                }}
                className="me-2"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={() => generateForm.submit()}
                loading={loadingExport}
              >
                Proceed
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    );
  }

  // === Manage MCQs Form ===
  return (
    <div className="min-h-fit bg-gray-100">
      <div className="mx-auto flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Create / Manage MCQs
        </h2>
        <Button onClick={() => setView("select")}>Back</Button>
      </div>

      <Card className="shadow-xl rounded-lg">
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          {/* Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item
              name="standardId"
              label="Select Standard"
              rules={[{ required: true, message: "Please select a standard!" }]}
            >
              <Select placeholder="Select Standard">
                {standards.map((s) => (
                  <Option key={s._id} value={s._id}>
                    Standard {s.standard}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="categoryId"
              label="Select Category"
              rules={[{ required: true, message: "Please select a category!" }]}
            >
              <Select placeholder="Select Category">
                {categories.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="subjectId"
              label="Select Subject"
              rules={[{ required: true, message: "Please select a subject!" }]}
            >
              <Select placeholder="Select Subject">
                {subjects.map((s) => (
                  <Option key={s._id} value={s._id}>
                    {s.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Question Editor */}
          <MCQQuestion
            questionText={questionText}
            setQuestionText={setQuestionText}
            questionImage={questionImage}
            setQuestionImage={setQuestionImage}
            uploadProps={uploadProps}
          />

          {/* Options */}
          <MCQOptions
            options={options}
            setOptions={setOptions}
            uploadProps={uploadProps}
            base={base}
          />

          {/* Explanation (Optional) */}
          <Form.Item label="Explanation (Optional)">
            <MathEditor value={explanation} onChange={setExplanation} />
          </Form.Item>

          {/* Submit */}
          <Form.Item className="mt-8 text-right">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 rounded-md font-semibold px-6 py-2 h-auto text-lg"
            >
              Save MCQ
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
