import React, { useState, useEffect } from "react";
import axios from "axios";
import bcrypt from "bcryptjs";
import Swal from "sweetalert2";
import { Spin } from "antd";

export default function StudentForm({ onClose, onSave, editingStudent }) {
  const [loading, setLoading] = useState(false);
  const base = import.meta.env.VITE_API_BASE_URL || "";

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

  const [standards, setStandards] = useState([]);

  useEffect(() => {
    const fetchStandards = async () => {
      try {
        const res = await axios.get(`${base}/standards`);
        if (Array.isArray(res.data?.data?.items))
          setStandards(res.data.data.items);
        else if (Array.isArray(res.data?.data)) setStandards(res.data.data);
        else if (Array.isArray(res.data)) setStandards(res.data);
        else setStandards([]);
      } catch (error) {
        console.error("Failed to fetch standards", error);
        setStandards([]);
      }
    };

    fetchStandards();

    if (editingStudent) {
      setFormData({
        username: editingStudent.username || "",
        fullName: editingStudent.fullName || "",
        city: editingStudent.city || "",
        district: editingStudent.district || "",
        schoolName: editingStudent.schoolName || "",
        standardId:
          editingStudent.standardId?._id || editingStudent.standardId || "",
        contactNumber: editingStudent.contactNumber || "",
        whatsappNumber: editingStudent.whatsappNumber || "",
        gender: editingStudent.gender || "",
        cast: editingStudent.cast || "",
        category: editingStudent.category || "",
        stream: editingStudent.stream || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [editingStudent, base]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      let payload = { ...formData };

      if (!editingStudent || formData.password.trim() !== "") {
        if (formData.password !== formData.confirmPassword) {
          Swal.fire("Error", "Passwords do not match!", "error");
          return;
        }
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
        Swal.fire("Success", "Student added successfully!", "success");
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

  // Get current selected standard number for stream visibility
  const selectedStandard = standards.find(
    (std) => std._id === formData.standardId
  );
  const showStream =
    selectedStandard && Number(selectedStandard.standard) >= 10;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-2xl shadow-md space-y-4 max-w-full sm:max-w-2xl mx-auto"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {editingStudent ? "Update Student" : "Add New Student"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder={
              editingStudent
                ? "Leave blank to keep unchanged"
                : "Enter password"
            }
            value={formData.password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
            {...(!editingStudent ? { required: true } : {})}
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            placeholder={
              editingStudent
                ? "Leave blank to keep unchanged"
                : "Re-enter password"
            }
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
            {...(!editingStudent ? { required: true } : {})}
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            District
          </label>
          <input
            type="text"
            name="district"
            required
            value={formData.district}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* School Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            School Name
          </label>
          <input
            type="text"
            name="schoolName"
            required
            value={formData.schoolName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Standard */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Standard
          </label>
          <select
            name="standardId"
            required
            value={formData.standardId}
            onChange={handleChange}
            disabled={!!editingStudent}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select Standard</option>
            {standards.map((std) => (
              <option key={std._id} value={std._id}>
                {std.standard}
              </option>
            ))}
          </select>
        </div>

        {/* Stream (conditional) */}
        {showStream && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stream
            </label>
            <select
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Stream</option>
              <option value="SCIENCE">SCIENCE</option>
              <option value="COMMERCE">COMMERCE</option>
              <option value="ARTS">ARTS</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
        )}

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contact Number
          </label>
          <input
            type="number"
            name="contactNumber"
            required
            value={formData.contactNumber}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* WhatsApp Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            WhatsApp Number
          </label>
          <input
            type="number"
            name="whatsappNumber"
            required
            value={formData.whatsappNumber}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <select
            name="gender"
            required
            value={formData.gender}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        {/* Cast */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cast
          </label>
          <input
            type="text"
            name="cast"
            required
            value={formData.cast}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="OBC">OBC</option>
            <option value="OPEN">OPEN</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className={`px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition ${
            loading && "opacity-60 cursor-not-allowed"
          }`}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
            loading && "opacity-60 cursor-not-allowed"
          }`}
        >
          {loading ? <Spin size="small" /> : editingStudent ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
