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
    // Kiritilgan ma'lumotlarni tekshirish
    if (!email || !password) {
      setError("Email va parolni kiriting");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Backend API manzili (Zavodda ishlatish uchun localhost o'rniga IP yozish tavsiya etiladi)
      const response = await axios.post(
        `http://localhost:5000/api/Auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      );

      const userData = response.data;

      // Foydalanuvchi topilmasa yoki ma'lumot noto'g'ri bo'lsa
      if (!userData) {
        setError("Email yoki parol noto‘g‘ri");
        setLoading(false);
        return;
      }

      // Ma'lumotlarni saqlash
      localStorage.setItem("user", JSON.stringify(userData));
      
      // App.jsx dagi user holatini yangilash
      if (setUser) setUser(userData); 

      // Inputlarni tozalash
      setEmail("");
      setPassword("");

      // ROLLAR BO'YICHA YO'NALTIRISH:
      // role 1 -> Publisher (Topshiriq yaratuvchi)
      // role 2 -> Reviewer (Grafik monitoring)
      if (userData.role === 1) {
        navigate("/publisher");
      } else if (userData.role === 2) {
        navigate("/reviewer_main"); 
      } else {
        // Agar boshqa rollar bo'lsa (ixtiyoriy)
        navigate("/reviewer_main");
      }

    } catch (err) {
      console.error("Login xatosi:", err);
      setError("Server bilan bog‘lanishda xato (CORS yoki Tarmoq)");
    } finally {
      setLoading(false);
    }
  };

  // Enter tugmasini bosganda login qilish
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 px-4 overflow-hidden">
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-10 flex flex-col items-center">
        
        {/* Logo Animation */}
        <div className="w-20 h-20 mb-6 rounded-full bg-blue-500/20 flex items-center justify-center text-white text-4xl font-black shadow-lg animate-bounce border border-blue-400/30">
          M
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">
          MSM ERP Login
        </h1>
        <p className="text-blue-100/60 text-sm mb-8 text-center">
          Tizimga kirish uchun ma'lumotlarni kiriting
        </p>

        {/* Form Fields */}
        <div className="w-full space-y-5">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-blue-200 mb-2 ml-1 uppercase tracking-wider">
              Email Manzil
            </label>
            <input
              type="email"
              value={email}
              onKeyDown={handleKeyDown}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@msm.uz"
              className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-100/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-blue-200 mb-2 ml-1 uppercase tracking-wider">
              Parol
            </label>
            <input
              type="password"
              value={password}
              onKeyDown={handleKeyDown}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-100/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs px-4 py-3 rounded-2xl animate-pulse text-center font-medium">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://w3.org" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Kirilmoqda...
              </span>
            ) : (
              "Tizimga kirish"
            )}
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-10 text-center text-[10px] text-blue-100/30 uppercase tracking-[0.2em] font-bold">
          Metallurgiya Servis Markazi ERP
        </div>
      </div>
    </div>
  );
}
