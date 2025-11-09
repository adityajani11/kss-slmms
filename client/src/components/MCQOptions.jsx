import React from "react";
import { Radio, Space, Input, Upload, Button } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";

export default function MCQOptions({ options, setOptions, uploadProps, base }) {
  const handleOptionChange = (index, field, value) => {
    const copy = [...options];
    copy[index][field] = value;
    setOptions(copy);
  };

  const selectedCorrect = options.findIndex((o) => o.isCorrect);

  const handleCorrect = (index) => {
    setOptions(options.map((o, i) => ({ ...o, isCorrect: i === index })));
  };

  const addOption = () =>
    setOptions([...options, { label: "", isCorrect: false, image: null }]);

  return (
    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50 shadow-inner mt-6">
      <h4 className="text-lg font-medium mb-4 text-gray-700">Answer Options</h4>

      <Radio.Group
        value={selectedCorrect}
        onChange={(e) => handleCorrect(e.target.value)}
      >
        <Space direction="vertical" className="w-full">
          {options.map((opt, index) => (
            <div
              key={index}
              className={`flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border ${
                selectedCorrect === index
                  ? "border-green-500 bg-green-100"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <Radio value={index} className="flex-shrink-0" />

                {/* Label */}
                <Input
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  value={opt.label}
                  onChange={(e) =>
                    handleOptionChange(index, "label", e.target.value)
                  }
                  className="flex-grow"
                />

                {/* Existing image preview (if editing) */}
                {opt.existingImage && (
                  <img
                    src={`${base.replace(
                      "/api/v1",
                      ""
                    )}/${opt.existingImage.replace(/\\/g, "/")}`}
                    alt="Existing"
                    className="w-14 h-14 rounded object-cover ml-2"
                  />
                )}
              </div>

              {/* Upload new image */}
              <Upload
                {...uploadProps}
                maxCount={1}
                fileList={
                  opt.image
                    ? [{ uid: index, name: opt.image.name, status: "done" }]
                    : []
                }
                onChange={({ file }) =>
                  handleOptionChange(
                    index,
                    "image",
                    file.status === "removed"
                      ? null
                      : file.originFileObj || file
                  )
                }
                beforeUpload={() => false}
                showUploadList={{ showRemoveIcon: true }}
              >
                <Button size="small" icon={<UploadOutlined />}>
                  Upload Image
                </Button>
              </Upload>
            </div>
          ))}
        </Space>
      </Radio.Group>

      <Button
        icon={<PlusOutlined />}
        className="mt-4 w-full border-dashed border-gray-400 text-gray-600"
        onClick={addOption}
        disabled={options.length >= 6}
      >
        Add Another Option
      </Button>
    </div>
  );
}
