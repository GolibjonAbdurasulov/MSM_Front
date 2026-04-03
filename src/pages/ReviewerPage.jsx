import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Navigatsiya uchun
import axios from "axios";
import { BASE_URL } from "../services/api.js";

// Statuslar enumiga mos o'zbekcha nomlar va ranglar
const statusNames = {
  1: { label: "Boshlandi", color: "bg-blue-500/10 border-blue-500/50 text-blue-500" },
  2: { label: "Jarayonda", color: "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" },
  3: { label: "Tugallandi", color: "bg-green-500/10 border-green-500/50 text-green-500" },
  4: { label: "Muvaffaqiyatsiz", color: "bg-red-500/10 border-red-500/50 text-red-500" }
};

export default function ReviewerPage() {
  const navigate = useNavigate(); // Navigatsiya funksiyasi
  const user = JSON.parse(localStorage.getItem("user"));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    try {
      // Zavod IP manzilini tekshiring (masalan: 10.22.171.30:5166)
      const res = await axios.get(`${BASE_URL}/ServiceTask/getall`);
      setTasks(res.data);
    } catch (err) {
      console.error("Xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Navbar */}
        <div className="flex justify-between items-center bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl mb-10 shadow-xl">
          <div className="flex items-center gap-4">
            {/* ORQAGA TUGMASI */}
            <button 
              onClick={() => navigate("/reviewer_main")}
              className="p-2 bg-white/5 hover:bg-emerald-500/20 border border-white/10 rounded-xl text-emerald-400 transition-all group"
              title="Asosiy sahifaga qaytish"
            >
              <svg xmlns="http://w3.org" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-600 bg-clip-text text-transparent">
                MSM Reviewer
              </h1>
              <p className="text-slate-400 text-sm">Foydalanuvchi: {user?.fullName || user?.email}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500 border border-red-500/50 px-5 py-2 rounded-xl transition-all text-sm font-bold">
            Chiqish
          </button>
        </div>

        {/* Tasklar Ro'yxati */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Topshiriqlar Ro'yxati ({tasks.length})
          </h2>

          {loading ? (
            <div className="text-center py-20 text-slate-500">Yuklanmoqda...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-emerald-500/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-emerald-400">{task.title}</h3>
                      <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase ${statusNames[task.status]?.color || "bg-slate-500/10 border-slate-500/50 text-slate-500"}`}>
                        {statusNames[task.status]?.label || "Yangi"}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-1">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="hidden sm:block text-right">
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Sana</p>
                      <p className="text-slate-300 font-medium">{new Date(task.createdDate).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-600/50 text-emerald-400 hover:text-white px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest"
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

      {/* --- MODAL (Batafsil ko'rish) --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-tighter mb-2 inline-block border ${statusNames[selectedTask.status]?.color}`}>
                    {statusNames[selectedTask.status]?.label}
                  </span>
                  <h2 className="text-3xl font-bold text-white leading-tight">{selectedTask.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-slate-500 text-xs font-bold uppercase mb-2 tracking-widest">Tavsif:</h4>
                  <p className="text-slate-300 text-lg leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                    {selectedTask.description || "Tavsif berilmagan."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Yaratilgan sana:</h4>
                    <p className="text-slate-300 font-bold mt-1">
                      {new Date(selectedTask.createdDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">ID Raqami:</h4>
                    <p className="text-emerald-400 font-bold mt-1">
                      #{selectedTask.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-white/5 pt-6">
                  <span>👤 Publisher ID: <b>{selectedTask.publisherId}</b></span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 p-4 flex justify-end">
              <button 
                onClick={() => setSelectedTask(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95"
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
