import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import bcrypt from "bcryptjs";
import PasswordModal from "../../components/PasswordModal";

export default function Settings() {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirm, setAdminConfirm] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentConfirm, setStudentConfirm] = useState("");

  const [show, setShow] = useState(false);

  const base = import.meta.env.VITE_API_BASE_URL;

  const resetAll = () => {
    setAdminPassword("");
    setAdminConfirm("");
    setStudentPassword("");
    setStudentConfirm("");
    setShow(false);
  };

  const handleSubmit = async (type) => {
    const isAdmin = type === "ADMIN_LOGIN";

    let pass = isAdmin ? adminPassword : studentPassword;
    let confirm = isAdmin ? adminConfirm : studentConfirm;

    if (pass.length < 6) {
      Swal.fire("Error", "Password must be at least 6 chars", "error");
      return;
    }

    if (pass !== confirm) {
      Swal.fire("Error", "Passwords do not match", "error");
      return;
    }

    const ask = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
    });

    if (!ask.isConfirmed) return;

    const hash = await bcrypt.hash(pass, 10);

    await axios.put(`${base}/admin/update-password`, {
      type,
      passwordHash: hash,
    });

    Swal.fire("Success", "Password updated", "success");

    resetAll();
    setShowAdminModal(false);
    setShowStudentModal(false);
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Admin Security Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className="bg-white p-6 rounded-xl shadow cursor-pointer hover:shadow-lg"
          onClick={() => setShowStudentModal(true)}
        >
          <h3 className="text-lg font-semibold">
            Change Student Delete & Academic Management Password
          </h3>
          <p className="text-gray-600 text-sm mt-2">
            Update security password used for student deletion & academic data
            deletion.
          </p>
        </div>

        <div
          className="bg-white p-6 rounded-xl shadow cursor-pointer hover:shadow-lg"
          onClick={() => setShowAdminModal(true)}
        >
          <h3 className="text-lg font-semibold">Change Admin Login Password</h3>
          <p className="text-gray-600 text-sm mt-2">
            Update your login password.
          </p>
        </div>
      </div>

      {showStudentModal && (
        <PasswordModal
          title="Change Student Delete Password"
          pass={studentPassword}
          confirm={studentConfirm}
          setPass={setStudentPassword}
          setConfirm={setStudentConfirm}
          show={show}
          setShow={setShow}
          onSubmit={() => handleSubmit("STUDENT_DELETE")}
          onClose={() => {
            resetAll();
            setShowStudentModal(false);
          }}
        />
      )}

      {showAdminModal && (
        <PasswordModal
          title="Change Admin Login Password"
          pass={adminPassword}
          confirm={adminConfirm}
          setPass={setAdminPassword}
          setConfirm={setAdminConfirm}
          show={show}
          setShow={setShow}
          onSubmit={() => handleSubmit("ADMIN_LOGIN")}
          onClose={() => {
            resetAll();
            setShowAdminModal(false);
          }}
        />
      )}
    </>
  );
}
