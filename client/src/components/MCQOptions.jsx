import React from "react";
import { Input, Upload, Button, Radio, Space } from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

export default function MCQOptions({
  form,
  setForm,
  handleOptionChange,
  handleOptionImage,
  handleAddOption,
  submitting,
}) {
  return (
    <div>
      <label className="font-medium mb-2">Options</label>
      <Radio.Group
        onChange={(e) =>
          setForm({
            ...form,
            options: form.options.map((opt, i) => ({
              ...opt,
              isCorrect: i === e.target.value,
            })),
          })
        }
        value={form.options.findIndex((o) => o.isCorrect)}
      >
        <Space direction="vertical">
          {form.options.map((opt, index) => (
            <Space key={index} align="start">
              <Radio value={index}>{String.fromCharCode(65 + index)})</Radio>
              <Input
                value={opt.label}
                onChange={(e) =>
                  handleOptionChange(index, "label", e.target.value)
                }
                placeholder="Enter option text"
                style={{ width: 300 }}
              />
              <Upload
                beforeUpload={(file) => handleOptionImage(index, file)}
                maxCount={1}
                showUploadList={true}
              >
                <Button icon={<UploadOutlined />}>Upload Option Image</Button>
              </Upload>
            </Space>
          ))}
        </Space>
      </Radio.Group>

      {/* Add Option Button */}
      <Button
        type="dashed"
        icon={submitting ? <LoadingOutlined /> : <PlusOutlined />}
        onClick={handleAddOption}
        className="mt-2"
        disabled={submitting}
        style={{
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Adding..." : "Add Other Option"}
      </Button>
    </div>
  );
}
