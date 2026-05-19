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

const defaultCommentMessage = (fromStatus, toStatus) =>
  `Status o'zgartirildi: ${statusConfig[fromStatus]?.label ?? fromStatus} → ${statusConfig[toStatus]?.label ?? toStatus}`;

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const [commentsMap, setCommentsMap] = useState({});
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsJob, setCommentsJob] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentMessage, setNewCommentMessage] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [editCommentMessage, setEditCommentMessage] = useState("");
  const [showStatusCommentModal, setShowStatusCommentModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [statusCommentMessage, setStatusCommentMessage] = useState("");

  const [editWorkerSearch, setEditWorkerSearch] = useState("");
  const [editSearchResults, setEditSearchResults] = useState([]);
  const [editSelectedWorkers, setEditSelectedWorkers] = useState([]);
  const [editSearchLoading, setEditSearchLoading] = useState(false);
  const [showEditWorkerSearch, setShowEditWorkerSearch] = useState(false);
  const [showEditCreateWorker, setShowEditCreateWorker] = useState(false);
  const [editNewWorker, setEditNewWorker] = useState({ fullName: "", personnelNumber: "", position: "" });

  const [workerSearch, setWorkerSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [showWorkerSearch, setShowWorkerSearch] = useState(false);
  const [showCreateWorker, setShowCreateWorker] = useState(false);
  const [newWorker, setNewWorker] = useState({ fullName: "", personnelNumber: "", position: "" });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [originalWorkers, setOriginalWorkers] = useState([]);
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [stats, setStats] = useState({ activeJobsCount: 0, mobilizedWorkers: 0, departmentWorkersCount: 0 });
  const [showSidebar, setShowSidebar] = useState(false);

  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
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

  // ─── Comments ─────────────────────────────────────────────────
  const fetchCommentsByJobId = useCallback(async (jobId) => {
    try {
      setCommentsLoading(true);
      const res = await axios.get(`${BASE_URL}/Comment/GetCommentByJobId`, {
        params: { jobId },
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.content || [];
      setCommentsMap((prev) => ({ ...prev, [jobId]: list }));
      return list;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setCommentsLoading(false);
    }
  }, [token]);

  const createComment = useCallback(async ({ jobId, message, fromStatus, toStatus }) => {
    try {
      await axios.post(`${BASE_URL}/Comment/CreateComment`, {
        jobId, publisherId: user.id, message, fromStatus, toStatus,
        publishedDate: new Date().toISOString(),
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.error(err); }
  }, [token, user?.id]);

  const handleDeleteComment = async (commentId, jobId) => {
    try {
      await axios.delete(`${BASE_URL}/Comment/DeleteComment`, {
        params: { id: commentId }, headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCommentsByJobId(jobId);
    } catch (err) { console.error(err); }
  };

  const handleOpenComments = async (job) => {
    setCommentsJob(job);
    setShowCommentsModal(true);
    await fetchCommentsByJobId(job.id);
  };

  const handleAddManualComment = async () => {
    if (!newCommentMessage.trim() || !commentsJob) return;
    try {
      setCommentSaving(true);
      await createComment({
        jobId: commentsJob.id, message: newCommentMessage.trim(),
        fromStatus: commentsJob.jobStatus, toStatus: commentsJob.jobStatus,
      });
      setNewCommentMessage("");
      await fetchCommentsByJobId(commentsJob.id);
    } finally { setCommentSaving(false); }
  };

  // ─── Status ───────────────────────────────────────────────────
  const handleStatusChangeClick = (job, newStatus) => {
    if (job.jobStatus === newStatus) return;
    setPendingStatusChange({ job, newStatus });
    setStatusCommentMessage("");
    setShowStatusCommentModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { job, newStatus } = pendingStatusChange;
    try {
      setSaving(true);
      await axios.put(`${BASE_URL}/Job/UpdateJob`,
        { ...job, jobStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await createComment({
        jobId: job.id,
        message: statusCommentMessage.trim() || defaultCommentMessage(job.jobStatus, newStatus),
        fromStatus: job.jobStatus, toStatus: newStatus,
      });
      setShowStatusCommentModal(false);
      setPendingStatusChange(null);
      setStatusCommentMessage("");
      fetchJobs(); fetchDepartmentInfo();
    } catch { alert("Statusni yangilab bo'lmadi"); } finally { setSaving(false); }
  };

  // ─── Workers ──────────────────────────────────────────────────
  useEffect(() => {
    if (selectedJob?.mobilizedWorkers?.length > 0) loadJobWorkers(selectedJob.mobilizedWorkers);
    else setEditSelectedWorkers([]);
  }, [selectedJob?.id]);

  const searchEditWorkers = async (query) => {
    if (!query || query.length < 2) { setEditSearchResults([]); return; }
    try {
      setEditSearchLoading(true);
      const res = await axios.get(`${BASE_URL}/Worker/SearchWorkers`, {
        params: { departmentId: user.departmentId, query },
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditSearchResults(res.data.content || []);
    } catch { } finally { setEditSearchLoading(false); }
  };

  const loadJobWorkers = async (workerIds) => {
    try {
      const results = await Promise.all(
        workerIds.map((id) => axios.get(`${BASE_URL}/Worker/GetById`, {
          params: { id }, headers: { Authorization: `Bearer ${token}` },
        }))
      );
      const workers = results.map((r) => r.data.content).filter(Boolean);
      setEditSelectedWorkers(workers);
      setOriginalWorkers(workers);
    } catch (err) { console.error(err); }
  };

  const handleEditSelectWorker = (worker) => {
    if (!editSelectedWorkers.find((w) => w.workerId === worker.workerId))
      setEditSelectedWorkers((prev) => [...prev, worker]);
    setEditWorkerSearch(""); setEditSearchResults([]); setShowEditWorkerSearch(false);
  };

  const handleEditRemoveWorker = (workerId) =>
    setEditSelectedWorkers((prev) => prev.filter((w) => w.workerId !== workerId));

  const handleEditCreateWorker = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/Worker/CreateWorker`, {
        departmentId: user.departmentId,
        personnelNumber: Number(editNewWorker.personnelNumber),
        fullName: editNewWorker.fullName, position: editNewWorker.position,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEditSelectedWorkers((prev) => [...prev, res.data.content]);
      setEditNewWorker({ fullName: "", personnelNumber: "", position: "" });
      setShowEditCreateWorker(false);
    } catch { alert("Worker yaratib bo'lmadi"); }
  };

  const searchWorkers = async (query) => {
    if (!query || query.length < 2) { setSearchResults([]); return; }
    try {
      setSearchLoading(true);
      const res = await axios.get(`${BASE_URL}/Worker/SearchWorkers`, {
        params: { departmentId: user.departmentId, query },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data.content || []);
    } catch { } finally { setSearchLoading(false); }
  };

  const handleSelectWorker = (worker) => {
    if (!selectedWorkers.find((w) => w.workerId === worker.workerId))
      setSelectedWorkers((prev) => [...prev, worker]);
    setWorkerSearch(""); setSearchResults([]); setShowWorkerSearch(false);
  };

  const handleRemoveWorker = (workerId) =>
    setSelectedWorkers((prev) => prev.filter((w) => w.workerId !== workerId));

  const handleCreateWorker = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/Worker/CreateWorker`, {
        departmentId: user.departmentId,
        personnelNumber: Number(newWorker.personnelNumber),
        fullName: newWorker.fullName, position: newWorker.position,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedWorkers((prev) => [...prev, res.data.content]);
      setNewWorker({ fullName: "", personnelNumber: "", position: "" });
      setShowCreateWorker(false);
    } catch { alert("Worker yaratib bo'lmadi"); }
  };

  // ─── Dept & Jobs ──────────────────────────────────────────────
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);
  const buildTimeParam = useCallback(() => `${selectedDate} ${getCurrentTime()}:00.000`, [selectedDate]);

  const fetchDepartmentInfo = useCallback(async () => {
    if (!user?.departmentId) return;
    try {
      const [deptRes, statsRes] = await Promise.all([
        axios.get(`${BASE_URL}/Department/GetDepartmentById`, {
          params: { id: user.departmentId }, headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/Department/GetDepartmentStatistics`, {
          params: { id: user.departmentId, date: buildTimeParam() },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setDepartmentInfo(deptRes.data.content || null);
      const s = statsRes.data.content || {};
      setStats({
        activeJobsCount: s.activeJobsCount ?? 0,
        mobilizedWorkers: s.mobilizedWorkers ?? 0,
        departmentWorkersCount: s.departmentWorkersCount ?? 0,
      });
    } catch (err) { console.error(err); }
  }, [user?.departmentId, selectedDate, token, buildTimeParam]);

  const fetchJobs = useCallback(async () => {
    if (!user?.departmentId) return;
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/Job/GetAllJobsByDepartmentId`, {
        params: { departmentId: user.departmentId, time: buildTimeParam() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(response.data.content || []);
    } catch { } finally { setLoading(false); }
  }, [user?.departmentId, selectedDate, token, buildTimeParam]);

  useEffect(() => { fetchDepartmentInfo(); }, [fetchDepartmentInfo]);
  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL.replace("/api", "")}/jobHub`, { accessTokenFactory: () => token })
      .withAutomaticReconnect().build();
    connection.start().catch(console.error);
    connection.on("JobChanged", (data) => {
      if (data.departmentId === user.departmentId && data.date === selectedDate) {
        fetchJobs(); fetchDepartmentInfo();
      }
    });
    return () => connection.stop();
  }, [selectedDate, fetchJobs, fetchDepartmentInfo, token, user?.departmentId]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.post(`${BASE_URL}/Job/CreateJob`, {
        title: newJob.title, description: newJob.description,
        jobStatus: "Created",
        mobilizedWorkers: selectedWorkers.map((w) => w.workerId),
        publisherId: user.id, departmentId: user.departmentId,
        subDepartmentId: user.subDepartmentId,
        startedDate: newJob.startedDate, endDate: newJob.endDate,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNewJob({
        title: "", description: "",
        startedDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      });
      setSelectedWorkers([]);
      fetchJobs(); fetchDepartmentInfo();
    } catch { alert("Job yaratib bo'lmadi"); } finally { setSaving(false); }
  };

  const handleEditJob = async () => {
    try {
      setSaving(true);
      const removedWorkers = originalWorkers.filter(
        (ow) => !editSelectedWorkers.find((ew) => ew.workerId === ow.workerId)
      );
      await Promise.all(removedWorkers.map((w) =>
        axios.delete(`${BASE_URL}/Job/RemoveWorkerFromJob`, {
          params: { jobId: selectedJob.id, workerId: w.workerId },
          headers: { Authorization: `Bearer ${token}` },
        })
      ));
      await axios.put(`${BASE_URL}/Job/UpdateJob`,
        { ...selectedJob, mobilizedWorkers: editSelectedWorkers.map((w) => w.workerId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (editCommentMessage.trim()) {
        await createComment({
          jobId: selectedJob.id, message: editCommentMessage.trim(),
          fromStatus: selectedJob.jobStatus, toStatus: selectedJob.jobStatus,
        });
      }
      setShowEditModal(false); setSelectedJob(null);
      setEditSelectedWorkers([]); setOriginalWorkers([]); setEditCommentMessage("");
      fetchJobs(); fetchDepartmentInfo();
    } catch { alert("Vazifani tahrirlab bo'lmadi"); } finally { setSaving(false); }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob?.id) return;
    try {
      setSaving(true);
      await axios.delete(`${BASE_URL}/Job/DeleteJob`, {
        params: { id: selectedJob.id }, headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false); setShowEditModal(false); setSelectedJob(null);
      await fetchJobs(); fetchDepartmentInfo();
    } catch { alert("Jobni o'chirib bo'lmadi"); } finally { setSaving(false); }
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#f5f7fa] flex flex-col overflow-hidden text-gray-900">

      {/* Sidebar overlay */}
      {showSidebar && <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowSidebar(false)} />}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">MSM ERP</h2>
        </div>
        <nav className="px-3 py-3 space-y-1">
          {[
            { href: "/publisher", icon: "📋", label: "Vazifalar" },
            { href: "/workers", icon: "👷", label: "Ishchilar" },
            { href: "/reports", icon: "📊", label: "Hisobotlar va Statistika" },
            { href: "/publisher-settings", icon: "⚙️", label: "Sozlamalar" },
          ].map((item) => (
            <a key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all text-sm">
              <span>{item.icon}</span><span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* ── Navbar ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-2.5 flex justify-between items-center gap-3 flex-shrink-0">
        {/* Chap */}
        <div className="flex items-center gap-3">
          <button onClick={() => setShowSidebar(true)} className="flex flex-col gap-1 p-1.5 rounded-lg hover:bg-gray-100 transition-all">
            <span className="w-5 h-0.5 bg-gray-700 rounded-full block"></span>
            <span className="w-5 h-0.5 bg-gray-700 rounded-full block"></span>
            <span className="w-5 h-0.5 bg-gray-700 rounded-full block"></span>
          </button>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent leading-tight">
              Vazifalarni boshqarish
            </h1>
            <p className="text-[10px] text-gray-400">{departmentInfo?.departmentFullName || ""}</p>
          </div>
        </div>

        {/* O'ng */}
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-3 border-r border-gray-200 pr-3">
            <div className="text-center">
              <p className="text-[9px] uppercase text-gray-400 font-bold tracking-widest">Vazifalar</p>
              <p className={`text-base font-black leading-tight ${stats.activeJobsCount > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                {stats.activeJobsCount}
              </p>
            </div>
            <div className="w-px h-7 bg-gray-200" />
            <div className="text-center">
              <p className="text-[9px] uppercase text-gray-400 font-bold tracking-widest">Ishchilar</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-base font-black text-blue-600 leading-tight">{stats.departmentWorkersCount ?? 0}</span>
                <span className="text-gray-300 font-bold">/</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-base font-black text-emerald-600 leading-tight">{stats.mobilizedWorkers}</span>
              </div>
            </div>
          </div>

          {/* User */}
          <div className="text-right border-r border-gray-200 pr-3">
            <p className="font-bold text-gray-900 text-xs leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-[9px] uppercase text-emerald-600 font-black">{user?.departmentName}</p>
          </div>

          {/* Date */}
          <input type="date" value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 bg-white text-gray-700 font-medium text-xs"
          />

          {/* Profile */}
          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 flex items-center justify-center transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </button>
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-48 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50">
                    <p className="font-bold text-gray-900 text-xs">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase">{user?.departmentName}</p>
                  </div>
                  <button onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-red-50 text-red-600 font-semibold transition-all text-xs">
                    <span>🚪</span><span>Chiqish</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main: chap + o'ng, har biri mustaqil scroll ── */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden min-h-0">

        {/* Chap panel — job yaratish */}
        <div className="w-72 flex-shrink-0 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
            <h2 className="text-sm font-bold mb-3 text-gray-800">Yangi Vazifa Yaratish</h2>
            <form onSubmit={handleCreateJob} className="space-y-2.5">
              <input type="text" required placeholder="Sarlavha"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-sm"
              />
              <textarea rows={3} required placeholder="Tavsif"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 resize-none text-sm"
              />

              {/* Workers */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Safarbar ishchilar</label>
                {selectedWorkers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedWorkers.map((w) => (
                      <div key={w.workerId} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                        <span className="text-xs font-semibold text-emerald-700 truncate max-w-[120px]">{w.fullName}</span>
                        <button type="button" onClick={() => handleRemoveWorker(w.workerId)}
                          className="text-red-400 hover:text-red-600 font-bold text-xs leading-none ml-0.5">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <div className="flex items-center border border-gray-300 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500">
                      <span className="text-gray-400 mr-1 text-xs">🔍</span>
                      <input type="text" placeholder="Qidirish..."
                        value={workerSearch}
                        onChange={(e) => { setWorkerSearch(e.target.value); searchWorkers(e.target.value); setShowWorkerSearch(true); }}
                        onFocus={() => setShowWorkerSearch(true)}
                        className="w-full outline-none text-xs"
                      />
                    </div>
                    {showWorkerSearch && workerSearch.length >= 2 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-36 overflow-y-auto mt-0.5">
                        {searchLoading ? (
                          <div className="p-2 text-center text-gray-400 text-xs">Qidirilmoqda...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-2 text-center text-gray-400 text-xs">Topilmadi</div>
                        ) : searchResults.map((w) => (
                          <button key={w.workerId} type="button" onClick={() => handleSelectWorker(w)}
                            className="w-full text-left px-2.5 py-2 hover:bg-emerald-50 border-b border-gray-100 last:border-0">
                            <p className="font-semibold text-xs text-gray-800">{w.fullName}</p>
                            <p className="text-[10px] text-gray-400">{w.personnelNumber}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => setShowCreateWorker(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-sm transition-all">+</button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Boshlanish</label>
                <input type="datetime-local" value={newJob.startedDate}
                  onChange={(e) => setNewJob({ ...newJob, startedDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Tugash</label>
                <input type="datetime-local" value={newJob.endDate}
                  onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-xs"
                />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl font-bold transition-all text-sm">
                {saving ? "Saqlanmoqda..." : "Vazifa Yaratish"}
              </button>
            </form>
          </div>
        </div>

        {/* O'ng panel — joblar ro'yxati */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5 pr-0.5">
          {loading ? (
            <div className="text-center py-20 text-gray-400 text-sm">Yuklanmoqda...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-16 text-center text-gray-400 text-sm">
              Hozircha vazifalar mavjud emas
            </div>
          ) : jobs.map((job) => (
            <div key={job.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
              {/* Header */}
              <div className="flex justify-between items-start gap-3 mb-2.5">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{job.title}</h3>
                  <p className={`text-gray-500 text-xs leading-relaxed transition-all ${expandedDescriptions[job.id] ? "" : "line-clamp-2"}`}>
                    {job.description}
                  </p>
                  {job.description?.length > 100 && (
                    <button
                      onClick={() => setExpandedDescriptions((prev) => ({ ...prev, [job.id]: !prev[job.id] }))}
                      className="mt-0.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700">
                      {expandedDescriptions[job.id] ? "▲ Yopish" : "▼ Ko'proq"}
                    </button>
                  )}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full border text-[9px] uppercase font-black tracking-wide whitespace-nowrap flex-shrink-0 ${statusConfig[job.jobStatus]?.color}`}>
                  {statusConfig[job.jobStatus]?.label}
                </span>
              </div>

              {/* Info row */}
              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-2.5 mb-2.5">
                <div>
                  <p className="text-[9px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Boshlanish</p>
                  <p className="font-semibold text-gray-700 text-xs">{formatDate(job.startedDate)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Tugash</p>
                  <p className="font-semibold text-gray-700 text-xs">{formatDate(job.endDate)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Ishchilar</p>
                  <p className="font-semibold text-gray-700 text-xs">
                    {Array.isArray(job.mobilizedWorkers) ? job.mobilizedWorkers.length : job.mobilizedWorkers ?? 0} nafar
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center border-t border-gray-100 pt-2.5">
                <div className="flex items-center gap-2">
                  <select value={job.jobStatus}
                    onChange={(e) => handleStatusChangeClick(job, e.target.value)}
                    className="border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-500 text-xs font-semibold">
                    <option value="Created">Yaratilgan</option>
                    <option value="InProgress">Jarayonda</option>
                    <option value="Completed">Tugallangan</option>
                    <option value="Failed">Muvaffaqiyatsiz</option>
                  </select>
                  <button onClick={() => handleOpenComments(job)}
                    className="flex items-center gap-1 bg-gray-100 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 text-gray-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
                    </svg>
                    <span>Izohlar</span>
                    {commentsMap[job.id]?.length > 0 && (
                      <span className="bg-indigo-500 text-white text-[9px] rounded-full px-1.5 font-black">
                        {commentsMap[job.id].length}
                      </span>
                    )}
                  </button>
                </div>
                <button onClick={() => { setSelectedJob({ ...job }); setShowEditModal(true); }}
                  className="bg-blue-50 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all">
                  Tahrirlash
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Status comment modal ── */}
      {showStatusCommentModal && pendingStatusChange && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
            <h2 className="text-base font-bold mb-2">Status o'zgartirish</h2>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${statusConfig[pendingStatusChange.job.jobStatus]?.color}`}>
                {statusConfig[pendingStatusChange.job.jobStatus]?.label}
              </span>
              <span className="text-gray-400 text-sm">→</span>
              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${statusConfig[pendingStatusChange.newStatus]?.color}`}>
                {statusConfig[pendingStatusChange.newStatus]?.label}
              </span>
            </div>
            <label className="text-xs font-bold text-gray-600 block mb-1">
              Izoh <span className="text-gray-400 font-normal">(bo'sh qolsa avtomatik)</span>
            </label>
            <textarea rows={3}
              placeholder={defaultCommentMessage(pendingStatusChange.job.jobStatus, pendingStatusChange.newStatus)}
              value={statusCommentMessage}
              onChange={(e) => setStatusCommentMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 resize-none text-sm mb-4"
            />
            <div className="flex justify-end gap-2.5">
              <button onClick={() => { setShowStatusCommentModal(false); setPendingStatusChange(null); }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 text-sm">
                Bekor
              </button>
              <button onClick={confirmStatusChange} disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm">
                {saving ? "..." : "Tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Comments modal ── */}
      {showCommentsModal && commentsJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-base font-bold">Izohlar</h2>
                <p className="text-xs text-gray-400 mt-0.5">{commentsJob.title}</p>
              </div>
              <button onClick={() => { setShowCommentsModal(false); setCommentsJob(null); setNewCommentMessage(""); }}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-0.5">
              {commentsLoading ? (
                <div className="text-center py-8 text-gray-400 text-xs">Yuklanmoqda...</div>
              ) : (commentsMap[commentsJob.id] || []).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">Hozircha izohlar yo'q</div>
              ) : [...(commentsMap[commentsJob.id] || [])].reverse().map((c) => (
                <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-800 leading-relaxed">{c.message}</p>
                      {c.fromStatus !== c.toStatus && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase ${statusConfig[c.fromStatus]?.color}`}>
                            {statusConfig[c.fromStatus]?.label}
                          </span>
                          <span className="text-gray-400 text-[10px]">→</span>
                          <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase ${statusConfig[c.toStatus]?.color}`}>
                            {statusConfig[c.toStatus]?.label}
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{formatDate(c.publishedDate)}</p>
                    </div>
                    {c.publisherId === user.id && (
                      <button onClick={() => handleDeleteComment(c.id, commentsJob.id)}
                        className="text-red-300 hover:text-red-500 text-xs font-bold shrink-0">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="flex gap-2">
                <textarea rows={2} placeholder="Izoh yozing..."
                  value={newCommentMessage}
                  onChange={(e) => setNewCommentMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddManualComment(); } }}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 resize-none text-xs"
                />
                <button onClick={handleAddManualComment} disabled={commentSaving || !newCommentMessage.trim()}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 text-white px-3 rounded-xl font-bold transition-all text-xs self-stretch">
                  {commentSaving ? "..." : "Yuborish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Worker yaratish */}
      {showCreateWorker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <h2 className="text-base font-bold mb-3">Yangi Worker</h2>
            <div className="space-y-2.5">
              {[
                { placeholder: "To'liq ismi (FIO)", key: "fullName", type: "text" },
                { placeholder: "Tabel raqam", key: "personnelNumber", type: "number" },
                { placeholder: "Lavozim", key: "position", type: "text" },
              ].map((f) => (
                <input key={f.key} type={f.type} placeholder={f.placeholder}
                  value={newWorker[f.key]}
                  onChange={(e) => setNewWorker({ ...newWorker, [f.key]: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-sm"
                />
              ))}
            </div>
            <div className="flex justify-end gap-2.5 mt-4">
              <button onClick={() => setShowCreateWorker(false)} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 text-sm">Bekor</button>
              <button onClick={handleCreateWorker} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm">Yaratish</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold mb-3">Vazifani tahrirlash</h2>
            <div className="space-y-2.5">
              <input type="text" value={selectedJob.title}
                onChange={(e) => setSelectedJob({ ...selectedJob, title: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-sm"
              />
              <textarea rows={3} value={selectedJob.description}
                onChange={(e) => setSelectedJob({ ...selectedJob, description: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 resize-none text-sm"
              />
              {/* Workers */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Safarbar ishchilar</label>
                {editSelectedWorkers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {editSelectedWorkers.map((w) => (
                      <div key={w.workerId} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                        <span className="text-xs font-semibold text-emerald-700 truncate max-w-[140px]">{w.fullName}</span>
                        <button type="button" onClick={() => handleEditRemoveWorker(w.workerId)}
                          className="text-red-400 hover:text-red-600 font-bold text-xs leading-none">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <div className="flex items-center border border-gray-300 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500">
                      <span className="text-gray-400 mr-1 text-xs">🔍</span>
                      <input type="text" placeholder="Qidirish..."
                        value={editWorkerSearch}
                        onChange={(e) => { setEditWorkerSearch(e.target.value); searchEditWorkers(e.target.value); setShowEditWorkerSearch(true); }}
                        className="w-full outline-none text-xs"
                      />
                    </div>
                    {showEditWorkerSearch && editWorkerSearch.length >= 2 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-36 overflow-y-auto mt-0.5">
                        {editSearchLoading ? (
                          <div className="p-2 text-center text-gray-400 text-xs">Qidirilmoqda...</div>
                        ) : editSearchResults.length === 0 ? (
                          <div className="p-2 text-center text-gray-400 text-xs">Topilmadi</div>
                        ) : editSearchResults.map((w) => (
                          <button key={w.workerId} type="button" onClick={() => handleEditSelectWorker(w)}
                            className="w-full text-left px-2.5 py-2 hover:bg-emerald-50 border-b border-gray-100 last:border-0">
                            <p className="font-semibold text-xs text-gray-800">{w.fullName}</p>
                            <p className="text-[10px] text-gray-400">{w.personnelNumber}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => setShowEditCreateWorker(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold">+</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Boshlanish</label>
                  <input type="datetime-local" value={selectedJob.startedDate?.slice(0, 16)}
                    onChange={(e) => setSelectedJob({ ...selectedJob, startedDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-0.5">Tugash</label>
                  <input type="datetime-local" value={selectedJob.endDate?.slice(0, 16)}
                    onChange={(e) => setSelectedJob({ ...selectedJob, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">
                  Izoh <span className="text-gray-400 font-normal">(ixtiyoriy)</span>
                </label>
                <textarea rows={2} placeholder="Tahrirlash haqida izoh..."
                  value={editCommentMessage}
                  onChange={(e) => setEditCommentMessage(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 resize-none text-xs"
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setShowDeleteModal(true)} disabled={saving}
                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-500 border border-red-200 text-red-600 hover:text-white font-bold transition-all text-xs">
                O'chirish
              </button>
              <div className="flex gap-2.5">
                <button onClick={() => { setShowEditModal(false); setSelectedJob(null); setEditSelectedWorkers([]); setOriginalWorkers([]); setEditCommentMessage(""); }}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 text-sm">
                  Bekor
                </button>
                <button onClick={handleEditJob} disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm">
                  {saving ? "..." : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Worker yaratish */}
      {showEditCreateWorker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <h2 className="text-base font-bold mb-3">Yangi Worker</h2>
            <div className="space-y-2.5">
              {[
                { placeholder: "To'liq ismi (FIO)", key: "fullName", type: "text" },
                { placeholder: "Tabel raqam", key: "personnelNumber", type: "number" },
                { placeholder: "Lavozim", key: "position", type: "text" },
              ].map((f) => (
                <input key={f.key} type={f.type} placeholder={f.placeholder}
                  value={editNewWorker[f.key]}
                  onChange={(e) => setEditNewWorker({ ...editNewWorker, [f.key]: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-sm"
                />
              ))}
            </div>
            <div className="flex justify-end gap-2.5 mt-4">
              <button onClick={() => setShowEditCreateWorker(false)} className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 text-sm">Bekor</button>
              <button onClick={handleEditCreateWorker} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm">Yaratish</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg font-bold flex-shrink-0">!</div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Jobni o'chirish</h2>
                <p className="text-xs text-gray-400">Bu amalni ortga qaytarib bo'lmaydi</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
              <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">Job nomi</p>
              <p className="font-bold text-gray-900 text-sm">{selectedJob?.title}</p>
            </div>
            <p className="text-gray-500 text-xs mb-4">Rostdan ham ushbu jobni o'chirib tashlamoqchimisiz?</p>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowDeleteModal(false)} disabled={saving}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 text-sm">Bekor</button>
              <button onClick={handleDeleteJob} disabled={saving}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm">
                {saving ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}