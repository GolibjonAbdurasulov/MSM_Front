import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../services/api.js";
import * as signalR from "@microsoft/signalr";

const statusConfig = {
  Created: { label: "Yaratilgan", color: "bg-blue-100 text-blue-700 border-blue-200" },
  InProgress: { label: "Jarayonda", color: "bg-orange-100 text-orange-700 border-orange-200" },
  Completed: { label: "Tugallangan", color: "bg-green-100 text-green-700 border-green-200" },
  Failed: { label: "Muvaffaqiyatsiz", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function PublisherPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [editWorkerSearch, setEditWorkerSearch] = useState("");
const [editSearchResults, setEditSearchResults] = useState([]);
const [editSelectedWorkers, setEditSelectedWorkers] = useState([]);
const [editSearchLoading, setEditSearchLoading] = useState(false);
const [showEditWorkerSearch, setShowEditWorkerSearch] = useState(false);
const [showEditCreateWorker, setShowEditCreateWorker] = useState(false);
const [editNewWorker, setEditNewWorker] = useState({
  fullName: "", personnelNumber: "", position: "",
});

  const [workerSearch, setWorkerSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [showWorkerSearch, setShowWorkerSearch] = useState(false);
  const [showCreateWorker, setShowCreateWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({
    fullName: "",
    personnelNumber: "",
    position: "",
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [originalWorkers, setOriginalWorkers] = useState([]); // dastlabki holat
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [stats, setStats] = useState({ activeJobsCount: 0, mobilizedWorkers: 0 });

  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    mobilizedWorkers: 0,
    startedDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("uz-UZ", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  useEffect(() => {
  if (selectedJob?.mobilizedWorkers?.length > 0) {
    loadJobWorkers(selectedJob.mobilizedWorkers);
  } else {
    setEditSelectedWorkers([]);
  }
}, [selectedJob?.id]);

  const searchEditWorkers = async (query) => {
  if (!query || query.length < 2) {
    setEditSearchResults([]);
    return;
  }
  try {
    setEditSearchLoading(true);
    const res = await axios.get(`${BASE_URL}/Worker/SearchWorkers`, {
      params: { departmentId: user.departmentId, query },
      headers: { Authorization: `Bearer ${token}` },
    });
    setEditSearchResults(res.data.content || []);
  } catch (err) {
    console.error("Worker qidirishda xatolik:", err);
  } finally {
    setEditSearchLoading(false);
  }
};


const loadJobWorkers = async (workerIds) => {
  try {
    const results = await Promise.all(
      workerIds.map((id) =>
        axios.get(`${BASE_URL}/Worker/GetById`, {
          params: { id },
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );
    const workers = results.map((r) => r.data.content).filter(Boolean);
    setEditSelectedWorkers(workers);
    setOriginalWorkers(workers); // ✅ dastlabki holat
  } catch (err) {
    console.error("Workerlarni yuklashda xatolik:", err);
  }
};

const handleEditSelectWorker = (worker) => {
  if (!editSelectedWorkers.find((w) => w.workerId === worker.workerId)) {
    setEditSelectedWorkers((prev) => [...prev, worker]);
  }
  setEditWorkerSearch("");
  setEditSearchResults([]);
  setShowEditWorkerSearch(false);
};

const handleEditRemoveWorker = (workerId) => {
  // API ga yubormaydi — faqat local state dan o'chiradi
  setEditSelectedWorkers((prev) => prev.filter((w) => w.workerId !== workerId));
};

const handleEditCreateWorker = async () => {
  try {
    const res = await axios.post(
      `${BASE_URL}/Worker/CreateWorker`,
      {
        departmentId: user.departmentId,
        personnelNumber: Number(editNewWorker.personnelNumber),
        fullName: editNewWorker.fullName,
        position: editNewWorker.position,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const created = res.data.content;
    setEditSelectedWorkers((prev) => [...prev, created]);
    setEditNewWorker({ fullName: "", personnelNumber: "", position: "" });
    setShowEditCreateWorker(false);
  } catch (err) {
    alert("Worker yaratib bo'lmadi");
  }
};


  // Worker qidirish
const searchWorkers = async (query) => {
  if (!query || query.length < 2) {
    setSearchResults([]);
    return;
  }
  try {
    setSearchLoading(true);
    const res = await axios.get(`${BASE_URL}/Worker/SearchWorkers`, {
      params: { departmentId: user.departmentId, query },
      headers: { Authorization: `Bearer ${token}` },
    });
    setSearchResults(res.data.content || []);
  } catch (err) {
    console.error("Worker qidirishda xatolik:", err);
  } finally {
    setSearchLoading(false);
  }
};


const [showSidebar, setShowSidebar] = useState(false);
// Worker tanlash
const handleSelectWorker = (worker) => {
  if (!selectedWorkers.find((w) => w.workerId === worker.workerId)) {
    setSelectedWorkers((prev) => [...prev, worker]);
  }
  setWorkerSearch("");
  setSearchResults([]);
  setShowWorkerSearch(false);
};

// Worker o'chirish
const handleRemoveWorker = (workerId) => {
  setSelectedWorkers((prev) => prev.filter((w) => w.workerId !== workerId));
};

// Yangi worker yaratish
const handleCreateWorker = async () => {
  try {
    const res = await axios.post(
      `${BASE_URL}/Worker/CreateWorker`,
      {
        departmentId: user.departmentId,
        personnelNumber: Number(newWorker.personnelNumber),
        fullName: newWorker.fullName,
        position: newWorker.position,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const created = res.data.content;
    setSelectedWorkers((prev) => [...prev, created]);
    setNewWorker({ fullName: "", personnelNumber: "", position: "" });
    setShowCreateWorker(false);
  } catch (err) {
    console.error("Worker yaratishda xatolik:", err);
    alert("Worker yaratib bo'lmadi");
  }
};

  // Joriy vaqtni har doim real-time olish uchun getter
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  // "2026-04-21 05:33:00.000" formatini yasaydigan helper
  const buildTimeParam = useCallback(() => {
    return `${selectedDate} ${getCurrentTime()}:00.000`;
  }, [selectedDate]);

  // Department info va statistika
  const fetchDepartmentInfo = useCallback(async () => {
    if (!user?.departmentId) return;
    try {
      const timeParam = buildTimeParam();
      const [deptRes, statsRes] = await Promise.all([
        axios.get(`${BASE_URL}/Department/GetDepartmentById`, {
          params: { id: user.departmentId },
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/Department/GetDepartmentStatistics`, {
          params: { id: user.departmentId, date: timeParam },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setDepartmentInfo(deptRes.data.content || null);
      const s = statsRes.data.content || {};
      setStats({
        activeJobsCount: s.activeJobsCount ?? 0,
        mobilizedWorkers: s.mobilizedWorkers ?? 0,
      });
    } catch (err) {
      console.error("Department info xatolik:", err);
    }
  }, [user?.departmentId, selectedDate, token, buildTimeParam]);

  const fetchJobs = useCallback(async () => {
    if (!user?.departmentId) return;
    try {
      setLoading(true);
      const timeParam = buildTimeParam();
      const response = await axios.get(`${BASE_URL}/Job/GetAllJobsByDepartmentId`, {
        params: {
          departmentId: user.departmentId,
          time: timeParam,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(response.data.content || []);
    } catch (error) {
      console.error("Joblarni olishda xatolik:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.departmentId, selectedDate, token, buildTimeParam]);

  useEffect(() => {
    fetchDepartmentInfo();
  }, [fetchDepartmentInfo]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // selectedJob o'zgarganda workerlarni yuklash
useEffect(() => {
  if (selectedJob?.mobilizedWorkers) {
    // mobilizedWorkers id lar array bo'lsa
    // ularni worker obyektiga aylantirish kerak
    // Hozircha bo'sh qilamiz, quyida search orqali qo'shadi
    setEditSelectedWorkers([]);
  }
}, [selectedJob]);
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL.replace("/api", "")}/jobHub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => console.log("SignalR connected"))
      .catch((err) => console.error("SignalR ulanish xatosi:", err));

    connection.on("JobChanged", (data) => {
      if (data.departmentId === user.departmentId && data.date === selectedDate) {
        fetchJobs();
        fetchDepartmentInfo();
      }
    });

    return () => connection.stop();
  }, [selectedDate, fetchJobs, fetchDepartmentInfo, token, user?.departmentId]);

const handleCreateJob = async (e) => {
  e.preventDefault();
  try {
    setSaving(true);
    await axios.post(
      `${BASE_URL}/Job/CreateJob`,
      {
        title: newJob.title,
        description: newJob.description,
        jobStatus: "Created",
        mobilizedWorkers: selectedWorkers.map((w) => w.workerId), // ✅ id lar
        publisherId: user.id,
        departmentId: user.departmentId,
        startedDate: newJob.startedDate,
        endDate: newJob.endDate,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNewJob({
      title: "",
      description: "",
      startedDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    });
    setSelectedWorkers([]);
    fetchJobs();
    fetchDepartmentInfo();
  } catch (error) {
    console.error("Job yaratishda xatolik:", error);
    alert("Job yaratib bo'lmadi");
  } finally {
    setSaving(false);
  }
};

  const handleStatusChange = async (job, newStatus) => {
    try {
      await axios.put(
        `${BASE_URL}/Job/UpdateJob`,
        { ...job, jobStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchJobs();
      fetchDepartmentInfo();
    } catch (error) {
      console.error("Statusni yangilashda xatolik:", error);
      alert("Statusni yangilab bo'lmadi");
    }
  };

const handleEditJob = async () => {
  try {
    setSaving(true);

    // O'chirilgan workerlar
    const removedWorkers = originalWorkers.filter(
      (ow) => !editSelectedWorkers.find((ew) => ew.workerId === ow.workerId)
    );

    // Qo'shilgan workerlar
    const addedWorkers = editSelectedWorkers.filter(
      (ew) => !originalWorkers.find((ow) => ow.workerId === ew.workerId)
    );

    // O'chirilganlarni API ga yuborish
    await Promise.all(
      removedWorkers.map((w) =>
        axios.delete(`${BASE_URL}/Job/RemoveWorkerFromJob`, {
          params: { jobId: selectedJob.id, workerId: w.workerId },
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    );

    // Job ni yangilash — qo'shilgan workerlar bilan
    await axios.put(
      `${BASE_URL}/Job/UpdateJob`,
      {
        ...selectedJob,
        mobilizedWorkers: editSelectedWorkers.map((w) => w.workerId),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setShowEditModal(false);
    setSelectedJob(null);
    setEditSelectedWorkers([]);
    setOriginalWorkers([]);
    fetchJobs();
    fetchDepartmentInfo();
  } catch (error) {
    console.error("Vazifani tahrirlashda xatolik:", error);
    alert("Vazifani tahrirlab bo'lmadi");
  } finally {
    setSaving(false);
  }
};

  const handleDeleteJob = async () => {
    if (!selectedJob?.id) return;
    try {
      setSaving(true);
      await axios.delete(`${BASE_URL}/Job/DeleteJob`, {
        params: { id: selectedJob.id },
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false);
      setShowEditModal(false);
      setSelectedJob(null);
      await fetchJobs();
      fetchDepartmentInfo();
    } catch (error) {
      console.error("Jobni o'chirishda xatolik:", error);
      alert("Jobni o'chirib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

 return (
  <div className="min-h-screen bg-[#f5f7fa] p-6 text-gray-900">
    <div className="max-w-[1800px] mx-auto">

      {/* Sidebar overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => setShowSidebar(false)}
        />
      )}

{/* Sidebar */}
<div className={`fixed top-0 left-0 h-full w-90 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
  
  {/* Sidebar header — faqat logo */}
  <div className="px-6 py-6 border-b border-gray-100">
    <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
      MSM ERP
    </h2>
  </div>

  {/* Menu */}
  <nav className="px-4 py-6 space-y-2">
    <a href="/publisher"
      className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all">
      <span className="text-xl">📋</span>
      <span>Vazifalar</span>
    </a>
    <a href="/workers"
      className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all">
      <span className="text-xl">👷</span>
      <span>Ishchilar</span>
    </a>
    <a href="/reports"
      className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all">
      <span className="text-xl">📊</span>
      <span>Hisobotlar va Statistika</span>
    </a>
    <a href="/publisher-settings"
      className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all">
      <span className="text-xl">⚙️</span>
      <span>Sozlamalar</span>
    </a>
  </nav>
</div>
      {/* Navbar */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-md px-8 py-6 mb-8 flex justify-between items-center gap-4 flex-wrap">

        {/* Chap — hamburger + sarlavha */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(true)}
            className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-gray-100 transition-all">
            <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
            <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
            <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Vazifalarni boshqarish
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {departmentInfo?.departmentFullName || ""}
            </p>
          </div>
        </div>

        {/* O'ng qism */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 border-r border-gray-200 pr-6">
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
                <span className="text-xl font-black text-blue-600">{departmentInfo?.departmentWorkersCount ?? 0}</span>
                <span className="text-gray-300 font-bold">/</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-xl font-black text-emerald-600">{stats.mobilizedWorkers}</span>
              </div>
            </div>
          </div>

          <div className="text-right border-r border-gray-300 pr-4">
            <p className="font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs uppercase text-emerald-600 font-black">{user?.departmentName}</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-gray-600">Sana:</label>
            <input type="date" value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 bg-white text-gray-700 font-medium"
            />
          </div>

{/* Chiqish o'rniga Profile */}
<div className="relative">
<button
  onClick={() => setShowProfileMenu(!showProfileMenu)}
  className="w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 flex items-center justify-center transition-all">
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
  </svg>
</button>

  {/* Kichik dropdown */}
  {showProfileMenu && (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setShowProfileMenu(false)}
      />

      {/* Menu */}
      <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 w-56 overflow-hidden">
        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="font-bold text-gray-900 text-sm">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-emerald-600 font-semibold uppercase">{user?.departmentName}</p>
        </div>

        {/* Chiqish */}
        <button
          onClick={() => { localStorage.clear(); window.location.href = "/"; }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 font-semibold transition-all text-sm">
          <span>🚪</span>
          <span>Chiqish</span>
        </button>
      </div>
    </>
  )}
</div>  
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Yangi Job */}
        <div className="col-span-4">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-6">Yangi Vazifa Yaratish</h2>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <input type="text" required placeholder="Job sarlavhasi"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
              <textarea rows={5} required placeholder="Job tavsifi"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 resize-none"
              />

              {/* Worker qidirish */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Safarbar ishchilar</label>

                {selectedWorkers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedWorkers.map((w) => (
                      <div key={w.workerId}
                        className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                        <span className="text-sm font-semibold text-emerald-700">{w.fullName}</span>
                        <button type="button"
                          onClick={() => handleRemoveWorker(w.workerId)}
                          className="text-red-400 hover:text-red-600 font-bold text-xs">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="flex items-center border border-gray-300 rounded-2xl px-4 py-3 focus-within:border-emerald-500">
                      <span className="text-gray-400 mr-2">🔍</span>
                      <input type="text" placeholder="Worker qidirish..."
                        value={workerSearch}
                        onChange={(e) => {
                          setWorkerSearch(e.target.value);
                          searchWorkers(e.target.value);
                          setShowWorkerSearch(true);
                        }}
                        onFocus={() => setShowWorkerSearch(true)}
                        className="w-full outline-none text-sm"
                      />
                    </div>

                    {showWorkerSearch && workerSearch.length >= 2 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto mt-1">
                        {searchLoading ? (
                          <div className="p-3 text-center text-gray-400 text-sm">Qidirilmoqda...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-3 text-center text-gray-400 text-sm">Topilmadi</div>
                        ) : (
                          searchResults.map((w) => (
                            <button key={w.workerId} type="button"
                              onClick={() => handleSelectWorker(w)}
                              className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-100 last:border-0">
                              <p className="font-semibold text-sm text-gray-800">{w.fullName}</p>
                              <p className="text-xs text-gray-400">{w.personnelNumber} • {w.position?.slice(0, 50)}...</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button type="button"
                    onClick={() => setShowCreateWorker(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-2xl font-bold text-lg transition-all">
                    +
                  </button>
                </div>
              </div>

              <input type="datetime-local" value={newJob.startedDate}
                onChange={(e) => setNewJob({ ...newJob, startedDate: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
              <input type="datetime-local" value={newJob.endDate}
                onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
              <button type="submit" disabled={saving}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-bold transition-all">
                {saving ? "Saqlanmoqda..." : "Job Yaratish"}
              </button>
            </form>
          </div>
        </div>

        {/* Joblar */}
        <div className="col-span-8">
          <div className="space-y-5">
            {loading ? (
              <div className="text-center py-20 text-gray-500">Yuklanmoqda...</div>
            ) : jobs.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-16 text-center text-gray-500 font-semibold">
                Hozircha department uchun joblar mavjud emas
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-white border border-gray-200 rounded-3xl shadow-md p-5 hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                      <p className={`text-gray-600 leading-relaxed max-w-4xl transition-all ${expandedDescriptions[job.id] ? "" : "line-clamp-3"}`}>
                        {job.description}
                      </p>
                      {job.description?.length > 150 && (
                        <button
                          onClick={() => setExpandedDescriptions((prev) => ({ ...prev, [job.id]: !prev[job.id] }))}
                          className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                          {expandedDescriptions[job.id] ? "▲ Yopish" : "▼ Batafsil"}
                        </button>
                      )}
                    </div>
                    <div className={`px-4 py-2 rounded-full border text-xs uppercase font-black tracking-[0.15em] ${statusConfig[job.jobStatus]?.color}`}>
                      {statusConfig[job.jobStatus]?.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] mb-1">Boshlanish</p>
                      <p className="font-semibold text-gray-700">{formatDate(job.startedDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] mb-1">Tugash</p>
                      <p className="font-semibold text-gray-700">{formatDate(job.endDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] mb-1">Safarbar ishchilar</p>
                      <p className="font-semibold text-gray-700">
                        {Array.isArray(job.mobilizedWorkers) ? job.mobilizedWorkers.length : job.mobilizedWorkers ?? 0} nafar
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <select value={job.jobStatus}
                      onChange={(e) => handleStatusChange(job, e.target.value)}
                      className="border border-gray-300 rounded-2xl px-4 py-2 outline-none focus:border-emerald-500 text-sm font-semibold">
                      <option value="Created">Yaratilgan</option>
                      <option value="InProgress">Jarayonda</option>
                      <option value="Completed">Tugallangan</option>
                      <option value="Failed">Muvaffaqiyatsiz</option>
                    </select>
                    <button
                      onClick={() => { setSelectedJob({ ...job }); setShowEditModal(true); }}
                      className="bg-blue-100 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white px-5 py-2 rounded-2xl font-bold transition-all">
                      Tahrirlash
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Worker yaratish modal */}
      {showCreateWorker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold mb-6">Yangi Worker Yaratish</h2>
            <div className="space-y-4">
              <input type="text" placeholder="To'liq ismi (FIO)"
                value={newWorker.fullName}
                onChange={(e) => setNewWorker({ ...newWorker, fullName: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
              <input type="number" placeholder="Tabel raqam"
                value={newWorker.personnelNumber}
                onChange={(e) => setNewWorker({ ...newWorker, personnelNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
              <input type="text" placeholder="Lavozim"
                value={newWorker.position}
                onChange={(e) => setNewWorker({ ...newWorker, position: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button type="button"
                onClick={() => setShowCreateWorker(false)}
                className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">
                Bekor qilish
              </button>
              <button type="button" onClick={handleCreateWorker}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Vazifani tahrirlash</h2>
            <div className="space-y-4">
              <input type="text" value={selectedJob.title}
                onChange={(e) => setSelectedJob({ ...selectedJob, title: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
              <textarea rows={5} value={selectedJob.description}
                onChange={(e) => setSelectedJob({ ...selectedJob, description: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 resize-none"
              />

              {/* Worker boshqaruv */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">Safarbar ishchilar</label>

                {editSelectedWorkers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editSelectedWorkers.map((w) => (
                      <div key={w.workerId}
                        className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                        <span className="text-sm font-semibold text-emerald-700">{w.fullName}</span>
                        <button type="button"
                          onClick={() => handleEditRemoveWorker(w.workerId)}
                          className="text-red-400 hover:text-red-600 font-bold text-xs">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="flex items-center border border-gray-300 rounded-2xl px-4 py-3 focus-within:border-emerald-500">
                      <span className="text-gray-400 mr-2">🔍</span>
                      <input type="text" placeholder="Worker qidirish..."
                        value={editWorkerSearch}
                        onChange={(e) => {
                          setEditWorkerSearch(e.target.value);
                          searchEditWorkers(e.target.value);
                          setShowEditWorkerSearch(true);
                        }}
                        className="w-full outline-none text-sm"
                      />
                    </div>

                    {showEditWorkerSearch && editWorkerSearch.length >= 2 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto mt-1">
                        {editSearchLoading ? (
                          <div className="p-3 text-center text-gray-400 text-sm">Qidirilmoqda...</div>
                        ) : editSearchResults.length === 0 ? (
                          <div className="p-3 text-center text-gray-400 text-sm">Topilmadi</div>
                        ) : (
                          editSearchResults.map((w) => (
                            <button key={w.workerId} type="button"
                              onClick={() => handleEditSelectWorker(w)}
                              className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-100 last:border-0">
                              <p className="font-semibold text-sm text-gray-800">{w.fullName}</p>
                              <p className="text-xs text-gray-400">{w.personnelNumber} • {w.position?.slice(0, 50)}...</p>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <button type="button"
                    onClick={() => setShowEditCreateWorker(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-2xl font-bold text-lg">
                    +
                  </button>
                </div>
              </div>

              <input type="datetime-local" value={selectedJob.startedDate?.slice(0, 16)}
                onChange={(e) => setSelectedJob({ ...selectedJob, startedDate: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
              <input type="datetime-local" value={selectedJob.endDate?.slice(0, 16)}
                onChange={(e) => setSelectedJob({ ...selectedJob, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-between items-center mt-8">
              <button onClick={() => setShowDeleteModal(true)} disabled={saving}
                className="px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white font-bold transition-all">
                O'chirish
              </button>
              <div className="flex gap-4">
                <button onClick={() => {
                  setShowEditModal(false);
                  setSelectedJob(null);
                  setEditSelectedWorkers([]);
                  setOriginalWorkers([]);
                }}
                  className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">
                  Bekor qilish
                </button>
                <button onClick={handleEditJob} disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Worker yaratish modal */}
      {showEditCreateWorker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h2 className="text-xl font-bold mb-6">Yangi Worker Yaratish</h2>
            <div className="space-y-4">
              <input type="text" placeholder="To'liq ismi (FIO)"
                value={editNewWorker.fullName}
                onChange={(e) => setEditNewWorker({ ...editNewWorker, fullName: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
              <input type="number" placeholder="Tabel raqam"
                value={editNewWorker.personnelNumber}
                onChange={(e) => setEditNewWorker({ ...editNewWorker, personnelNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
              <input type="text" placeholder="Lavozim"
                value={editNewWorker.position}
                onChange={(e) => setEditNewWorker({ ...editNewWorker, position: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={() => setShowEditCreateWorker(false)}
                className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">
                Bekor qilish
              </button>
              <button type="button" onClick={handleEditCreateWorker}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">!</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Jobni o'chirish</h2>
                <p className="text-sm text-gray-500">Bu amalni ortga qaytarib bo'lmaydi</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
              <p className="text-xs uppercase text-gray-400 font-bold mb-1">Job nomi</p>
              <p className="font-bold text-gray-900">{selectedJob?.title}</p>
            </div>
            <p className="text-gray-600 leading-relaxed mb-8">
              Rostdan ham ushbu jobni o'chirib tashlamoqchimisiz?
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDeleteModal(false)} disabled={saving}
                className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">
                Bekor qilish
              </button>
              <button onClick={handleDeleteJob} disabled={saving}
                className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold">
                {saving ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
);
}