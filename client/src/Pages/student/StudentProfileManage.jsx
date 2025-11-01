import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spin } from "antd";
import StudentForm from "../../components/StudentForm";

export default function ManageProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const base = import.meta.env.VITE_API_BASE_URL || "";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${base}/students/${user.id}`);
        if (res.data?.success) {
          setStudent(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [base]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-fit">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-fit flex justify-center items-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Manage Your Profile
        </h1>

        {student ? (
          <StudentForm
            editingStudent={student}
            onSave={() => {
              // Update local storage when student updates their info
              const user = JSON.parse(localStorage.getItem("user"));
              localStorage.setItem(
                "user",
                JSON.stringify({
                  ...user,
                  fullName: student.fullName,
                })
              );
            }}
          />
        ) : (
          <p className="text-center text-gray-500">
            Failed to load your profile.
          </p>
        )}
      </div>
    </div>
  );
}
