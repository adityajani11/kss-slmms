import React, { useEffect, useState } from "react";
import { BookOpen, Award, FileQuestion, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) setStudent(JSON.parse(user));
  }, []);

  const stats = [
    {
      title: "Total Subjects",
      value: 6,
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
    },
    {
      title: "Papers Completed",
      value: 12,
      icon: <FileQuestion className="w-6 h-6 text-green-600" />,
    },
    {
      title: "Overall Rank",
      value: "#8",
      icon: <TrendingUp className="w-6 h-6 text-yellow-600" />,
    },
    {
      title: "Achievements",
      value: 3,
      icon: <Award className="w-6 h-6 text-pink-600" />,
    },
  ];

  const quote = {
    text: "“Success doesn’t come to you, you go to it.”",
    author: "Marva Collins",
  };

  return (
    <div className="min-h-fit">
      <div className="mx-auto space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow-lg flex justify-between items-center"
        >
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {student?.fullName || "Student"} 👋
            </h1>
            <p className="text-white/80 mt-1">
              Keep learning and achieving great things!
            </p>
          </div>
          <Star className="w-12 h-12 text-yellow-300 animate-pulse" />
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl p-6 shadow-md text-center"
        >
          <p className="text-lg italic mb-2">{quote.text}</p>
          <p className="text-sm text-white/80">– {quote.author}</p>
        </motion.div>
      </div>
    </div>
  );
}
