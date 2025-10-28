import React, { useState, useEffect } from "react";
import StaffForm from "../../components/StaffForm";
import { Users, GraduationCap, FileQuestion, BookOpen } from "lucide-react";

export default function AdminDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    staff: 0,
    students: 0,
    mcqs: 0,
    subjects: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const endpoints = {
          staff: "/api/admin/staff-count",
          students: "/api/admin/student-count",
          mcqs: "/api/admin/mcq-count",
          subjects: "/api/admin/subject-count",
        };

        const [staffRes, studentsRes, mcqsRes, subjectsRes] = await Promise.all(
          [
            fetch(endpoints.staff),
            fetch(endpoints.students),
            fetch(endpoints.mcqs),
            fetch(endpoints.subjects),
          ]
        );

        const [staffData, studentData, mcqData, subjectData] =
          await Promise.all([
            staffRes.json().catch(() => ({})),
            studentsRes.json().catch(() => ({})),
            mcqsRes.json().catch(() => ({})),
            subjectsRes.json().catch(() => ({})),
          ]);

        setStats({
          staff: staffData?.count || 0,
          students: studentData?.count || 0,
          mcqs: mcqData?.count || 0,
          subjects: subjectData?.count || 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Staff",
      value: stats.staff,
      icon: <Users size={28} />,
      color: "from-indigo-500 to-indigo-700",
    },
    {
      title: "Total Students",
      value: stats.students,
      icon: <GraduationCap size={28} />,
      color: "from-emerald-500 to-emerald-700",
    },
    {
      title: "Total MCQs",
      value: stats.mcqs,
      icon: <FileQuestion size={28} />,
      color: "from-pink-500 to-rose-600",
    },
    {
      title: "Total Subjects",
      value: stats.subjects,
      icon: <BookOpen size={28} />,
      color: "from-orange-400 to-yellow-500",
    },
  ];

  return (
    <div className="min-h-fit bg-gray-100 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">
            Welcome, Admin
          </h1>
          <p className="text-gray-600 mt-2 text-sm lg:text-lg">
            Here’s an overview of your system statistics.
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-6 border border-green-200 shadow-sm">
          {success}
        </div>
      )}

      {/* Staff Form Modal */}
      {showForm && (
        <StaffForm
          onClose={() => setShowForm(false)}
          onSuccess={(msg) => setSuccess(msg)}
        />
      )}

      {/* Statistics Section */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${stat.color} text-white rounded-2xl shadow-lg p-6 flex items-center justify-between transform hover:scale-105 transition duration-300`}
          >
            <div>
              <p className="text-sm uppercase tracking-wide opacity-90">
                {stat.title}
              </p>
              <h2 className="text-4xl font-bold mt-1">
                {loading ? (
                  <span className="animate-pulse text-white/70">...</span>
                ) : (
                  stat.value
                )}
              </h2>
            </div>
            <div className="opacity-80">{stat.icon}</div>
          </div>
        ))}
      </section>

      {/* Placeholder for future content */}
      <section className="bg-white rounded-2xl shadow p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Recent Activities
        </h2>
        <p className="text-gray-500">
          Dashboard analytics, charts, and recent logs will appear here.
        </p>
      </section>
    </div>
  );
}
