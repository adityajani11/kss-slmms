import React, { useState } from "react";
import { Card, Button, Modal, Image, Tag, Tooltip } from "antd";
import { EditOutlined } from "@ant-design/icons";

export default function MCQCard({ mcq, onEdit }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const baseURL =
    import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") || "";

  const questionImage = mcq?.question?.image
    ? `${baseURL}/${mcq.question.image.replace(/\\/g, "/")}`
    : null;

  const standard = mcq?.standardId?.standard || "-";
  const subject = mcq?.subjectId?.name || "-";
  const category = mcq?.categoryId?.name || "-";

  return (
    <>
      <Card
        hoverable
        style={{
          width: "100%",
          maxWidth: 900,
          paddingTop: 20,
          marginBottom: 20,
          borderRadius: 12,
          boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
        }}
        title={
          <>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Tag color="blue">Std {standard}</Tag>
                  <Tag color="purple">{subject}</Tag>
                  <Tag color="geekblue">{category}</Tag>
                </div>
                <div
                  className="text-gray-800 text-base font-medium"
                  style={{
                    fontFamily: mcq?.question?.font || "inherit",
                    lineHeight: "1.5",
                  }}
                  dangerouslySetInnerHTML={{ __html: mcq?.question?.text }}
                />
              </div>

              <Tooltip title="Edit MCQ">
                <Button
                  shape="circle"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(mcq)}
                />
              </Tooltip>
            </div>
          </>
        }
        extra={
          questionImage && (
            <Button
              size="small"
              onClick={() => {
                setModalImage(questionImage);
                setIsModalOpen(true);
              }}
            >
              View Image
            </Button>
          )
        }
      >
        <p className="font-semibold text-gray-700 mb-2">Options:</p>

        {mcq?.options?.length > 0 ? (
          mcq.options.map((opt, index) => {
            const optImg = opt.image
              ? `${baseURL}/${opt.image.replace(/\\/g, "/")}`
              : null;

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span>
                  <strong>{opt.label}</strong>{" "}
                  {opt.isCorrect && (
                    <span style={{ color: "green", fontWeight: "bold" }}>
                      ✔
                    </span>
                  )}
                </span>

                {optImg && (
                  <Button
                    size="small"
                    onClick={() => {
                      setModalImage(optImg);
                      setIsModalOpen(true);
                    }}
                  >
                    View Image
                  </Button>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 italic">No options available</p>
        )}
      </Card>

      <Modal
        title="MCQ Image"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
      >
        {modalImage && (
          <Image
            src={modalImage}
            alt="MCQ"
            style={{
              borderRadius: 10,
              maxHeight: "70vh",
              objectFit: "contain",
              width: "100%",
            }}
          />
        )}
      </Modal>
    </>
  );
}
