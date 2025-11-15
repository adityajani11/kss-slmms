import React, { useMemo } from "react";
import { Image, Select } from "antd";
import MCQCard from "./MCQCard";

const { Option } = Select;

export default function MCQList({
  mcqs,
  loading,
  onEdit,
  onDeleted,
  preview,
  setPreview,
  standards = [],
  categories = [],
  subjects = [],
  selectedFilters,
  setSelectedFilters,
  searchQuery = "",
  setSearchQuery = () => {},
  selectedForPaper = new Set(),
  toggleSelectForPaper = () => {},
  allowSelection = false, // when both standard & subject selected
  selectedStandard = null,
  selectedSubject = null,
}) {
  // Filter logic (runs only when needed)
  const filteredMCQs = useMemo(() => {
    return mcqs.filter((mcq) => {
      // Text-based search (Gujarati supported)
      const qText = mcq.question?.text?.toLowerCase() || "";
      const explanation = mcq.explanation?.toLowerCase() || "";
      const optionsText = mcq.options
        .map((o) => o.label?.toLowerCase() || "")
        .join(" ");

      const search = searchQuery.toLowerCase().trim();

      const matchesSearch =
        search === "" ||
        qText.includes(search) ||
        explanation.includes(search) ||
        optionsText.includes(search);

      const matchesStandard =
        !selectedFilters.standard ||
        mcq.standardId?._id === selectedFilters.standard;

      const matchesCategory =
        !selectedFilters.category ||
        mcq.categoryId?._id === selectedFilters.category;

      const matchesSubject =
        !selectedFilters.subject ||
        mcq.subjectId?._id === selectedFilters.subject;

      return (
        matchesSearch && matchesStandard && matchesCategory && matchesSubject
      );
    });
  }, [mcqs, selectedFilters, searchQuery]);

  return (
    <div>
      {/* SEARCH BAR */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search questions or options..."
        className="w-full md:w-1/2 px-3 py-2 border rounded mb-4 outline-none focus:ring focus:border-blue-500"
      />
      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Standard Filter */}
        <Select
          allowClear
          placeholder="Filter Standard"
          style={{ width: 200 }}
          value={selectedFilters.standard || undefined}
          onChange={(v) =>
            setSelectedFilters((p) => ({ ...p, standard: v || null }))
          }
        >
          {standards.map((s) => (
            <Option key={s._id} value={s._id}>
              Standard {s.standard}
            </Option>
          ))}
        </Select>

        {/* Category Filter */}
        <Select
          allowClear
          placeholder="Filter Category"
          style={{ width: 200 }}
          value={selectedFilters.category || undefined}
          onChange={(v) =>
            setSelectedFilters((p) => ({ ...p, category: v || null }))
          }
        >
          {categories.map((c) => (
            <Option key={c._id} value={c._id}>
              {c.name}
            </Option>
          ))}
        </Select>

        {/* Subject Filter */}
        <Select
          allowClear
          placeholder="Filter Subject"
          style={{ width: 200 }}
          value={selectedFilters.subject || undefined}
          onChange={(v) =>
            setSelectedFilters((p) => ({ ...p, subject: v || null }))
          }
        >
          {subjects.map((s) => (
            <Option key={s._id} value={s._id}>
              {s.name}
            </Option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div
          id="mcq-print-area"
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          {filteredMCQs.map((mcq) => (
            <MCQCard
              key={mcq._id}
              mcq={mcq}
              onEdit={() => onEdit(mcq)}
              onDeleted={onDeleted}
              setPreview={setPreview}
              isSelectedForPaper={selectedForPaper.has(mcq._id)}
              toggleSelectForPaper={() => toggleSelectForPaper(mcq._id)}
              allowSelection={allowSelection}
              selectedStandard={selectedStandard}
              selectedSubject={selectedSubject}
            />
          ))}

          {filteredMCQs.length === 0 && (
            <p className="text-center text-gray-500 col-span-full py-6">
              No MCQs match selected filters.
            </p>
          )}
        </div>
      )}

      {/* GLOBAL IMAGE PREVIEW */}
      <Image.PreviewGroup
        preview={{
          visible: preview.visible,
          onVisibleChange: (vis) => setPreview((p) => ({ ...p, visible: vis })),
          zIndex: 9999,
        }}
      >
        <Image src={preview.src} style={{ display: "none" }} />
      </Image.PreviewGroup>
    </div>
  );
}
