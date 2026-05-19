import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fullscreen change listener — agar foydalanuvchi Esc bossa ham state yangilansin
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
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

  const buildTimeParam = useCallback(() => {
    return `${selectedDate} ${getCurrentTime()}:00.000`;
  }, [selectedDate]);

  const fetchDepartments = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const tk = localStorage.getItem("token");
      const timeParam = buildTimeParam();

      // 2 ta parallel request — N+1 o'rniga
      const [depRes, statsRes] = await Promise.all([
        axios.get(`${BASE_URL}/Department/GetAllDepartments`, {
          params: { time: timeParam },
          headers: { Authorization: `Bearer ${tk}` },
        }),
        axios.get(`${BASE_URL}/Department/GetAllDepartmentStatistics`, {
          params: { date: timeParam },
          headers: { Authorization: `Bearer ${tk}` },
        }),
      ]);

      // statsni id bo'yicha map qilib olish — O(1) lookup
      const statsMap = {};
      for (const s of statsRes.data.content || []) {
        statsMap[s.departmentId] = s;
      }

      const departmentsWithStats = (depRes.data.content || []).map((dep) => {
        const stats = statsMap[dep.id] || {};
        return {
          ...dep,
          activeJobsCount: stats.activeJobsCount ?? 0,
          mobilizedWorkers: stats.mobilizedWorkers ?? 0,
          departmentWorkersCount: stats.departmentWorkersCount ?? 0,
        };
      });

      setDepartments(departmentsWithStats);
    } catch (error) {
      console.error("Departmentlarni olishda xatolik:", error);
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  }, [selectedDate, token, buildTimeParam]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // fetchDepartments va selectedDate ni ref da saqlash
  // SignalR handler stale closure bo'lmasin
  const fetchRef = useRef(fetchDepartments);
  useEffect(() => { fetchRef.current = fetchDepartments; }, [fetchDepartments]);

  const selectedDateRef = useRef(selectedDate);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  // Connection faqat token o'zgarganda bir marta ochiladi
  useEffect(() => {
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL.replace("/api", "")}/jobHub`, {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    connection.on("JobChanged", (data) => {
      if (data.date === selectedDateRef.current) {
        fetchRef.current();
      }
    });

    connection
      .start()
      .then(() => console.log("SignalR connected"))
      .catch((err) => console.error("SignalR ulanish xatosi:", err));

    return () => {
      connection.stop().catch((err) =>
        console.error("SignalR stop xatosi:", err)
      );
    };
  }, [token]); // faqat token — selectedDate va fetchDepartments dependency da yo'q

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen xatosi:", err);
    }
  };

  const renderGraph = () => {
    const total = departments.length;
    const hasAnyJobs = departments.some((d) => d.activeJobsCount > 0);

    // Fullscreen rejimida oyna o'lchami butun ekran bo'ladi
    const vw = windowSize.width;
    const vh = isFullscreen ? windowSize.height : windowSize.height - 120;

    const cardWidth = Math.max(140, Math.min(260, vw * 0.145));
    const centerSize = Math.max(200, Math.min(300, vw * 0.15));

    const minR = centerSize / 2 + cardWidth + 30;
    const radiusX = Math.max(
      minR,
      Math.min(vw * 0.36, total > 10 ? 620 : 500)
    );
    const radiusY = Math.max(
      minR * 0.6,
      Math.min(vh * 0.36, total > 10 ? 340 : 280)
    );

    const getPosition = (index) => {
      const angle = ((360 / total) * index - 90) * (Math.PI / 180);
      return {
        x: Math.cos(angle) * radiusX,
        y: Math.sin(angle) * radiusY,
      };
    };

    const graphHeight = isFullscreen ? "100vh" : "calc(100vh - 120px)";

    return (
      <div
        className="relative w-full flex items-center justify-center overflow-hidden"
        style={{ height: graphHeight }}
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

        {/* Markaz */}
        <div
          className={`relative z-30 bg-white border-4 rounded-[3rem] flex items-center justify-center transition-all duration-500 ${
            hasAnyJobs
              ? "border-emerald-500 pulse-glow"
              : "border-gray-400"
          }`}
          style={{ width: `${centerSize}px`, height: `${centerSize}px` }}
        >
          <div className="text-center px-6">
            <div className="text-6xl font-black text-gray-900 tracking-tight">
              MSM
            </div>
            <div className="w-20 h-1 bg-gray-300 rounded-full mx-auto my-4" />
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
                className={`group w-full bg-white border rounded-[2rem] text-left hover:scale-[1.04] transition-all duration-300 shadow-lg hover:shadow-2xl cursor-pointer ${
                  hasJobs
                    ? "border-emerald-200 hover:border-emerald-400"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                style={{
                  padding: `${Math.max(10, Math.min(18, vw * 0.009))}px ${Math.max(12, Math.min(20, vw * 0.011))}px`,
                }}
                onClick={() =>
                  navigate(
                    `/reviewer_department/${department.id}?date=${selectedDate}&time=${encodeURIComponent(buildTimeParam())}`
                  )
                }
              >
                <h3
                  className={`font-black leading-tight break-words mb-0.5 transition-colors ${
                    hasJobs
                      ? "text-gray-900 group-hover:text-emerald-600"
                      : "text-gray-700 group-hover:text-gray-900"
                  }`}
                  style={{ fontSize: `${Math.max(11, Math.min(18, vw * 0.011))}px` }}
                >
                  {department.departmentShortName}
                </h3>
                <p
                  className="text-gray-500 leading-relaxed break-words mb-3"
                  style={{ fontSize: `${Math.max(9, Math.min(13, vw * 0.008))}px` }}
                >
                  {department.departmentFullName}
                </p>

                <div className="w-full h-px bg-gray-100 mb-3" />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-gray-400 uppercase font-bold tracking-wide"
                      style={{ fontSize: `${Math.max(8, Math.min(11, vw * 0.007))}px` }}
                    >
                      Vazifalar:
                    </span>
                    <span
                      className={`font-black ${hasJobs ? "text-emerald-600" : "text-gray-400"}`}
                      style={{ fontSize: `${Math.max(11, Math.min(16, vw * 0.01))}px` }}
                    >
                      {department.activeJobsCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-gray-400 uppercase font-bold tracking-wide"
                      style={{ fontSize: `${Math.max(8, Math.min(11, vw * 0.007))}px` }}
                    >
                      Ishchilar:
                    </span>
                    <span
                      className="inline-block rounded-full bg-blue-500 flex-shrink-0"
                      style={{
                        width: `${Math.max(8, Math.min(12, vw * 0.007))}px`,
                        height: `${Math.max(8, Math.min(12, vw * 0.007))}px`,
                      }}
                    />
                    <span
                      className="font-black text-blue-600"
                      style={{ fontSize: `${Math.max(11, Math.min(16, vw * 0.01))}px` }}
                    >
                      {department.departmentWorkersCount ?? 0}
                    </span>
                    <span className="text-gray-300">/</span>
                    <span
                      className="inline-block rounded-full bg-emerald-500 flex-shrink-0"
                      style={{
                        width: `${Math.max(8, Math.min(12, vw * 0.007))}px`,
                        height: `${Math.max(8, Math.min(12, vw * 0.007))}px`,
                      }}
                    />
                    <span
                      className="font-black text-emerald-600"
                      style={{ fontSize: `${Math.max(11, Math.min(16, vw * 0.01))}px` }}
                    >
                      {department.mobilizedWorkers}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Fullscreen rejimida pastki o'ng burchakda mini-panel */}
        {isFullscreen && (
          <div className="absolute bottom-6 right-6 z-40 flex items-center gap-3">
            {/* Sana */}
            <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-none outline-none bg-transparent text-gray-700 font-semibold text-sm"
              />
            </div>

            {/* Exit fullscreen tugmasi */}
            <button
              onClick={toggleFullscreen}
              title="Fullscreendan chiqish"
              className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl p-2.5 shadow-lg hover:bg-gray-100 transition-all"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-[#f5f7fa] text-gray-900 overflow-x-hidden"
      style={{ padding: isFullscreen ? 0 : "1.5rem" }}
    >
      <div className="max-w-[3400px] mx-auto">
        {/* Navbar — faqat fullscreen bo'lmaganda ko'rinadi */}
        {!isFullscreen && (
          <div className="flex justify-between items-center bg-white border border-gray-200 p-5 rounded-2xl mb-10 shadow">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Metallurgiya Servis Markazi
                </h1>
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

              {/* Fullscreen tugmasi */}
              <button
                onClick={toggleFullscreen}
                title="Fullscreen"
                className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 px-3 py-2.5 rounded-2xl transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>

              <button
                onClick={handleLogout}
                className="bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white px-5 py-2.5 rounded-2xl transition-all text-sm font-bold"
              >
                Chiqish
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center mt-10 text-gray-500">Yuklanmoqda...</div>
        ) : (
          <main>{renderGraph()}</main>
        )}
      </div>
    </div>
  );
}