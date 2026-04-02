import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AuthPage({ setUser }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      // Backenddagi POST metodiga mos query string orqali yuborish
      const response = await axios.post(
        `http://localhost:5166/api/Auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      );

      const userData = response.data;

      if (!userData) {
        setError("Login yoki parol noto‘g‘ri");
        return;
      }

      localStorage.setItem("user", JSON.stringify(userData));
      if (setUser) setUser(userData); // App.jsx dagi setUser funksiyasini chaqirish

      // Inputlarni tozalash
      setEmail("");
      setPassword("");

      // Yo'naltirish
      if (userData.role === 1) navigate("/publisher");
      else navigate("/reviewer");

    } catch (err) {
      console.error(err);
      setError("Server bilan bog‘lanishda xato");
    } finally {
      setLoading(false);
    }
  };

  return (
    // "min-h-screen" o'rniga "h-screen" ishlatib ko'ring va "overflow-hidden" qo'shing
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 px-4">
      {/* Oq blok ko'rinishi uchun shaffoflikni biroz oshiramiz (bg-white/10 -> bg-white/20) */}
      <div className="relative z-10 w-full max-w-md bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl p-8 flex flex-col items-center">
        
        {/* Logo */}
        <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/30 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg animate-bounce">
          M
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-1 text-center">
          MSM ERP Login
        </h1>
        <p className="text-blue-100/70 text-xs mb-6 text-center">
          Tizimga kirish uchun ma'lumotlaringizni kiriting
        </p>

        {/* Form */}
        <div className="w-full space-y-4">
          <div className="flex flex-col">
            <label className="text-xs text-blue-100 mb-1 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:bg-white/20 focus:border-white transition-all"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-blue-100 mb-1 ml-1">Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:bg-white/20 focus:border-white transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-500/30 border border-red-500/50 text-red-100 text-xs px-3 py-2 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 text-md"
          >
            {loading ? "Kirilmoqda..." : "Tizimga kirish"}
          </button>
        </div>

        <div className="mt-8 text-center text-[10px] text-blue-100/40 uppercase tracking-widest">
          MSM ERP Management System
        </div>
      </div>
    </div>
  );
}
