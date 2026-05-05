import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../services/api.js";

export default function WorkersPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [saving, setSaving] = useState(false);

  const [newWorker, setNewWorker] = useState({
    fullName: "", personnelNumber: "", position: "",
  });

  // Barcha workerlarni yuklash
  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/Worker/GetDepartmentAllWorkersById`, {
        params: { id: user.departmentId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkers(res.data.content || []);
    } catch (err) {
      console.error("Workerlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, [user.departmentId, token]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Qidirish
  const handleSearch = async (query) => {
    setSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    try {
      setIsSearching(true);
      const res = await axios.get(`${BASE_URL}/Worker/SearchWorkers`, {
        params: { departmentId: user.departmentId, query },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data.content || []);
    } catch (err) {
      console.error("Qidirishda xatolik:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const displayedWorkers = search.length >= 2 ? searchResults : workers;

  // Create
  const handleCreate = async () => {
    try {
      setSaving(true);
      await axios.post(`${BASE_URL}/Worker/CreateWorker`, {
        departmentId: user.departmentId,
        personnelNumber: Number(newWorker.personnelNumber),
        fullName: newWorker.fullName,
        position: newWorker.position,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNewWorker({ fullName: "", personnelNumber: "", position: "" });
      setShowCreateModal(false);
      fetchWorkers();
    } catch (err) {
      alert("Worker yaratib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  // Update
  const handleUpdate = async () => {
    try {
      setSaving(true);
      await axios.put(`${BASE_URL}/Worker/UpdateWorker`, {
        id: selectedWorker.workerId,
        personnelNumber: Number(selectedWorker.personnelNumber),
        fullName: selectedWorker.fullName,
        position: selectedWorker.position,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditModal(false);
      setSelectedWorker(null);
      fetchWorkers();
    } catch (err) {
      alert("Workereni yangilab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    try {
      setSaving(true);
      await axios.delete(`${BASE_URL}/Worker/DeleteWorker`, {
        params: { id: selectedWorker.workerId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false);
      setShowEditModal(false);
      setSelectedWorker(null);
      fetchWorkers();
    } catch (err) {
      alert("Workerni o'chirib bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6 text-gray-900">
      <div className="max-w-[1800px] mx-auto">

        {/* Sidebar overlay */}
        {showSidebar && (
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowSidebar(false)} />
        )}

        {/* Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="px-6 py-6 border-b border-gray-100">
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              MSM ERP
            </h2>
          </div>
          <nav className="px-4 py-6 space-y-2">
            <a href="/publisher"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all">
              <span className="text-xl">📋</span>
              <span>Vazifalar</span>
            </a>
            <a href="/workers"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-600 font-semibold transition-all">
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

          {/* Chap */}
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(true)}
              className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-gray-100 transition-all">
              <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
              <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
              <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Ishchilar
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{user?.departmentName}</p>
            </div>
          </div>

          {/* O'ng */}
          <div className="flex items-center gap-6">

            {/* Jami ishchilar */}
            <div className="text-center border-r border-gray-200 pr-6">
              <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Jami ishchilar</p>
              <p className="text-xl font-black text-emerald-600">{workers.length}</p>
            </div>

            {/* Qidirish */}
            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-2xl px-4 py-2 focus-within:border-emerald-500 bg-white">
                <span className="text-gray-400 mr-2">🔍</span>
                <input
                  type="text"
                  placeholder="Worker qidirish..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="outline-none text-sm w-52"
                />
                {search && (
                  <button onClick={() => { setSearch(""); setSearchResults([]); }}
                    className="text-gray-400 hover:text-gray-600 ml-2 font-bold">
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Yangi worker */}
            <button onClick={() => setShowCreateModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold transition-all">
              + Yangi ishchi
            </button>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 flex items-center justify-center transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 w-56 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="font-bold text-gray-900 text-sm">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-emerald-600 font-semibold uppercase">{user?.departmentName}</p>
                    </div>
                    <button onClick={() => { localStorage.clear(); window.location.href = "/"; }}
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

        {/* Workers jadval */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="col-span-1 text-xs uppercase font-black text-gray-400 tracking-widest">#</div>
            <div className="col-span-2 text-xs uppercase font-black text-gray-400 tracking-widest">Tabel №</div>
            <div className="col-span-4 text-xs uppercase font-black text-gray-400 tracking-widest">FIO</div>
            <div className="col-span-4 text-xs uppercase font-black text-gray-400 tracking-widest">Lavozim</div>
            <div className="col-span-1 text-xs uppercase font-black text-gray-400 tracking-widest"></div>
          </div>

          {/* Rows */}
          {loading ? (
            <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>
          ) : displayedWorkers.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-semibold">
              {search.length >= 2 ? "Topilmadi" : "Ishchilar mavjud emas"}
            </div>
          ) : (
            displayedWorkers.map((worker, index) => (
              <div key={worker.workerId}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-all items-center">
                <div className="col-span-1 text-sm text-gray-400 font-semibold">{index + 1}</div>
                <div className="col-span-2 text-sm font-bold text-gray-700">{worker.personnelNumber}</div>
                <div className="col-span-4 text-sm font-semibold text-gray-900">{worker.fullName}</div>
                <div className="col-span-4 text-sm text-gray-500 line-clamp-2">{worker.position}</div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => { setSelectedWorker({ ...worker }); setShowEditModal(true); }}
                    className="bg-blue-100 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all">
                    Tahrirlash
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-xl font-bold mb-6">Yangi Ishchi Yaratish</h2>
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
                <button onClick={() => { setShowCreateModal(false); setNewWorker({ fullName: "", personnelNumber: "", position: "" }); }}
                  className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">
                  Bekor qilish
                </button>
                <button onClick={handleCreate} disabled={saving}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  {saving ? "Saqlanmoqda..." : "Yaratish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedWorker && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-xl font-bold mb-6">Ishchini Tahrirlash</h2>
              <div className="space-y-4">
                <input type="text" placeholder="To'liq ismi (FIO)"
                  value={selectedWorker.fullName}
                  onChange={(e) => setSelectedWorker({ ...selectedWorker, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                />
                <input type="number" placeholder="Tabel raqam"
                  value={selectedWorker.personnelNumber}
                  onChange={(e) => setSelectedWorker({ ...selectedWorker, personnelNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                />
                <input type="text" placeholder="Lavozim"
                  value={selectedWorker.position}
                  onChange={(e) => setSelectedWorker({ ...selectedWorker, position: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-between items-center mt-6">
                <button onClick={() => setShowDeleteModal(true)} disabled={saving}
                  className="px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white font-bold transition-all">
                  O'chirish
                </button>
                <div className="flex gap-4">
                  <button onClick={() => { setShowEditModal(false); setSelectedWorker(null); }}
                    className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">
                    Bekor qilish
                  </button>
                  <button onClick={handleUpdate} disabled={saving}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
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
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">!</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Ishchini o'chirish</h2>
                  <p className="text-sm text-gray-500">Bu amalni ortga qaytarib bo'lmaydi</p>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Ishchi</p>
                <p className="font-bold text-gray-900">{selectedWorker?.fullName}</p>
                <p className="text-sm text-gray-500">{selectedWorker?.personnelNumber}</p>
              </div>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowDeleteModal(false)} disabled={saving}
                  className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">
                  Bekor qilish
                </button>
                <button onClick={handleDelete} disabled={saving}
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