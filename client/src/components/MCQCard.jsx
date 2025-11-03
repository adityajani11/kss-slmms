import React, { useState } from "react";
import { Card, Button, Modal, Image, Tag, Tooltip, message } from "antd";
import {
  EditOutlined,
  PictureOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import Swal from "sweetalert2";

export default function MCQCard({ mcq, onEdit, onDeleted }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const baseURL =
    import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "";
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const questionImage = mcq?.question?.image
    ? `${baseURL}/${mcq.question.image.replace(/\\/g, "/")}`
    : null;

  const standard = mcq?.standardId?.standard || "-";
  const subject = mcq?.subjectId?.name || "-";
  const category = mcq?.categoryId?.name || "-";

  const handleDelete = async () => {
    try {
      const res = await axios.delete(`${apiBase}/mcqs/${mcq._id}/hard`);
      if (res.data?.success) {
        if (onDeleted) onDeleted(mcq._id);
      } else {
        message.error(res.data?.error || "Failed to delete MCQ");
      }
    } catch (err) {
      console.error(err);
      message.error("Error deleting MCQ");
    }
  };

  const showDeleteConfirm = () => {
    Swal.fire({
      title: "Are you sure you want to delete this MCQ?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33", // red
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete();
      }
    });
  };

  return (
    <>
      <Card
        hoverable
        className="w-full max-w-4xl mb-4 rounded-lg shadow-sm"
        bodyStyle={{ padding: 0 }}
      >
        {/* Header Section */}
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Tag color="blue" className="m-0">
                  Std {standard}
                </Tag>
                <Tag color="purple" className="m-0">
                  {subject}
                </Tag>
                <Tag color="geekblue" className="m-0">
                  {category}
                </Tag>
              </div>

              {/* Question Text */}
              <div
                className="text-gray-900 text-base leading-relaxed"
                style={{
                  fontFamily: mcq?.question?.font || "inherit",
                }}
                dangerouslySetInnerHTML={{ __html: mcq?.question?.text }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {questionImage && (
                <Tooltip title="View Question Image">
                  <Button
                    size="small"
                    icon={<PictureOutlined />}
                    onClick={() => {
                      setModalImage(questionImage);
                      setIsModalOpen(true);
                    }}
                  />
                </Tooltip>
              )}
              <Tooltip title="Edit MCQ">
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(mcq)}
                />
              </Tooltip>
              <Tooltip title="Delete MCQ">
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={showDeleteConfirm}
                />
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Options Section */}
        <div className="p-4 sm:p-6">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Options
          </h4>

          {mcq?.options?.length > 0 ? (
            <div className="space-y-2">
              {mcq.options.map((opt, index) => {
                const optImg = opt.image
                  ? `${baseURL}/${opt.image.replace(/\\/g, "/")}`
                  : null;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between gap-3 p-3 rounded-md transition-colors ${
                      opt.isCorrect
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-semibold text-gray-700 flex-shrink-0">
                        {opt.label}.
                      </span>
                      <span className="text-gray-800 break-words">
                        {opt.text}
                      </span>
                      {opt.isCorrect && (
                        <span className="text-green-600 font-bold text-lg flex-shrink-0">
                          ✓
                        </span>
                      )}
                    </div>

                    {optImg && (
                      <Button
                        size="small"
                        type="text"
                        icon={<PictureOutlined />}
                        onClick={() => {
                          setModalImage(optImg);
                          setIsModalOpen(true);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No options available</p>
          )}
        </div>
      </Card>

      {/* Image Modal */}
      <Modal
        title="Image Preview"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={800}
      >
        {modalImage && (
          <Image
            src={modalImage}
            alt="MCQ Image"
            className="rounded-lg"
            style={{
              maxHeight: "70vh",
              objectFit: "contain",
              width: "100%",
            }}
            preview={false}
          />
        )}
      </Modal>
    </>
  );
}
