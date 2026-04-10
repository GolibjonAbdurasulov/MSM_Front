  import React, { useEffect, useState, useCallback } from "react";
  import axios from "axios";
  import { BASE_URL } from "../services/api.js";
  import * as signalR from "@microsoft/signalr";

  const statusConfig = {
    Created: {
      label: "Yaratilgan",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    InProgress: {
      label: "Jarayonda",
      color: "bg-orange-100 text-orange-700 border-orange-200",
    },
    Completed: {
      label: "Tugallangan",
      color: "bg-green-100 text-green-700 border-green-200",
    },
    Failed: {
      label: "Muvaffaqiyatsiz",
      color: "bg-red-100 text-red-700 border-red-200",
    },
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

    const [newJob, setNewJob] = useState({
      title: "",
      description: "",
      startedDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    });

    const formatDate = (date) => {
      if (!date) return "-";
      return new Date(date).toLocaleString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const fetchJobs = useCallback(async () => {
      if (!user?.departmentId) return;
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/Job/GetAllJobsByDepartmentId`, {
          params: { departmentId: user.departmentId, time: new Date(selectedDate).toISOString() },
          headers: { Authorization: `Bearer ${token}` },
        });
        setJobs(response.data.content || []);
      } catch (error) {
        console.error("Joblarni olishda xatolik:", error);
      } finally {
        setLoading(false);
      }
    }, [user?.departmentId, selectedDate, token]);

    useEffect(() => {
      fetchJobs();
    }, [fetchJobs]);

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
          data.departmentId === user.departmentId &&
          data.date === selectedDate
        ) {
          fetchJobs();
        }
      });

      return () => connection.stop();
    }, [selectedDate, fetchJobs, token, user?.departmentId]);

    const handleCreateJob = async (e) => {
      e.preventDefault();
      try {
        setSaving(true);
        await axios.post(
          `${BASE_URL}/Job/CreateJob`,
          {
            title: newJob.title,
            description: newJob.description,
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
        fetchJobs();
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
      } catch (error) {
        console.error("Statusni yangilashda xatolik:", error);
        alert("Statusni yangilab bo'lmadi");
      }
    };

    const handleEditJob = async () => {
      try {
        setSaving(true);
        await axios.put(
          `${BASE_URL}/Job/UpdateJob`,
          { ...selectedJob },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setShowEditModal(false);
        setSelectedJob(null);
        fetchJobs();
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
  } catch (error) {
    console.error("Jobni o‘chirishda xatolik:", error);
    alert("Jobni o‘chirib bo‘lmadi");
  } finally {
    setSaving(false);
  }
};
    return (
      <div className="min-h-screen bg-[#f5f7fa] p-6 text-gray-900">
        <div className="max-w-[1800px] mx-auto">
          {/* Navbar */}
          <div className="bg-white border border-gray-200 rounded-3xl shadow-md px-8 py-6 mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Vazifalarni boshqarish
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-right border-r border-gray-300 pr-4">
                <p className="font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs uppercase text-emerald-600 font-black">
                  {user?.departmentName}
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
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
                className="bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white px-5 py-2.5 rounded-2xl transition-all font-bold"
              >
                Chiqish
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Yangi Job */}
            <div className="col-span-4">
              <div className="bg-white border border-gray-200 rounded-3xl shadow-md p-6 sticky top-6">
                <h2 className="text-xl font-bold mb-6">Yangi Vazifa Yaratish</h2>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder="Job sarlavhasi"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                  />
                  <textarea
                    rows={5}
                    required
                    placeholder="Job tavsifi"
                    value={newJob.description}
                    onChange={(e) =>
                      setNewJob({ ...newJob, description: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 resize-none"
                  />
                  <input
                    type="datetime-local"
                    value={newJob.startedDate}
                    onChange={(e) => setNewJob({ ...newJob, startedDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="datetime-local"
                    value={newJob.endDate}
                    onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-bold transition-all"
                  >
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
                    <div
                      key={job.id}
                      className="bg-white border border-gray-200 rounded-3xl shadow-md p-5 hover:shadow-xl transition-all"
                    >
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                          <p
                            className={`text-gray-600 leading-relaxed max-w-4xl transition-all ${
                              expandedDescriptions[job.id] ? "" : "line-clamp-3"
                            }`}
                          >
                            {job.description}
                          </p>
                          {job.description?.length > 150 && (
                            <button
                              onClick={() =>
                                setExpandedDescriptions((prev) => ({
                                  ...prev,
                                  [job.id]: !prev[job.id],
                                }))
                              }
                              className="mt-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                              {expandedDescriptions[job.id] ? "▲ Yopish" : "▼ Batafsil"}
                            </button>
                          )}
                        </div>
                        <div
                          className={`px-4 py-2 rounded-full border text-xs uppercase font-black tracking-[0.15em] ${statusConfig[job.jobStatus]?.color}`}
                        >
                          {statusConfig[job.jobStatus]?.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] mb-1">
                            Boshlanish
                          </p>
                          <p className="font-semibold text-gray-700">{formatDate(job.startedDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] mb-1">
                            Tugash
                          </p>
                          <p className="font-semibold text-gray-700">{formatDate(job.endDate)}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                        <select
                          value={job.jobStatus}
                          onChange={(e) => handleStatusChange(job, e.target.value)}
                          className="border border-gray-300 rounded-2xl px-4 py-2 outline-none focus:border-emerald-500 text-sm font-semibold"
                        >
                          <option value="Created">Yaratilgan</option>
                          <option value="InProgress">Jarayonda</option>
                          <option value="Completed">Tugallangan</option>
                          <option value="Failed">Muvaffaqiyatsiz</option>
                        </select>

                        <button
                          onClick={() => {
                            setSelectedJob({ ...job });
                            setShowEditModal(true);
                          }}
                          className="bg-blue-100 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white px-5 py-2 rounded-2xl font-bold transition-all"
                        >
                          Tahrirlash
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

  {/* Edit Modal */}
  {showEditModal && selectedJob && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Vazifani tahrirlash</h2>

        <div className="space-y-4">
          <input
            type="text"
            value={selectedJob.title}
            onChange={(e) =>
              setSelectedJob({ ...selectedJob, title: e.target.value })
            }
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
          />

          <textarea
            rows={5}
            value={selectedJob.description}
            onChange={(e) =>
              setSelectedJob({
                ...selectedJob,
                description: e.target.value,
              })
            }
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 resize-none"
          />

          <input
            type="datetime-local"
            value={selectedJob.startedDate?.slice(0, 16)}
            onChange={(e) =>
              setSelectedJob({
                ...selectedJob,
                startedDate: e.target.value,
              })
            }
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
          />

          <input
            type="datetime-local"
            value={selectedJob.endDate?.slice(0, 16)}
            onChange={(e) =>
              setSelectedJob({
                ...selectedJob,
                endDate: e.target.value,
              })
            }
            className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={saving}
            className="px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white font-bold transition-all"
          >
            O‘chirish
          </button>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedJob(null);
              }}
              className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100"
            >
              Bekor qilish
            </button>

            <button
              onClick={handleEditJob}
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Delete Modal */}
  {showDeleteModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">
            !
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Jobni o‘chirish
            </h2>
            <p className="text-sm text-gray-500">
              Bu amalni ortga qaytarib bo‘lmaydi
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
          <p className="text-xs uppercase text-gray-400 font-bold mb-1">
            Job nomi
          </p>
          <p className="font-bold text-gray-900">
            {selectedJob?.title}
          </p>
        </div>

        <p className="text-gray-600 leading-relaxed mb-8">
          Rostdan ham ushbu jobni o‘chirib tashlamoqchimisiz?
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowDeleteModal(false)}
            disabled={saving}
            className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100"
          >
            Bekor qilish
          </button>

          <button
            onClick={handleDeleteJob}
            disabled={saving}
            className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold"
          >
            {saving ? "O‘chirilmoqda..." : "Ha, o‘chirish"}
          </button>
        </div>
      </div>
    </div>
  )}
        </div>
      </div>
    );
  }