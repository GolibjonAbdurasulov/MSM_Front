import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../services/api.js";
// Statuslar uchun o'zbekcha nomlar va ranglar
const statusNames = {
  1: { label: "Boshlandi", color: "bg-blue-500/10 border-blue-500/50 text-blue-500" },
  2: { label: "Jarayonda", color: "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" },
  3: { label: "Tugallandi", color: "bg-green-500/10 border-green-500/50 text-green-500" },
  4: { label: "Muvaffaqiyatsiz", color: "bg-red-500/10 border-red-500/50 text-red-500" }
};

export default function ReviewerMainPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [view, setView] = useState("graph"); 
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // 1. Sahifa yuklanganda barcha servislarni API'dan olish
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/Service/getall`);
        setServices(res.data);
      } catch (err) {
        console.error("Servislarni yuklashda xatolik:", err);
      }
    };
    fetchServices();
  }, []);

  // 2. Tanlangan servisga tegishli tasklarni olish
  const fetchTasks = async (service) => {
    setLoading(true);
    setSelectedService(service);
    try {
      // Bu yerda o'z API manzilingizni tekshiring (masalan, serviceId bo'yicha filtr)
      const res = await axios.get(`${BASE_URL}//ServiceTask/getall`);
      // Agar backend filtrlamasa, frontda filtrlaymiz:
      const filteredTasks = res.data.filter(t => t.serviceId === service.id);
      setTasks(filteredTasks);
      setView("tasks");
    } catch (err) {
      console.error("Tasklarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

const renderGraph = () => {
  // Masofalarni 43" ekran uchun optimallashtiramiz
  const gapX = 400;      
  const gapY = 260;      
  const blockWidth = 280;  // Barcha bloklar uchun bir xil kenglik
  const blockHeight = 160; // Barcha bloklar uchun bir xil balandlik

  const positions = [
    { x: -gapX, y: -gapY }, { x: 0, y: -gapY }, { x: gapX, y: -gapY }, 
    { x: -gapX, y: 0 },                         { x: gapX, y: 0 },    
    { x: -gapX, y: gapY },  { x: 0, y: gapY },  { x: gapX, y: gapY }  
  ];

  return (
    <div className="relative w-full h-[850px] flex items-center justify-center overflow-hidden">
      
      {/* 1. SVG Chiziqlar (To'g'ri ulanish) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {services.map((service, index) => {
          const pos = positions[index % positions.length];
          return (
            <g key={`line-${service.id}`}>
              <line 
                x1="50%" y1="50%" 
                x2={`calc(50% + ${pos.x}px)`} y2={`calc(50% + ${pos.y}px)`}
                stroke="rgba(16, 185, 129, 0.3)" 
                strokeWidth="2"
              />
              <circle 
                cx={`calc(50% + ${pos.x}px)`} 
                cy={`calc(50% + ${pos.y}px)`} 
                r="4" 
                fill="#10b981" 
              />
            </g>
          );
        })}
      </svg>

      {/* 2. Markaziy MSM HUB */}
      <div className="relative z-30 w-56 h-56 bg-[#1e293b] border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.3)] rounded-[2.5rem] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-black text-white tracking-tighter">MSM</div>
          <p className="mt-2 text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em]">ERP SYSTEM</p>
        </div>
      </div>

      {/* 3. Servislar (Bir xil o'lchamdagi bloklar) */}
      {services.map((service, index) => {
        const pos = positions[index % positions.length];
        
        return (
          <div 
            key={service.id}
            className="absolute transition-all duration-700 z-20"
            style={{ 
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              top: '50%',
              left: '50%',
              width: `${blockWidth}px`
            }}
          >
            <button
              onClick={() => fetchTasks(service)}
              className="w-full h-[160px] group bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all shadow-2xl text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors uppercase line-clamp-2 leading-tight">
                    {service.name}
                  </h3>
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                </div>
                <div className="w-10 h-0.5 bg-emerald-500/30 group-hover:w-full transition-all duration-500"></div>
              </div>
              
              <p className="text-[11px] text-slate-400 leading-snug font-bold uppercase opacity-70 line-clamp-3">
                {service.description || "Tavsif mavjud emas"}
              </p>
            </button>
          </div>
        );
      })}
    </div>
  );
};



  const renderTasks = () => (
    <div className="max-w-4xl mx-auto space-y-4 animate-in slide-in-from-right duration-500">
      {/* Orqaga qaytish Headeri */}
      <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
        <button 
          onClick={() => setView("graph")}
          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all"
        >
          <svg xmlns="http://w3.org" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white leading-none mb-1">{selectedService?.name}</h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Xizmat topshiriqlari ro'yxati</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-slate-500 italic">Ma'lumotlar yuklanmoqda...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <p className="text-slate-500">Ushbu servis uchun hozircha topshiriqlar mavjud emas.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="group bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-emerald-500/50">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">{task.title}</h3>
                  <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase ${statusNames[task.status]?.color}`}>
                    {statusNames[task.status]?.label}
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{task.description}</p>
              </div>
              <button 
                onClick={() => setSelectedTask(task)}
                className="bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-600/50 text-emerald-400 hover:text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
              >
                Batafsil ko'rish
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 overflow-x-hidden selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Navbar */}
        <div className="flex justify-between items-center bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl mb-10 shadow-2xl">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-600 bg-clip-text text-transparent">
              MSM ERP System
            </h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">Reviewer Control Panel</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block border-r border-white/10 pr-4">
                <p className="text-sm font-bold text-slate-300">{user?.fullName || "Reviewer"}</p>
                <p className="text-[10px] text-emerald-500 uppercase font-black">Online</p>
             </div>
             <button 
               onClick={handleLogout} 
               className="bg-red-500/10 hover:bg-red-500 border border-red-500/50 text-red-500 hover:text-white px-4 py-2 rounded-xl transition-all text-xs font-bold flex items-center gap-2"
             >
                Chiqish
                <svg xmlns="http://w3.org" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </button>
          </div>
        </div>

        {/* Asosiy Content */}
        <main className="relative">
          {view === "graph" ? renderGraph() : renderTasks()}
        </main>
      </div>
    </div>
  );
}
