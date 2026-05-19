import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../services/api.js";
import * as signalR from "@microsoft/signalr";

const statusUz = {
  Created:    "Yangi Yaratilgan",
  InProgress: "Jarayonda",
  Completed:  "Tugallandi",
  Failed:     "Muvofaqqiyatsiz",
};

const statusColors = {
  Created:    "bg-blue-100 border-blue-500/50 text-blue-600",
  InProgress: "bg-orange-100 border-orange-500/50 text-orange-600",
  Completed:  "bg-green-100 border-green-500/50 text-green-600",
  Failed:     "bg-red-100 border-red-500/50 text-red-600",
  default:    "bg-gray-100 border-gray-300 text-gray-500",
};

const statusBadgeConfig = {
  Created:    { label: "Yaratilgan",      color: "bg-blue-100 text-blue-700 border-blue-200" },
  InProgress: { label: "Jarayonda",       color: "bg-orange-100 text-orange-700 border-orange-200" },
  Completed:  { label: "Tugallangan",     color: "bg-green-100 text-green-700 border-green-200" },
  Failed:     { label: "Muvaffaqiyatsiz", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function ReviewerPage() {
  const navigate = useNavigate();
  const { departmentId } = useParams();
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const user  = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetails, setJobDetails]   = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [stats, setStats] = useState({
    activeJobsCount: 0, mobilizedWorkers: 0, departmentWorkersCount: 0,
  });

  // ── tab: "info" | "comments" ─────────────────────────────────
  const [activeTab, setActiveTab]         = useState("info");
  const [comments, setComments]           = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const buildTimeParam = useCallback(
    () => `${selectedDate} ${getCurrentTime()}:00.000`,
    [selectedDate]
  );

  // ── Department info ──────────────────────────────────────────
  const fetchDepartmentInfo = useCallback(async () => {
    if (!departmentId) return;
    try {
      const timeParam = buildTimeParam();
      const [deptRes, statsRes] = await Promise.all([
        axios.get(`${BASE_URL}/Department/GetDepartmentById`, {
          params: { id: departmentId },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/Department/GetDepartmentStatistics`, {
          params: { id: departmentId, date: timeParam },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setDepartmentInfo(deptRes.data.content || null);
      const s = statsRes.data.content || {};
      setStats({
        activeJobsCount:        s.activeJobsCount ?? 0,
        mobilizedWorkers:       s.mobilizedWorkers ?? 0,
        departmentWorkersCount: s.departmentWorkersCount ?? 0,
      });
    } catch (err) {
      console.error("Department info xatolik:", err);
    }
  }, [departmentId, selectedDate, token, buildTimeParam]);

  // ── Jobs ─────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    if (!departmentId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/Job/GetAllJobsByDepartmentId`, {
        params: { departmentId, time: buildTimeParam() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data.content || []);
    } catch (err) {
      console.error("Joblarni olishda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, [departmentId, selectedDate, token, buildTimeParam]);

  // ── Job details ──────────────────────────────────────────────
  const fetchJobDetails = async (jobId) => {
    try {
      const res = await axios.get(`${BASE_URL}/Job/GetJobById`, {
        params: { id: jobId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobDetails(res.data.content || null);
    } catch (err) {
      console.error("Job batafsil ma'lumotini olishda xatolik:", err);
    }
  };

  // ── Comments ─────────────────────────────────────────────────
  const fetchComments = async (jobId) => {
    try {
      setCommentsLoading(true);
      const res = await axios.get(`${BASE_URL}/Comment/GetCommentByJobId`, {
        params: { jobId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(res.data.content || []);
    } catch (err) {
      console.error("Commentlarni olishda xatolik:", err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // ── Open job modal ───────────────────────────────────────────
  const handleJobClick = (job) => {
    setSelectedJob(job);
    setActiveTab("info");
    setComments([]);
    fetchJobDetails(job.id);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "comments" && selectedJob) {
      fetchComments(selectedJob.id);
    }
  };

  // ── Lifecycle ────────────────────────────────────────────────
  useEffect(() => { fetchDepartmentInfo(); }, [fetchDepartmentInfo]);
  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL.replace("/api", "")}/jobHub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.start().catch((err) => console.error("SignalR ulanish xatosi:", err));

    connection.on("JobChanged", (data) => {
      if (data.departmentId === Number(departmentId) && data.date === selectedDate) {
        fetchJobs(); fetchDepartmentInfo();
      }
    });

    connection.on("JobDeleted", async (data) => {
      if (data.departmentId === Number(departmentId) && data.date === selectedDate) {
        await fetchJobs(); fetchDepartmentInfo();
        if (selectedJob?.id) {
          try {
            await axios.get(`${BASE_URL}/Job/GetJobById`, {
              params: { id: selectedJob.id },
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch {
            setSelectedJob(null); setJobDetails(null);
          }
        }
      }
    });

    return () => connection.stop();
  }, [departmentId, selectedDate, fetchJobs, fetchDepartmentInfo, token]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("uz-UZ", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f7fa] text-gray-900 p-6 overflow-x-hidden">
      <div className="max-w-[1800px] mx-auto">

        {/* Navbar */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-md px-6 py-5 mb-8 flex justify-between items-center gap-3 flex-nowrap">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/reviewer_main?date=${selectedDate}`)}
              className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-gray-700 transition-all"
            >←</button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                {departmentInfo?.departmentShortName || "Department"}
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {departmentInfo?.departmentFullName || ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 border-r border-gray-200 pr-4">
              <div className="text-center">
                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Vazifalar</p>
                <p className={`text-xl font-black ${stats.activeJobsCount > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                  {stats.activeJobsCount}
                </p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Ishchilar</p>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span className="text-xl font-black text-blue-600">{stats.departmentWorkersCount ?? 0}</span>
                  <span className="text-gray-300 font-bold">/</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-xl font-black text-emerald-600">{stats.mobilizedWorkers}</span>
                </div>
              </div>
            </div>

            <div className="text-right border-r border-gray-300 pr-4">
              <p className="text-base font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-emerald-600 uppercase font-black">{user?.role || "Reviewer"}</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-600">Sana:</label>
              <input type="date" value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 bg-white text-gray-700 font-medium"
              />
            </div>

            <button onClick={handleLogout}
              className="bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white px-5 py-2.5 rounded-2xl transition-all font-bold">
              Chiqish
            </button>
          </div>
        </div>

        {/* Jobs list */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-6 text-gray-700">
            Bajarilishi kerak bo'lgan vazifalar ro'yxati ({jobs.length})
          </h2>

          {loading ? (
            <div className="text-center py-20 text-gray-500">Yuklanmoqda...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-16 text-center text-gray-500 shadow-sm">
              Ushbu sana uchun vazifalar mavjud emas
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {jobs.map((job) => (
                <div key={job.id}
                  className="bg-white border border-gray-200 p-5 rounded-2xl hover:bg-gray-50 transition-all shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tighter inline-block border ${statusColors[job.jobStatus] || statusColors.default}`}>
                        {statusUz[job.jobStatus] || job.jobStatus}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-1">{job.description}</p>
                  </div>
                  <button onClick={() => handleJobClick(job)}
                    className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest">
                    Batafsil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Job detail modal ── */}
      {selectedJob && jobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden relative flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="p-6 pb-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tighter mb-2 inline-block border ${statusColors[jobDetails.jobStatus] || statusColors.default}`}>
                    {statusUz[jobDetails.jobStatus] || jobDetails.jobStatus}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{jobDetails.title}</h2>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(jobDetails.publishedDate)}</p>
                </div>
                <button onClick={() => { setSelectedJob(null); setJobDetails(null); setComments([]); }}
                  className="text-gray-500 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition-colors flex-shrink-0">
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-4">
                <button
                  onClick={() => handleTabChange("info")}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "info"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}>
                  Ma'lumot
                </button>
                <button
                  onClick={() => handleTabChange("comments")}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === "comments"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}>
                  Izohlar
                  {comments.length > 0 && (
                    <span className="bg-indigo-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-black">
                      {comments.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab content — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">

              {/* ── Info tab ── */}
              {activeTab === "info" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-gray-500 text-xs font-bold uppercase mb-2 tracking-widest">Tavsif</h4>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <p className="text-gray-700 text-base leading-relaxed">
                        {jobDetails.description || "Tavsif berilmagan."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                      <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Boshlanish</h4>
                      <p className="text-gray-700 font-bold text-sm">{formatDate(jobDetails.startedDate)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                      <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Tugash</h4>
                      <p className="text-gray-700 font-bold text-sm">{formatDate(jobDetails.endDate)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                      <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ishchilar</h4>
                      <p className="text-gray-700 font-bold text-sm">
                        {jobDetails.mobilizedWorkers?.length ?? 0} nafar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
                    <span>👤 Yaratuvchi: <b>{jobDetails.publisherName}</b></span>
                  </div>
                </div>
              )}

              {/* ── Comments tab ── */}
              {activeTab === "comments" && (
                <div>
                  {commentsLoading ? (
                    <div className="text-center py-12 text-gray-400 text-sm">Yuklanmoqda...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-3">💬</div>
                      <p className="text-sm font-semibold">Hozircha izohlar yo'q</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {[...comments].reverse().map((c) => (
                        <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                          <p className="text-sm text-gray-800 leading-relaxed mb-2">{c.message}</p>

                          {/* Status o'zgarishi */}
                          {c.fromStatus !== c.toStatus && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${statusBadgeConfig[c.fromStatus]?.color ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                {statusBadgeConfig[c.fromStatus]?.label ?? c.fromStatus}
                              </span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${statusBadgeConfig[c.toStatus]?.color ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                {statusBadgeConfig[c.toStatus]?.label ?? c.toStatus}
                              </span>
                            </div>
                          )}

                          <p className="text-[10px] text-gray-400">{formatDate(c.publishedDate)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 flex justify-end flex-shrink-0">
              <button
                onClick={() => { setSelectedJob(null); setJobDetails(null); setComments([]); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-2 rounded-xl font-bold transition-all">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}