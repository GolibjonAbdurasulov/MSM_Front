import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../services/api.js";
import * as signalR from "@microsoft/signalr";

const statusUz = {
  Created: "Yangi Yaratilgan",
  InProgress: "Jarayonda",
  Completed: "Tugallandi",
  Failed: "Muvofaqqiyatsiz",
};

const statusColors = {
  Created: "bg-blue-100 border-blue-500/50 text-blue-600",
  InProgress: "bg-orange-100 border-orange-500/50 text-orange-600",
  Completed: "bg-green-100 border-green-500/50 text-green-600",
  Failed: "bg-red-100 border-red-500/50 text-red-600",
  default: "bg-gray-100 border-gray-300 text-gray-500",
};

export default function ReviewerPage() {
  const navigate = useNavigate();
  const { departmentId } = useParams();
  const [searchParams] = useSearchParams();
  const initialDate =
    searchParams.get("date") || new Date().toISOString().split("T")[0];

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // Jobs fetch function
  const fetchJobs = useCallback(async () => {
    if (!departmentId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/Job/GetAllJobsByDepartmentId`, {
        params: { departmentId, time: new Date(selectedDate).toISOString() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data.content || []);
    } catch (err) {
      console.error("Joblarni olishda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, [departmentId, selectedDate, token]);

  // Job details fetch
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

  // SignalR connection
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL.replace("/api", "")}/jobHub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => console.log("SignalR connected"))
      .catch((err) => console.error("SignalR ulanish xatosi:", err));

    connection.on("JobChanged", (data) => {
      if (
        data.departmentId === Number(departmentId) &&
        data.date === selectedDate
      ) {
        fetchJobs();
      }
    });
    connection.on("JobDeleted", async (data) => {
  if (
    data.departmentId === Number(departmentId) &&
    data.date === selectedDate
  ) {
    await fetchJobs();

    if (selectedJob?.id) {
      try {
        await axios.get(`${BASE_URL}/Job/GetJobById`, {
          params: { id: selectedJob.id },
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        setSelectedJob(null);
        setJobDetails(null);
      }
    }
  }
});

    return () => connection.stop();
  }, [departmentId, selectedDate, fetchJobs, token]);

  // Fetch jobs on date or department change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleJobClick = (job) => {
    setSelectedJob(job);
    fetchJobDetails(job.id);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const departmentName =
    jobs.length > 0 ? jobs[0].departmentName : "Department nomi mavjud emas";

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Navbar */}
        <div className="flex justify-between items-center bg-white border border-gray-200 p-5 rounded-2xl mb-10 shadow">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/reviewer_main?date=${selectedDate}`)}
              className="p-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-xl text-gray-700 transition-all"
              title="Asosiy sahifaga qaytish"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {departmentName}
              </h1>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">
                Department Jobs Overview
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

        {/* Joblar Ro'yxati */}
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
                <div
                  key={job.id}
                  className="bg-white border border-gray-200 p-5 rounded-2xl hover:bg-gray-50 transition-all shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900">
                        {job.title}
                      </h3>
                      <span
                        className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tighter inline-block border ${
                          statusColors[job.jobStatus] || statusColors.default
                        }`}
                      >
                        {statusUz[job.jobStatus] || job.jobStatus}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-1">
                      {job.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <button
                      onClick={() => handleJobClick(job)}
                      className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest"
                    >
                      Batafsil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedJob && jobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden relative">
            <div className="absolute top-4 right-4 text-[10px] text-gray-500">
              {formatDate(jobDetails.publishedDate)}
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span
                    className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tighter mb-2 inline-block border ${
                      statusColors[jobDetails.jobStatus] || statusColors.default
                    }`}
                  >
                    {statusUz[jobDetails.jobStatus] || jobDetails.jobStatus}
                  </span>
                  <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                    {jobDetails.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-500 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-gray-500 text-xs font-bold uppercase mb-2 tracking-widest">
                    Tavsif:
                  </h4>
                  <div className="max-h-72 overflow-y-auto p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {jobDetails.description || "Tavsif berilmagan."}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                      Boshlanish sanasi:
                    </h4>
                    <p className="text-gray-700 font-bold mt-1">
                      {formatDate(jobDetails.startedDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                      Tugash sanasi:
                    </h4>
                    <p className="text-gray-700 font-bold mt-1">
                      {formatDate(jobDetails.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-6">
                  <span>
                    👤 Yaratuvchi: <b>{jobDetails.publisherName}</b>
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end">
              <button
                onClick={() => setSelectedJob(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-2 rounded-xl font-bold transition-all shadow active:scale-95"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}