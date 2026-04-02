import React, { useState, useEffect } from "react";
import axios from "axios";

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
        const res = await axios.get("http://localhost:5000/api/Service/getall");
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
      const res = await axios.get(`http://localhost:5000/api/ServiceTask/getall`);
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
  const radius = 280; // MSM markazidan servisgacha bo'lgan masofa

  return (
    <div className="relative w-full h-[700px] flex items-center justify-center">
      
      {/* 1. Markaziy MSM Hub */}
      <div className="relative z-30 w-44 h-44 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 p-1 shadow-[0_0_60px_rgba(16,185,129,0.4)] flex items-center justify-center border-4 border-[#0f172a]">
        <div className="text-center">
          <h2 className="text-4xl font-black text-white tracking-tighter">MSM</h2>
          <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest">Metallurgiya</p>
        </div>
      </div>

      {/* 2. Servislar va ularning MSM bilan ulanishi */}
      {services.map((service) => {
        const angleInRad = (service.angle - 90) * (Math.PI / 180);
        const x = Math.cos(angleInRad) * radius;
        const y = Math.sin(angleInRad) * radius;

        return (
          <React.Fragment key={service.id}>
            {/* STRELKA: Ekranning markazidan (MSM dan) chiqadi */}
            <div 
              className="absolute top-1/2 left-1/2 w-[2px] bg-gradient-to-t from-emerald-500/80 to-transparent origin-bottom z-10 pointer-events-none"
              style={{ 
                // Chiziq markazdan (top-1/2 left-1/2) boshlanib, servis tomonga buriladi
                transform: `translate(-50%, -100%) rotate(${service.angle}deg)`,
                height: `${radius - 40}px`, // Chiziq uzunligi servis blokigacha yetadi
              }}
            >
              {/* STRELKA UCHI: Chiziqning eng uchida, servisga tegib turadi */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 
                           border-l-[6px] border-l-transparent 
                           border-r-[6px] border-r-transparent 
                           border-b-[10px] border-b-emerald-500"
              ></div>
            </div>

            {/* SERVIS BLOKI */}
            <div 
              className="absolute transition-all duration-700 z-20"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <button
                onClick={() => fetchTasks(service)}
                className="group relative bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300 w-48 shadow-2xl text-left"
              >
                <h3 className="text-lg font-bold text-emerald-400 mb-1">{service.name}</h3>
                <p className="text-[9px] text-slate-400 line-clamp-2 uppercase font-medium">
                  {service.description}
                </p>
              </button>
            </div>
          </React.Fragment>
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
