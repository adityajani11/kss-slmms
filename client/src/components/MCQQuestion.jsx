import React from "react";
import { Input, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export default function MCQQuestion({ form, setForm, handleQuestionImage }) {
  return (
    <div>
      <label className="font-medium">Question</label>
      <Input.TextArea
        value={form.questionText}
        onChange={(e) => setForm({ ...form, questionText: e.target.value })}
        rows={3}
        placeholder="Write question here (Gujarati supported)"
      />
      <Upload
        beforeUpload={handleQuestionImage}
        maxCount={1}
        showUploadList={true}
      >
        <Button icon={<UploadOutlined />}>
          Upload Question Image (≤200KB)
        </Button>
      </Upload>
    </div>
  );
}
