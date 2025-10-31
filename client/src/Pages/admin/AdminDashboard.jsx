import React, { useState, useEffect } from "react";
import axios from "axios";
import StaffForm from "../../components/StaffForm";
import {
  Users,
  GraduationCap,
  FileQuestion,
  BookOpen,
  Layers,
  Grid,
} from "lucide-react";

export default function AdminDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    staff: "N/A",
    students: "N/A",
    mcqs: "N/A",
    subjects: "N/A",
    categories: "N/A",
    standards: "N/A",
  });
  const [loading, setLoading] = useState(true);
  const base = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${base}/staff/getAllCounts`);
        if (res.data?.success && res.data?.data) {
          setStats(res.data.data);
        } else {
          setStats({
            staff: "N/A",
            students: "N/A",
            mcqs: "N/A",
            subjects: "N/A",
            categories: "N/A",
            standards: "N/A",
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        setStats({
          staff: "N/A",
          students: "N/A",
          mcqs: "N/A",
          subjects: "N/A",
          categories: "N/A",
          standards: "N/A",
        });
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
      color: "from-indigo-200 to-indigo-400",
    },
    {
      title: "Total Students",
      value: stats.students,
      icon: <GraduationCap size={28} />,
      color: "from-emerald-200 to-emerald-400",
    },
    {
      title: "Total MCQs",
      value: stats.mcqs,
      icon: <FileQuestion size={28} />,
      color: "from-rose-200 to-pink-400",
    },
    {
      title: "Total Subjects",
      value: stats.subjects,
      icon: <BookOpen size={28} />,
      color: "from-yellow-200 to-orange-300",
    },
    {
      title: "Total Categories",
      value: stats.categories,
      icon: <Layers size={28} />,
      color: "from-sky-200 to-cyan-300",
    },
    {
      title: "Total Standards",
      value: stats.standards,
      icon: <Grid size={28} />,
      color: "from-teal-200 to-green-300",
    },
  ];

  return (
    <div className="min-h-fit ">
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
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.color} text-gray-800 rounded-2xl shadow-md p-6 flex items-center justify-between group transition-all duration-500`}
          >
            {/* White wipe hover effect */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/30 transition-all duration-500 ease-out"></div>

            <div className="relative z-10">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-600">
                {stat.title}
              </p>
              <h2 className="text-4xl font-bold mt-1 text-gray-900">
                {loading ? (
                  <span className="animate-pulse text-gray-500">...</span>
                ) : (
                  stat.value
                )}
              </h2>
            </div>
            <div className="relative z-10 opacity-80">{stat.icon}</div>
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
