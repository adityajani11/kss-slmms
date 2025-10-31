import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Upload,
  Button,
  Table,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Space,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;
const { Option } = Select;

export default function ManageMaterial() {
  const [form] = Form.useForm();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [standards, setStandards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const base = import.meta.env.VITE_API_BASE_URL;

  // Fetch standards, subjects, categories, and materials
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stdRes, subRes, catRes] = await Promise.all([
          axios.get(`${base}/standards`),
          axios.get(`${base}/subjects`),
          axios.get(`${base}/categories`),
        ]);
        setStandards(stdRes?.data?.data || []);
        setSubjects(subRes?.data?.data || []);
        setCategories(catRes?.data?.data || []);
      } catch {
        message.error("Failed to load dropdown data");
      }
    };
    fetchData();
    fetchMaterials();
  }, []);

  // Fetch materials
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${base}/materials`);
      setMaterials(res.data.data || []);
    } catch {
      message.error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  // Upload new material
  const handleUpload = async (values) => {
    if (!values.file || !values.file.file) {
      return message.warning("Please upload a PDF file");
    }

    const formData = new FormData();
    formData.append("file", values.file.file);
    formData.append("title", values.title);
    formData.append("standardId", values.standardId);
    formData.append("subjectId", values.subjectId);
    formData.append("categoryId", values.categoryId);

    setUploading(true);
    try {
      await axios.post(`${base}/materials`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Material uploaded successfully");
      form.resetFields();
      fetchMaterials();
    } catch (err) {
      message.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Delete material
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${base}/materials/${id}/hard`);
      message.success("Material deleted");
      fetchMaterials();
    } catch {
      message.error("Failed to delete material");
    }
  };

  // View material
  const handleView = (record) => {
    if (!record.file?.fileId) {
      message.error("No file available to view");
      return;
    }

    // Open directly from backend static path
    const fileUrl = `${base.replace(/\/api\/v1$/, "")}/${record.file.fileId}`;
    window.open(fileUrl, "_blank");
  };

  // Download material
  const handleDownload = async (record) => {
    if (!record.file?.fileId) {
      message.error("No file available to download");
      return;
    }

    const fileUrl = `${base.replace(/\/api\/v1$/, "")}/${record.file.fileId}`;

    try {
      // Fetch PDF as binary
      const response = await axios.get(fileUrl, {
        responseType: "blob",
      });

      // Create blob link for download
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download =
        record.title?.replace(/\s+/g, "_") + ".pdf" || "Material.pdf";

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);

      message.success("Download started");
    } catch (error) {
      console.error(error);
      message.error("Failed to download file");
    }
  };

  // Table Columns
  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text) => <b>{text}</b>,
    },
    {
      title: "Standard",
      dataIndex: "standard",
      key: "standard",
      render: (text) => text || "-",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (text) => text || "-",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (text) => text || "-",
    },
    {
      title: "PDF",
      key: "file",
      render: (_, record) => (
        <Space>
          <Button
            icon={<FilePdfOutlined />}
            type="link"
            onClick={() => handleView(record)}
          >
            View
          </Button>

          <Popconfirm
            title="Do you want to download this material?"
            onConfirm={() => handleDownload(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DownloadOutlined />} type="link">
              Download
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Are you sure you want to delete this material?"
          onConfirm={() => handleDelete(record._id)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        Manage Learning Materials
      </Title>

      <Card
        title="Upload New Material"
        variant="borderless"
        style={{ marginBottom: 24, borderRadius: 12 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
          autoComplete="off"
          style={{
            marginBottom: 24,
            borderRadius: 12,
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="title"
                label="Material Title"
                rules={[{ required: true, message: "Please enter title" }]}
              >
                <Input placeholder="Enter material title" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="standardId"
                label="Standard"
                rules={[{ required: true, message: "Select standard" }]}
              >
                <Select placeholder="Select standard" showSearch>
                  {standards.map((std) => (
                    <Option key={std._id} value={std._id}>
                      {std.standard}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="subjectId"
                label="Subject"
                rules={[{ required: true, message: "Select subject" }]}
              >
                <Select placeholder="Select subject" showSearch>
                  {subjects.map((sub) => (
                    <Option key={sub._id} value={sub._id}>
                      {sub.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="categoryId"
                label="Category"
                rules={[{ required: true, message: "Select category" }]}
              >
                <Select placeholder="Select category" showSearch>
                  {categories.map((cat) => (
                    <Option key={cat._id} value={cat._id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="file"
                label="Upload PDF"
                valuePropName="file"
                rules={[{ required: true, message: "Upload a PDF file" }]}
              >
                <Upload maxCount={1} beforeUpload={() => false} accept=".pdf">
                  <Button icon={<UploadOutlined />}>Select PDF</Button>
                </Upload>
              </Form.Item>
            </Col>

            <Col xs={24} style={{ textAlign: "right" }}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={uploading}
                  style={{ borderRadius: 6 }}
                >
                  Upload Material
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        title="Uploaded Materials"
        variant="outlined"
        style={{ borderRadius: 12 }}
      >
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={materials}
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
}
