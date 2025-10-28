import React, { useState, useEffect } from "react";
import ViewMCQ from "../../components/ViewMCQ";
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
} from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import ReactQuill from "react-quill-new";
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
  const [loading, setLoading] = useState(false);
  const base = import.meta.env.VITE_API_BASE_URL || "";

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
        setStandards([]);
        setCategories([]);
        setSubjects([]);
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

  // Use Radio.Group to guarantee single selection — controlled via selectedCorrectIndex
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
      return false; // prevent auto upload
    },
  };

  const handleSubmit = async (values) => {
    // Quick frontend safety
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

    options.forEach((opt, idx) => {
      fd.append(`options[${idx}][label]`, opt.label || "");
      // ensure string form for reliable server parsing
      fd.append(`options[${idx}][isCorrect]`, opt.isCorrect ? "true" : "false");
      if (opt.image) fd.append(`optionImage_${idx}`, opt.image);
    });

    try {
      setLoading(true);
      const res = await axios.post(`${base}/mcqs`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("MCQ created successfully!");
      form.resetFields();
      setOptions([{ label: "", isCorrect: false, image: null }]);
      setQuestionText("");
      setQuestionImage(null);
    } catch (err) {
      console.error("MCQ create error:", err?.response?.data || err);
      const msg = err?.response?.data?.message || "Error creating MCQ";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ViewMCQ />
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <Card
          title={
            <h2 className="text-2xl font-semibold text-gray-800">
              Manage Multiple Choice Question
            </h2>
          }
          className="max-w-4xl mx-auto shadow-xl rounded-lg"
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit}>
            {/* Dropdown Fields in a Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item
                name="standardId"
                label="Select Standard"
                rules={[
                  { required: true, message: "Please select a standard!" },
                ]}
              >
                <Select
                  placeholder="Select Standard"
                  showSearch
                  optionFilterProp="children"
                  className="w-full"
                >
                  {standards.map((s) => (
                    <Option
                      key={s._id}
                      value={s._id}
                    >{`Standard ${s.standard}`}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="categoryId"
                label="Select Category"
                rules={[
                  { required: true, message: "Please select a category!" },
                ]}
              >
                <Select
                  placeholder="Select Category"
                  showSearch
                  optionFilterProp="children"
                  className="w-full"
                >
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
                rules={[
                  { required: true, message: "Please select a subject!" },
                ]}
              >
                <Select
                  placeholder="Select Subject"
                  showSearch
                  optionFilterProp="children"
                  className="w-full"
                >
                  {subjects.map((s) => (
                    <Option key={s._id} value={s._id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            {/* --- */}

            {/* Question Text Editor */}
            <Form.Item label="Question Text" required className="mt-4">
              <ReactQuill
                theme="snow"
                value={questionText}
                onChange={setQuestionText}
                placeholder="Type or paste your MCQ question here (Gujarati or Math supported)"
                className="bg-white rounded-md border border-gray-300"
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                  ],
                }}
              />
            </Form.Item>
            {/* --- */}

            {/* Question Image Upload */}
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
                    file.status === "removed"
                      ? null
                      : file.originFileObj || file
                  )
                }
                onRemove={() => setQuestionImage(null)}
                beforeUpload={() => false}
                showUploadList={{ showRemoveIcon: true }}
              >
                <Button
                  icon={<UploadOutlined />}
                  className="ant-btn-default hover:border-blue-500 hover:text-blue-500"
                >
                  Upload Question Image (
                  <span className="text-red-500">≤200KB</span>)
                </Button>
              </Upload>
            </div>
            {/* --- */}

            {/* Options Management */}
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
                          )} (Text/Formula)`}
                          value={opt.label}
                          onChange={(e) =>
                            handleOptionChange(index, "label", e.target.value)
                          }
                          className="flex-grow"
                        />
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
                disabled={options.length >= 6} // Gentle limit suggestion
              >
                Add Another Option
              </Button>
            </div>
            {/* --- */}

            {/* Submission Button */}
            <Form.Item className="mt-8 text-right">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 rounded-md font-semibold px-6 py-2 h-auto text-lg"
              >
                Save MCQ
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
}
