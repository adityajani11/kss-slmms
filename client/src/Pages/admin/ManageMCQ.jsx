import React, { useState, useEffect } from "react";
import MCQCard from "../../components/MCQCard";
import MathEditor from "../../components/MathEditor";
import jsPDF from "jspdf";
import { oklch, converter } from "culori";
import html2canvas from "html2canvas";
import renderMathInElement from "katex/contrib/auto-render/auto-render";
import "katex/dist/katex.min.css";
import {
  Button,
  Form,
  Input,
  Select,
  Upload,
  Radio,
  Space,
  message,
  Card,
  Row,
  Col,
  Image,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  AppstoreAddOutlined,
  EyeOutlined,
} from "@ant-design/icons";
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
  const [loadingMCQs, setLoadingMCQs] = useState(false);
  const [preview, setPreview] = useState({ visible: false, src: "" });
  const base = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    if (view === "view") {
      const fetchMCQs = async () => {
        try {
          setLoadingMCQs(true);
          const res = await axios.get(`${base}/mcqs`);
          setMcqs(res.data.data || []);
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

  const handleAddOption = () =>
    setOptions([...options, { label: "", isCorrect: false, image: null }]);

  const handleOptionChange = (index, field, value) => {
    const copy = [...options];
    copy[index][field] = value;
    setOptions(copy);
  };

  const selectedCorrectIndex = options.findIndex((o) => o.isCorrect);

  const handleCorrectSelect = (index) => {
    const newOpts = options.map((o, i) => ({ ...o, isCorrect: i === index }));
    setOptions(newOpts);
  };

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
    if (!mcqs || mcqs.length === 0) {
      message.warning("No MCQs to export.");
      return;
    }

    // Build a clean, print-only DOM (no tailwind)
    const baseURL = (import.meta.env.VITE_API_BASE_URL || "").replace(
      "/api/v1",
      ""
    );

    const container = document.createElement("div");
    // A4 width at ~96dpi ≈ 794px. We'll capture at 2x scale for sharpness.
    Object.assign(container.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "794px",
      padding: "24px",
      background: "#ffffff",
      color: "rgb(17,17,17)",
      fontFamily: "Nilkanth, Noto Sans Gujarati, Nirmala UI, sans-serif",
      lineHeight: "1.5",
    });

    // Title (optional)
    const header = document.createElement("div");
    Object.assign(header.style, {
      textAlign: "center",
      marginBottom: "12px",
      fontSize: "18px",
      fontWeight: "600",
    });
    header.textContent = "Question Paper";
    container.appendChild(header);

    // Two-column flow area
    const flow = document.createElement("div");
    Object.assign(flow.style, {
      columnCount: "2",
      columnGap: "24px",
    });

    // Helper to append HTML block safely with math rendered
    const appendMathHTML = (parent, html, extraStyle = {}) => {
      const block = document.createElement("div");
      Object.assign(block.style, extraStyle);
      block.innerHTML = html || "";
      parent.appendChild(block);
      return block;
    };

    // Build each MCQ
    mcqs.forEach((mcq, idx) => {
      const qWrap = document.createElement("div");
      Object.assign(qWrap.style, {
        breakInside: "avoid",
        marginBottom: "14px",
        padding: "10px 10px",
        border: "1px solid rgb(229,231,235)",
        borderRadius: "8px",
        background: "rgb(255,255,255)",
      });

      // Number + question text
      const qRow = document.createElement("div");
      Object.assign(qRow.style, {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        marginBottom: "6px",
        fontSize: "14px",
      });

      const qNum = document.createElement("div");
      Object.assign(qNum.style, {
        fontWeight: "700",
        minWidth: "24px",
      });
      qNum.textContent = `${idx + 1}.`;

      const qText = document.createElement("div");
      qText.innerHTML = mcq?.question?.text || "";

      qRow.appendChild(qNum);
      qRow.appendChild(qText);
      qWrap.appendChild(qRow);

      // Question image
      if (mcq?.question?.image) {
        const img = document.createElement("img");
        img.src = `${baseURL}/${mcq.question.image.replace(/\\/g, "/")}`;
        Object.assign(img.style, {
          maxWidth: "100%",
          maxHeight: "220px",
          objectFit: "contain",
          borderRadius: "6px",
          margin: "6px 0 6px 24px",
          display: "block",
        });
        qWrap.appendChild(img);
      }

      // Options
      if (Array.isArray(mcq?.options) && mcq.options.length) {
        const optsWrap = document.createElement("div");
        Object.assign(optsWrap.style, {
          marginTop: "6px",
          marginLeft: "24px",
        });

        mcq.options.forEach((opt, i) => {
          const row = document.createElement("div");
          Object.assign(row.style, {
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginBottom: "6px",
          });

          // A/B/C/D badge
          const badge = document.createElement("div");
          Object.assign(badge.style, {
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "700",
            color: opt.isCorrect ? "rgb(255,255,255)" : "rgb(55,65,81)",
            background: opt.isCorrect ? "rgb(22,163,74)" : "rgb(209,213,219)",
            flex: "0 0 auto",
            marginTop: "2px",
          });
          badge.textContent = String.fromCharCode(65 + i);

          const optText = document.createElement("div");
          optText.innerHTML = opt?.label || "";
          Object.assign(optText.style, {
            fontSize: "13px",
            flex: "1 1 auto",
          });

          row.appendChild(badge);
          row.appendChild(optText);

          if (opt?.image) {
            const oimg = document.createElement("img");
            oimg.src = `${baseURL}/${opt.image.replace(/\\/g, "/")}`;
            Object.assign(oimg.style, {
              maxWidth: "80px",
              maxHeight: "80px",
              objectFit: "contain",
              borderRadius: "6px",
              marginLeft: "8px",
            });
            row.appendChild(oimg);
          }

          optsWrap.appendChild(row);
        });

        qWrap.appendChild(optsWrap);
      }

      // Explanation (if any)
      if (mcq?.explanation) {
        const exp = appendMathHTML(qWrap, `<em>${mcq.explanation}</em>`, {
          marginTop: "6px",
          marginLeft: "24px",
          fontSize: "12px",
          color: "rgb(55,65,81)",
        });
        // math applied later
      }

      flow.appendChild(qWrap);
    });

    container.appendChild(flow);
    document.body.appendChild(container);

    // Render KaTeX just within our container
    try {
      renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    } catch (e) {
      console.warn("KaTeX render error (PDF):", e);
    }

    // Snapshot with html2canvas (no Tailwind/oklch used here)
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      // Ensure images loaded before snapshot
      imageTimeout: 15000,
    });

    // Slice canvas into A4 pages
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    // A4 aspect ratio at canvas scale
    const pageHeightPx = Math.floor((imgWidthPx * 297) / 210);

    let y = 0;
    let pageIndex = 0;

    while (y < imgHeightPx) {
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = imgWidthPx;
      pageCanvas.height = Math.min(pageHeightPx, imgHeightPx - y);
      const ctx = pageCanvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        y,
        imgWidthPx,
        pageCanvas.height,
        0,
        0,
        imgWidthPx,
        pageCanvas.height
      );

      const pageImgData = pageCanvas.toDataURL("image/png");
      if (pageIndex > 0) pdf.addPage();

      // Add page
      pdf.addImage(
        pageImgData,
        "PNG",
        0,
        0,
        pageWidth,
        (pageWidth * pageCanvas.height) / pageCanvas.width
      );

      // Watermark (simple light gray rotated text)
      pdf.setTextColor(180);
      pdf.setFontSize(26);
      const cx = pageWidth / 2;
      const cy = pageHeight / 2;
      // jsPDF old versions: use angle param on text
      pdf.text("KRISHNA SECONDARY SCHOOL, KESHOD", cx, cy, {
        align: "center",
        angle: -45,
      });

      y += pageHeightPx;
      pageIndex++;
    }

    pdf.save("MCQs.pdf");

    // Cleanup
    document.body.removeChild(container);
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

  // === Selection Cards (Top-left aligned + wider) ===
  if (view === "select") {
    return (
      <div className="min-h-fit bg-gray-100 p-6">
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
    return (
      <div className="min-h-fit bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">All MCQs</h2>
          <div>
            <Button className="me-3" onClick={() => setView("select")}>
              Back
            </Button>
            <Button type="primary" onClick={handleDownloadPDF}>
              Download PDF
            </Button>
          </div>
        </div>

        {loadingMCQs ? (
          <p>Loading...</p>
        ) : (
          <div
            id="mcq-print-area"
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
          >
            {mcqs.map((mcq) => (
              <MCQCard
                key={mcq._id}
                mcq={mcq}
                onEdit={() => setEditingMCQ(mcq) & setView("manage")}
                onDeleted={handleDeleted}
                setPreview={setPreview}
              />
            ))}
          </div>
        )}

        {/* ✅ GLOBAL IMAGE VIEWER (works above modals now) */}
        <Image.PreviewGroup
          preview={{
            visible: preview.visible,
            onVisibleChange: (vis) =>
              setPreview((p) => ({ ...p, visible: vis })),
            zIndex: 9999,
          }}
        >
          <Image src={preview.src} style={{ display: "none" }} />
        </Image.PreviewGroup>
      </div>
    );
  }

  // Convert OKLCH → RGB
  function convertColor(oklchValue) {
    try {
      // Tailwind outputs values like `oklch(0.7 0.1 240)`
      const parts = oklchValue
        .match(/oklch\(([^)]+)\)/)[1]
        .split(/\s+/)
        .map(Number);
      const [l, c, h] = parts;

      // Convert OKLCH → LAB → XYZ → sRGB (mathematically correct)
      // Using culori — install it:
      // npm install culori

      const toRgb = converter("rgb");
      const rgb = toRgb(oklch({ l, c, h }));

      return `rgb(${Math.round(rgb.r * 255)}, ${Math.round(
        rgb.g * 255
      )}, ${Math.round(rgb.b * 255)})`;
    } catch {
      return "#000"; // fallback: safe
    }
  }

  // === Manage MCQs Form ===
  return (
    <div className="min-h-fit bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6">
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
          <Form.Item label="Question Text" required className="mt-4">
            <MathEditor value={questionText} onChange={setQuestionText} />
          </Form.Item>

          {/* Question Image */}
          <div className="mb-6">
            <Upload
              {...uploadProps}
              maxCount={1}
              fileList={
                questionImage
                  ? [{ uid: "-1", name: questionImage.name, status: "done" }]
                  : []
              }
              onChange={({ file }) =>
                setQuestionImage(
                  file.status === "removed" ? null : file.originFileObj || file
                )
              }
              beforeUpload={() => false}
              showUploadList={{ showRemoveIcon: true }}
            >
              <Button icon={<UploadOutlined />}>
                Upload Question Image (
                <span className="text-red-500">≤200KB</span>)
              </Button>
            </Upload>
          </div>

          {/* Options */}
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50 shadow-inner">
            <h4 className="text-lg font-medium mb-4 text-gray-700">
              Answer Options
            </h4>
            <Radio.Group
              value={selectedCorrectIndex}
              onChange={(e) => handleCorrectSelect(e.target.value)}
              className="w-full"
            >
              <Space direction="vertical" className="w-full">
                {options.map((opt, index) => (
                  <div
                    key={index}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg transition-all duration-200 
                      ${
                        selectedCorrectIndex === index
                          ? "bg-green-100 border border-green-400 shadow-md"
                          : "bg-white border border-gray-200"
                      }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Radio value={index} className="flex-shrink-0" />
                      <Input
                        placeholder={`Option ${String.fromCharCode(
                          65 + index
                        )}`}
                        value={opt.label}
                        onChange={(e) =>
                          handleOptionChange(index, "label", e.target.value)
                        }
                        className="flex-grow"
                      />
                      {opt.existingImage && (
                        <img
                          src={`${base.replace(
                            "/api/v1",
                            ""
                          )}/${opt.existingImage.replace(/\\/g, "/")}`}
                          alt="Existing option"
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 6,
                            marginLeft: 8,
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-7 sm:ml-0">
                      <Upload
                        {...uploadProps}
                        maxCount={1}
                        fileList={
                          opt.image
                            ? [
                                {
                                  uid: index,
                                  name: opt.image.name,
                                  status: "done",
                                },
                              ]
                            : []
                        }
                        onChange={({ file }) => {
                          const newFile =
                            file.status === "removed"
                              ? null
                              : file.originFileObj || file;
                          handleOptionChange(index, "image", newFile);
                        }}
                        onRemove={() =>
                          handleOptionChange(index, "image", null)
                        }
                        beforeUpload={() => false}
                        showUploadList={{ showRemoveIcon: true }}
                      >
                        <Button size="small" icon={<UploadOutlined />}>
                          Upload Image
                        </Button>
                      </Upload>
                    </div>
                  </div>
                ))}
              </Space>
            </Radio.Group>

            <Button
              icon={<PlusOutlined />}
              className="mt-4 ant-btn-dashed w-full border-dashed border-gray-400 text-gray-600 hover:border-blue-500 hover:text-blue-500"
              onClick={handleAddOption}
              disabled={options.length >= 6}
            >
              Add Another Option
            </Button>
          </div>

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
