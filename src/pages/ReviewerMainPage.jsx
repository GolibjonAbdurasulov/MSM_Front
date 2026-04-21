import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../services/api.js";
import * as signalR from "@microsoft/signalr";

export default function ReviewerMainPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    if (!user || !token) {
      navigate("/", { replace: true });
    }
  }, [user, token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setToken("");
    navigate("/", { replace: true });
  };

  const fetchDepartments = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const tk = localStorage.getItem("token");

      const res = await axios.get(`${BASE_URL}/Department/GetAllDepartments`, {
        headers: { Authorization: `Bearer ${tk}` },
      });

      const departmentsWithStats = await Promise.all(
        (res.data.content || []).map(async (department) => {
          try {
            // ✅ Statistics API
            const statsRes = await axios.get(
              `${BASE_URL}/Department/GetDepartmentStatistics`,
              {
                params: { id: department.id },
                headers: { Authorization: `Bearer ${tk}` },
              }
            );
            const stats = statsRes.data.content || {};
            return {
              ...department,
              activeJobsCount: stats.activeJobsCount ?? 0,
              mobilizedWorkers: stats.mobilizedWorkers ?? 0,
            };
          } catch (err) {
            console.error("Statistics olishda xatolik:", err);
            return {
              ...department,
              activeJobsCount: 0,
              mobilizedWorkers: 0,
            };
          }
        })
      );

      setDepartments(departmentsWithStats);
    } catch (error) {
      console.error("Departmentlarni olishda xatolik:", error);
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  }, [selectedDate, token]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (!token) return;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL.replace("/api", "")}/jobHub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR connected");
      } catch (err) {
        console.error("SignalR ulanish xatosi:", err);
      }
    };
    startConnection();

    connection.on("JobChanged", (data) => {
      if (data.date === selectedDate) fetchDepartments();
    });

    return () => {
      connection.stop().catch((err) => console.error("SignalR stop xatosi:", err));
    };
  }, [selectedDate, token, fetchDepartments]);

  const renderGraph = () => {
    const total = departments.length;
    const hasAnyJobs = departments.some((d) => d.activeJobsCount > 0);

    const vw = windowSize.width;
    const vh = windowSize.height - 120;

    const cardWidth = Math.min(200, vw * 0.11);
    // cardWidth ni kattalashtiring
    //const cardWidth = Math.min(250, vw * 0.14); // 200 → 230, 0.11 → 0.14

    const centerSize = Math.min(270, vw * 0.14);

    const minR = centerSize / 2 + cardWidth + 30;
    const radiusX = Math.max(minR, Math.min(vw * 0.36, total > 10 ? 620 : 500));
    const radiusY = Math.max(minR * 0.6, Math.min(vh * 0.36, total > 10 ? 340 : 280));

    const getPosition = (index) => {
      const angle = ((360 / total) * index - 90) * (Math.PI / 180);
      return {
        x: Math.cos(angle) * radiusX,
        y: Math.sin(angle) * radiusY,
      };
    };

    return (
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ height: "calc(100vh - 120px)" }}
      >
        <style>{`
          @keyframes dashMoveToCenter {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: 40; }
          }
          .animated-line { animation: dashMoveToCenter 1.8s linear infinite; }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 rgba(16,185,129,0.15); }
            50% { box-shadow: 0 0 40px rgba(16,185,129,0.35); }
            100% { box-shadow: 0 0 0 rgba(16,185,129,0.15); }
          }
          .pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
        `}</style>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {departments.map((department, index) => {
            const pos = getPosition(index);
            const hasJobs = department.activeJobsCount > 0;
            return (
              <g key={department.id}>
                <line
                  x1="50%" y1="50%"
                  x2={`calc(50% + ${pos.x}px)`}
                  y2={`calc(50% + ${pos.y}px)`}
                  stroke={hasJobs ? "#10b981" : "#9ca3af"}
                  strokeWidth="3"
                  strokeDasharray="12 10"
                  className={hasJobs ? "animated-line" : ""}
                  style={{ strokeDashoffset: 0, opacity: hasJobs ? 0.9 : 0.45 }}
                />
                <circle
                  cx={`calc(50% + ${pos.x}px)`}
                  cy={`calc(50% + ${pos.y}px)`}
                  r="6"
                  fill={hasJobs ? "#10b981" : "#9ca3af"}
                />
              </g>
            );
          })}
        </svg>

        {/* Markaz */}
        <div
          className={`relative z-30 bg-white border-4 rounded-[3rem] flex items-center justify-center transition-all duration-500 ${
            hasAnyJobs ? "border-emerald-500 pulse-glow" : "border-gray-400"
          }`}
          style={{ width: `${centerSize}px`, height: `${centerSize}px` }}
        >
          <div className="text-center px-6">
            <div className="text-6xl font-black text-gray-900 tracking-tight">MSM</div>
            <div className="w-20 h-1 bg-gray-300 rounded-full mx-auto my-4"></div>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.35em] font-bold leading-relaxed">
              Metallurgiya<br />Servis Markazi
            </p>
            <div className="mt-5 text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
              {hasAnyJobs ? "Faol Vazifalar" : "Vazifalar yo'q"}
            </div>
          </div>
        </div>

        {/* Department kartalar */}
        {departments.map((department, index) => {
          const pos = getPosition(index);
          const hasJobs = department.activeJobsCount > 0;

          return (
            <div
              key={department.id}
              className="absolute z-20 transition-all duration-700"
              style={{
                top: "50%",
                left: "50%",
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                width: `${cardWidth}px`,
              }}
            >
              <div
                className={`group w-full bg-white border rounded-[2rem] px-4 py-4 text-left hover:scale-[1.04] transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer ${
                  hasJobs
                    ? "border-emerald-200 hover:border-emerald-400"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                onClick={() =>
                  navigate(`/reviewer_department/${department.id}?date=${selectedDate}`)
                }
              >
                {/* Nom */}
                <h3
                  className={`font-black text-base leading-tight break-words mb-0.5 transition-colors ${
                    hasJobs
                      ? "text-gray-900 group-hover:text-emerald-600"
                      : "text-gray-700 group-hover:text-gray-900"
                  }`}
                >
                  {department.departmentShortName}
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed break-words mb-3">
                  {department.departmentFullName}
                </p>

                {/* Divider */}
                <div className="w-full h-px bg-gray-100 mb-3" />

{/* Divider */}
<div className="w-full h-px bg-gray-100 mb-3" />

{/* ✅ Statistika */}
<div className="space-y-2">
  {/* Vazifalar */}
  <div className="flex items-center gap-2">
    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
      Vazifalar:
    </span>
    <span className={`text-sm font-black ${hasJobs ? "text-emerald-600" : "text-gray-400"}`}>
      {department.activeJobsCount}
    </span>
  </div>

  {/* Ishchilar */}
  <div className="flex items-center gap-1.5 flex-wrap">
    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">
      Ishchilar:
    </span>
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
    <span className="text-sm font-black text-blue-600">
      {department.departmentWorkersCount}
    </span>
    <span className="text-gray-300">/</span>
    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
    <span className="text-sm font-black text-emerald-600">
      {department.mobilizedWorkers}
    </span>
  </div>
</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-gray-900 p-6 overflow-x-hidden">
      <div className="max-w-[3400px] mx-auto">
        {/* Navbar */}
        <div className="flex justify-between items-center bg-white border border-gray-200 p-5 rounded-2xl mb-10 shadow">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/reviewer_main?date=${selectedDate}`)}
              className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-gray-700 transition-all"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MSM Dashboard</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">
                Vazifalarni boshqarish sahifasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right border-r border-gray-300 pr-4">
              <p className="text-base font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-emerald-600 uppercase font-black">
                {user?.role || "Reviewer"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-600">Sana:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 bg-white text-gray-700 font-medium"
              />
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white px-5 py-2.5 rounded-2xl transition-all text-sm font-bold"
            >
              Chiqish
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center mt-10 text-gray-500">Yuklanmoqda...</div>
        ) : (
          <main>{renderGraph()}</main>
        )}
      </div>
    </div>
  );
}