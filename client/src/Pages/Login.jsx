import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../components/Loader";
import logo from "../assets/logo-trans.png";

const roles = ["admin", "staff", "student"];

export default function Login() {
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const base = import.meta.env.VITE_API_BASE_URL;
      let url = `${base}/${role}/login`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      // Save token & user
      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      // Dynamic redirection
      navigate(`/${role}/dashboard`, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const roleWelcome = {
    admin: "Manage the system with ease",
    staff: "Access your teaching tools",
    student: "Start your learning journey",
  };

  const roleDescriptions = {
    admin:
      "Comprehensive system control and user management at your fingertips.",
    staff: "Streamline your teaching workflow with powerful educational tools.",
    student:
      "Discover, learn, and grow with our interactive learning platform.",
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Loader */}
      {loading && <Loader message="Signing in…" />}

      {/* Left Gradient Section */}
      <div className="hidden lg:flex w-8/12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-32 w-24 h-24 bg-white/20 rounded-full blur-lg"></div>

        <div className="relative z-10 flex items-center justify-center w-full h-full p-8">
          <div className="text-center max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                  {roleWelcome[role]}
                </h1>
                <p className="text-lg lg:text-xl text-white/90 leading-relaxed mb-8">
                  {roleDescriptions[role]}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "🔒", text: "Secure" },
                { icon: "⚡", text: "Fast" },
                { icon: "✓", text: "Reliable" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-white text-xs">{item.icon}</span>
                  </div>
                  <p className="text-white/80 text-sm font-medium">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-4">
            <img
              src={logo}
              alt="Logo"
              className="mx-auto mb-3 max-w-[100px] h-auto"
            />
            <h2 className="text-xl font-bold text-gray-900">Welcome</h2>
          </div>

          {/* Role Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              Login as
            </label>
            <div className="grid grid-cols-3 gap-1">
              {roles.map((r) => (
                <label
                  key={r}
                  className={`cursor-pointer transition-all duration-200 ${
                    role === r
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  } border-2 rounded-lg p-2 text-center font-medium`}
                >
                  <input
                    type="radio"
                    value={r}
                    checked={role === r}
                    onChange={(e) => setRole(e.target.value)}
                    className="sr-only"
                  />
                  <div className="capitalize text-sm">{r}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-gray-700 font-medium mb-1 text-md"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                            transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-gray-700 font-medium mb-1 text-md"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                            transition-all duration-200 text-gray-900 placeholder-gray-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600"
                  } text-white py-2.5 rounded-lg font-semibold 
                            hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                            shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 text-sm`}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Create New Account
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 text-red-600 text-center text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
