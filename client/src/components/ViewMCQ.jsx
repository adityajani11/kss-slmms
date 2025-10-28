import React, { useEffect, useState } from "react";
import { Table, Tag, message, Card } from "antd";
import axios from "axios";
import Loader from "./Loader";

export default function ViewMCQ() {
  const [mcqs, setMcqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const base = import.meta.env.VITE_API_BASE_URL || "";
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch MCQs
  const fetchMCQs = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await axios.get(`${base}/mcqs/?page=${page}&limit=${limit}`);
      if (res.data.success) {
        setMcqs(res.data.data);
        setPagination({
          current: res.data.page,
          pageSize: limit,
          total: res.data.totalItems,
        });
      } else {
        message.error("Failed to fetch MCQs");
      }
    } catch (err) {
      console.error(err);
      message.error("Error fetching MCQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMCQs(pagination.current, pagination.pageSize);
    // eslint-disable-next-line
  }, []);

  const handleTableChange = (pagination) => {
    fetchMCQs(pagination.current, pagination.pageSize);
  };

  const columns = [
    {
      title: "Standard",
      dataIndex: ["standardId", "standard"],
      key: "standard",
      width: 100,
    },
    {
      title: "Subject",
      dataIndex: ["subjectId", "name"],
      key: "subject",
      width: 120,
    },
    {
      title: "Category",
      dataIndex: ["categoryId", "name"],
      key: "category",
      width: 120,
    },
    {
      title: "Question",
      dataIndex: ["question", "text"],
      key: "question",
      render: (text, record) => (
        <div>
          <span>{text}</span>
          {record.question.image && (
            <div>
              <img
                src={record.question.image}
                alt="question"
                style={{ maxWidth: 120, marginTop: 5, borderRadius: 6 }}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Correct Option",
      key: "correct",
      render: (record) => {
        const correct = record.options.find((o) => o.isCorrect);
        return <Tag color="green">{correct?.label || "—"}</Tag>;
      },
    },
    {
      title: "Created By",
      dataIndex: ["createdBy", "name"],
      key: "createdBy",
      width: 150,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) =>
        new Date(date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    },
  ];

  return (
    <Card
      title="View All MCQs"
      bordered={false}
      style={{
        margin: "20px",
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      {loading ? (
        <Loader />
      ) : (
        <Table
          columns={columns}
          dataSource={mcqs}
          rowKey="_id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
          }}
          onChange={handleTableChange}
          bordered
          scroll={{ x: true }}
        />
      )}
    </Card>
  );
}
