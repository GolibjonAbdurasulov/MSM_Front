import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../services/api";

export default function AuthPage({ setUser }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("Reviewer");
  const [regDepartmentId, setRegDepartmentId] = useState("");

  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Departmentlarni yuklash
  useEffect(() => {
    setDeptLoading(true);
    axios
      .get(`${BASE_URL}/Department/GetAllDepartments`)
      .then((res) => {
        const list = res.data?.content || [];
        setDepartments(list);
        if (list.length > 0) setRegDepartmentId(list[0].id);
      })
      .catch(() => setDepartments([]))
      .finally(() => setDeptLoading(false));
  }, []);

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
      if (setUser) setUser(userData);
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
        setError("Email yoki parol noto'g'ri");
      } else {
        setError("Server bilan bog'lanishda xato");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regFirstName || !regLastName || !regEmail || !regPassword || !regDepartmentId) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await axios.post(`${BASE_URL}/Auth/Register`, {
        firstName: regFirstName,
        lastName: regLastName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        departmentId: Number(regDepartmentId),
      });
      setSuccess("Ro'yxatdan o'tish muvaffaqiyatli! Tizimga kiring.");
      setRegFirstName("");
      setRegLastName("");
      setRegEmail("");
      setRegPassword("");
      setRegRole("Reviewer");
      if (departments.length > 0) setRegDepartmentId(departments[0].id);
      setTimeout(() => {
        setMode("login");
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Register xatosi:", err);
      if (err.response?.status === 400) {
        setError("Bu email allaqachon ro'yxatdan o'tgan");
      } else {
        setError("Server bilan bog'lanishda xato");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      mode === "login" ? handleLogin() : handleRegister();
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
        <p className="text-center text-blue-100/60 text-sm mb-6">
          {mode === "login"
            ? "Tizimga kirish uchun ma'lumotlarni kiriting"
            : "Yangi foydalanuvchi yaratish"}
        </p>

        {/* Mode toggle */}
        <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === "login"
                ? "bg-blue-600 text-white shadow"
                : "text-blue-200 hover:text-white"
            }`}
          >
            Kirish
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === "register"
                ? "bg-blue-600 text-white shadow"
                : "text-blue-200 hover:text-white"
            }`}
          >
            Ro'yxatdan o'tish
          </button>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/40 text-red-200 text-sm px-4 py-3 rounded-2xl text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-500/20 border border-green-500/40 text-green-200 text-sm px-4 py-3 rounded-2xl text-center">
            {success}
          </div>
        )}

        {/* LOGIN */}
        {mode === "login" && (
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
                autoComplete="email"
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
                autoComplete="current-password"
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-100/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <button
              id="login-submit" 
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Kirilmoqda..." : "Tizimga kirish"}
            </button>
          </div>
        )}

        {/* REGISTER */}
        {mode === "register" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-blue-200 mb-2 block uppercase tracking-wider">
                  Ism
                </label>
                <input
                  type="text"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ism"
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-100/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-blue-200 mb-2 block uppercase tracking-wider">
                  Familiya
                </label>
                <input
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Familiya"
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-100/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-blue-200 mb-2 block uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Email kiriting"
                className="w-full px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-100/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-blue-200 mb-2 block uppercase tracking-wider">
                Parol
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Kamida 8 ta belgi, 1 ta katta harf, 1 ta raqam"
                className="w-full px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-blue-100/30 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-blue-200 mb-2 block uppercase tracking-wider">
                  Rol
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-blue-950 border border-white/20 text-white outline-none focus:border-blue-400 transition-all"
                >
                  <option value="Reviewer">Topshiriq beruvchi</option>
                  <option value="Publisher">Kuzatuvchi</option>
                </select>
              </div>

              {/* ✅ YANGI: Department select */}
              <div className="flex-1">
                <label className="text-xs font-semibold text-blue-200 mb-2 block uppercase tracking-wider">
                  Bo'lim
                </label>
                {deptLoading ? (
                  <div className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-blue-300 text-sm">
                    Yuklanmoqda...
                  </div>
                ) : (
                  <select
                    value={regDepartmentId}
                    onChange={(e) => setRegDepartmentId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-blue-950 border border-white/20 text-white outline-none focus:border-blue-400 transition-all"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentShortName}
                      </option>
                    ))}
                    {departments.length === 0 && (
                      <option disabled>Bo'limlar topilmadi</option>
                    )}
                  </select>
                )}
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saqlanmoqda..." : "Ro'yxatdan o'tish"}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 flex flex-col gap-3 items-center">
          <div className="text-[10px] text-blue-100/30 uppercase tracking-[0.2em] font-bold text-center">
            Metallurgiya Servis Markazi ERP
          </div>
        </div>
      </div>
    </div>
  );
}