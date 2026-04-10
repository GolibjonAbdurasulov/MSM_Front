import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../services/api";

export default function AuthPage({ setUser }) {
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setError("Email va parolni kiriting");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(`${BASE_URL}/Auth/Login`, {
        email: loginEmail,
        password: loginPassword,
      });

      const userData = response.data;

      if (!userData || !userData.token) {
        setError("Login muvaffaqiyatsiz");
        return;
      }

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);

      if (setUser) {
        setUser(userData);
      }

      setLoginEmail("");
      setLoginPassword("");

      if (userData.role === "Publisher") {
        navigate("/publisher");
      } else if (userData.role === "Reviewer") {
        navigate("/reviewer_main");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login xatosi:", err);

      if (err.response?.status === 401) {
        setError("Email yoki parol noto‘g‘ri");
      } else {
        setError("Server bilan bog‘lanishda xato");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 px-4 py-10">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-white text-4xl font-black shadow-lg animate-pulse">
            M
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          MSM ERP
        </h1>

        <p className="text-center text-blue-100/60 text-sm mb-8">
          Tizimga kirish uchun ma'lumotlarni kiriting
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/40 text-red-200 text-sm px-4 py-3 rounded-2xl text-center">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-blue-200 mb-2 block uppercase tracking-wider">
              Email
            </label>

            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Email kiriting"
              className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-100/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-blue-200 mb-2 block uppercase tracking-wider">
              Parol
            </label>

            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Parol kiriting"
              className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-100/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Kirilmoqda..." : "Tizimga kirish"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col gap-3 items-center">
          <div className="text-[10px] text-blue-100/30 uppercase tracking-[0.2em] font-bold text-center">
            Metallurgiya Servis Markazi ERP
          </div>
        </div>
      </div>
    </div>
  );
}