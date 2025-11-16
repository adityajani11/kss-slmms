import React, { useState, useEffect } from "react";
import axios from "axios";
import bcrypt from "bcryptjs";
import Swal from "sweetalert2";
import { Spin } from "antd";

export default function StudentForm({ onClose, onSave, editingStudent }) {
  const [loading, setLoading] = useState(false);
  const base = import.meta.env.VITE_API_BASE_URL || "";

  const [standards, setStandards] = useState([]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    city: "",
    district: "",
    schoolName: "",
    standardId: "",
    contactNumber: "",
    whatsappNumber: "",
    gender: "",
    cast: "",
    category: "",
    stream: "",
  });

  const [errors, setErrors] = useState({});

  // ------------------------------
  // Fetch Standards + Setup Editing
  // ------------------------------
  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const res = await axios.get(`${base}/standards`);
        const list = Array.isArray(res.data?.data?.items)
          ? res.data.data.items
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setStandards(list);
      } catch (error) {
        console.error("Failed to fetch standards", error);
        setStandards([]);
      }
    };

    fetchStandards();

    if (editingStudent) {
      const s = editingStudent;
      setFormData({
        username: s.username || "",
        fullName: s.fullName || "",
        city: s.city || "",
        district: s.district || "",
        schoolName: s.schoolName || "",
        standardId: s.standardId?._id || s.standardId || "",
        contactNumber: s.contactNumber || "",
        whatsappNumber: s.whatsappNumber || "",
        gender: s.gender || "",
        cast: s.cast || "",
        category: s.category || "",
        stream: s.stream || "",

        // admins can leave password blank to keep unchanged
        password: "",
        confirmPassword: "",
      });
    }
  }, [editingStudent, base]);

  // ------------------------------
  // Field Validation (same as ManageProfile)
  // ------------------------------
  const validate = () => {
    const e = {};

    if (!formData.username.trim()) e.username = "Username is required";
    if (!formData.fullName.trim()) e.fullName = "Full name is required";

    if (!formData.city.trim()) e.city = "City is required";
    if (!formData.district.trim()) e.district = "District is required";
    if (!formData.schoolName.trim()) e.schoolName = "School name is required";

    // Contact
    if (!formData.contactNumber.toString().trim())
      e.contactNumber = "Contact number is required";
    else if (!/^[0-9]{10}$/.test(formData.contactNumber))
      e.contactNumber = "Enter a valid 10-digit number";

    // Whatsapp
    if (!formData.whatsappNumber.toString().trim())
      e.whatsappNumber = "WhatsApp number is required";
    else if (!/^[0-9]{10}$/.test(formData.whatsappNumber))
      e.whatsappNumber = "Enter a valid 10-digit number";

    if (!formData.gender) e.gender = "Gender is required";
    if (!formData.cast.trim()) e.cast = "Cast is required";
    if (!formData.category.trim()) e.category = "Category is required";

    // Password validation (Admin only)
    if (!editingStudent || formData.password.trim() !== "") {
      if (formData.password !== formData.confirmPassword)
        e.confirmPassword = "Passwords do not match";
      if (formData.password.length < 6)
        e.password = "Password must be at least 6 characters";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ------------------------------
  // Submit (Create / Update)
  // ------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      Swal.fire("Validation Error", "Please fix form errors.", "error");
      return;
    }

    try {
      setLoading(true);
      let payload = { ...formData };

      // Hash password only if set
      if (!editingStudent || formData.password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(formData.password, salt);
        payload.passwordHash = hash;
      }

      delete payload.password;
      delete payload.confirmPassword;

      if (editingStudent) {
        await axios.put(`${base}/students/${editingStudent._id}`, payload);
        Swal.fire("Success", "Student updated successfully!", "success");
      } else {
        await axios.post(`${base}/students`, payload);
        Swal.fire("Success", "Student created successfully!", "success");
      }

      onSave?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.response?.data?.error || "Something went wrong!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Stream Logic
  // ------------------------------
  const selectedStandard = standards.find(
    (std) => std._id === formData.standardId
  );
  const showStream =
    selectedStandard && Number(selectedStandard.standard) >= 10;

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-2xl shadow-md space-y-4 max-w-full sm:max-w-2xl mx-auto"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {editingStudent ? "Update Student" : "Create Student Account"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* USERNAME */}
        <InputField
          label="Username (Login)"
          name="username"
          value={formData.username}
          onChange={setFormData}
          error={errors.username}
          maxLength={30}
        />

        {/* PASSWORD */}
        <PasswordField
          label="Password"
          name="password"
          placeholder={
            editingStudent ? "Leave blank to keep unchanged" : "Enter password"
          }
          value={formData.password}
          onChange={setFormData}
          error={errors.password}
          required={!editingStudent}
        />

        {/* CONFIRM */}
        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          placeholder={
            editingStudent
              ? "Leave blank to keep unchanged"
              : "Confirm password"
          }
          value={formData.confirmPassword}
          onChange={setFormData}
          error={errors.confirmPassword}
          required={!editingStudent}
        />

        {/* FULL NAME */}
        <InputField
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={setFormData}
          error={errors.fullName}
          maxLength={50}
        />

        {/* CITY */}
        <InputField
          label="City"
          name="city"
          value={formData.city}
          onChange={setFormData}
          error={errors.city}
          maxLength={50}
        />

        {/* DISTRICT */}
        <InputField
          label="District"
          name="district"
          value={formData.district}
          onChange={setFormData}
          error={errors.district}
          maxLength={50}
        />

        {/* SCHOOL NAME */}
        <InputField
          label="School Name"
          name="schoolName"
          value={formData.schoolName}
          onChange={setFormData}
          error={errors.schoolName}
          maxLength={50}
        />

        {/* STANDARD */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Standard
          </label>
          <select
            name="standardId"
            value={formData.standardId}
            onChange={(e) =>
              setFormData((p) => ({ ...p, standardId: e.target.value }))
            }
            required
            disabled={!!editingStudent}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 disabled:bg-gray-100"
          >
            <option value="">Select Standard</option>
            {standards.map((std) => (
              <option key={std._id} value={std._id}>
                {std.standard}
              </option>
            ))}
          </select>
        </div>

        {/* STREAM */}
        {showStream && (
          <SelectField
            label="Stream"
            name="stream"
            value={formData.stream}
            onChange={setFormData}
            options={["SCIENCE", "COMMERCE", "ARTS", "OTHER"]}
          />
        )}

        {/* CONTACT */}
        <InputField
          label="Contact Number"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={setFormData}
          error={errors.contactNumber}
          maxLength={10}
          inputMode="numeric"
        />

        {/* WHATSAPP */}
        <InputField
          label="WhatsApp Number"
          name="whatsappNumber"
          value={formData.whatsappNumber}
          onChange={setFormData}
          error={errors.whatsappNumber}
          maxLength={10}
          inputMode="numeric"
        />

        {/* GENDER */}
        <SelectField
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={setFormData}
          error={errors.gender}
          options={["Male", "Female"]}
        />

        {/* CAST */}
        <InputField
          label="Cast"
          name="cast"
          value={formData.cast}
          onChange={setFormData}
          error={errors.cast}
          maxLength={20}
        />

        {/* CATEGORY */}
        <SelectField
          label="Category"
          name="category"
          value={formData.category}
          onChange={setFormData}
          error={errors.category}
          options={["SC", "ST", "OBC", "OPEN", "OTHER"]}
        />
      </div>

      {/* BUTTONS */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => (onClose ? onClose() : window.history.back())}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? (
            <Spin size="small" />
          ) : editingStudent ? (
            "Update"
          ) : (
            "Create"
          )}
        </button>
      </div>
    </form>
  );
}

/* ---------------------------
   Reusable Input Components
---------------------------- */
function InputField({ label, name, value, onChange, error, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        {...rest}
        name={name}
        value={value}
        onChange={(e) => onChange((p) => ({ ...p, [name]: e.target.value }))}
        className={`w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function PasswordField({ label, name, value, onChange, error, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="password"
        name={name}
        value={value}
        onChange={(e) => onChange((p) => ({ ...p, [name]: e.target.value }))}
        {...rest}
        className={`w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, error, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange((p) => ({ ...p, [name]: e.target.value }))}
        className={`w-full border rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <option value="">Select</option>
        {options.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
