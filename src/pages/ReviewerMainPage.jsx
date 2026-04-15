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
  const handleResize = () => setWindowSize({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // Agar user yoki token bo'lmasa login sahifasiga yuborish
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

  // Departamentlarni olish funksiyasi
  const fetchDepartments = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
const res = await axios.get(
  `${BASE_URL}/Department/GetAllDepartments`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      const departmentsWithCounts = await Promise.all(
        (res.data.content || []).map(async (department) => {
          try {
            const countRes = await axios.get(
              `${BASE_URL}/Job/GetDepartmentActiveJobsCount`,
              {
                params: {
                  departmentId: department.id,
                  time: new Date(selectedDate).toISOString(),
                },
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            return {
              ...department,
              activeJobsCount: countRes.data.content || 0,
            };
          } catch (err) {
            console.error("Count olishda xatolik:", err);
            return {
              ...department,
              activeJobsCount: 0,
            };
          }
        })
      );

      setDepartments(departmentsWithCounts);
    } catch (error) {
      console.error("Departmentlarni olishda xatolik:", error);

      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, token]);

  // Initial fetch
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
    if (data.date === selectedDate) {
      fetchDepartments();
    }
  });

  return () => {
    connection.stop().catch((err) => console.error("SignalR stop xatosi:", err));
  };
}, [selectedDate, token, fetchDepartments]);

const renderGraph = () => {
    const total = departments.length;  // ← BIRINCHI bu
    const hasAnyJobs = departments.some(
      (department) => department.activeJobsCount > 0
    );

    const vw = windowSize.width;
    const vh = windowSize.height - 120;

    const cardWidth = Math.min(200, vw * 0.11);
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


    const containerHeight = "100vh";

    return (
<div
  className="relative w-full flex items-center justify-center overflow-hidden"
  style={{ height: "calc(100vh - 120px)" }}
>
        <style>
          {`
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
          `}
        </style>

        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {departments.map((department, index) => {
            const pos = getPosition(index);
            const hasJobs = department.activeJobsCount > 0;
            return (
              <g key={department.id}>
                <line
                  x1="50%"
                  y1="50%"
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

        <div
          className={`relative z-30 bg-white border-4 rounded-[3rem] flex items-center justify-center transition-all duration-500 ${
            hasAnyJobs ? "border-emerald-500 pulse-glow" : "border-gray-400"
          }`}
          style={{ width: `${centerSize}px`, height: `${centerSize}px` }}
        >
          <div className="text-center px-6">
            <div className="text-6xl font-black text-gray-900 tracking-tight">
              MSM
            </div>
            <div className="w-20 h-1 bg-gray-300 rounded-full mx-auto my-4"></div>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.35em] font-bold leading-relaxed">
              Metallurgiya
              <br />
              Servis Markazi
            </p>
            <div className="mt-5 text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
              {hasAnyJobs ? "Faol Vazifalar" : "Vazifalar yo'q"}
            </div>
          </div>
        </div>

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
                className={`group w-full bg-white border rounded-[2rem] px-5 py-5 text-left hover:scale-[1.04] transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer ${
                  hasJobs
                    ? "border-emerald-200 hover:border-emerald-400"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                onClick={() =>
                  navigate(
                    `/reviewer_department/${department.id}?date=${selectedDate}`
                  )
                }
              >
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-black  leading-tight transition-colors break-words text-base ${
                        hasJobs
                          ? "text-gray-900 group-hover:text-emerald-600"
                          : "text-gray-700 group-hover:text-gray-900"
                      }`}
                    >
                      {department.departmentShortName}
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">
                      Bo'limi
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed break-words">
                  {department.departmentFullName}
                </p>
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
  {/* Chap qism */}
  <div className="flex items-center gap-4">
    <button
      onClick={() => navigate(`/reviewer_main?date=${selectedDate}`)}
      className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-gray-700 transition-all"
      title="Asosiy sahifaga qaytish"
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

  {/* O‘ng qism */}
  <div className="flex items-center gap-4">
    {/* Foydalanuvchi ma'lumotlari */}
    <div className="text-right border-r border-gray-300 pr-4">
      <p className="text-base font-bold text-gray-900">
        {user?.firstName} {user?.lastName}
      </p>
      <p className="text-xs text-emerald-600 uppercase font-black">
        {user?.role || "Reviewer"}
      </p>
    </div>

    {/* Sana input */}
    <div className="flex items-center gap-3">
      <label className="text-sm font-bold text-gray-600">Sana:</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="border border-gray-300 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 bg-white text-gray-700 font-medium"
      />
    </div>

    {/* Chiqish tugmasi */}
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