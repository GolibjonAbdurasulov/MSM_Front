import React, { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import axios from "axios";
import { BASE_URL } from "../services/api.js";
let connection = null; 

export default function ReviewerMainPage() {
  const [services, setServices] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [view, setView] = useState("graph");
  const [loading, setLoading] = useState(false);
const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user"); // Foydalanuvchi ma'lumotini o'chirish
    window.location.href = "/";      // Login sahifasiga qaytarish
  };
  // 1. Ma'lumotlarni yuklash funksiyasi
  const fetchData = async () => {
    try {
      const [servRes, tasksRes] = await Promise.all([
        axios.get(`${BASE_URL}/Service/getall`),
        axios.get(`${BASE_URL}/ServiceTask/getall`)
      ]);
      setServices(servRes.data);
      setAllTasks(tasksRes.data);
    } catch (err) {
      console.error("Xatolik:", err);
    }
  };

  
  useEffect(() => {
    fetchData();

    // Faqat bir marta ulanish yaratish
    if (!connection) {
      connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5000/monitoringHub", {
          skipNegotiation: true, // Negotiation bosqichini o'tkazib yuborish
          transport: signalR.HttpTransportType.WebSockets // To'g'ridan-to'g'ri WebSocket
        })
        .withAutomaticReconnect()
        .build();
    }

    const startSignalR = async () => {
      if (connection.state === signalR.HubConnectionState.Disconnected) {
        try {
          await connection.start();
          console.log("SignalR ulandi!");
          
          // Xabarni tinglash
          connection.off("UpdateTasks"); // Eskilarini tozalash
          connection.on("UpdateTasks", () => {
            fetchData();
          });
        } catch (err) {
          console.log("Ulanish kutilmoqda...");
        }
      }
    };

    startSignalR();

    // Cleanup qismida stop() qilmaslik tavsiya etiladi (Strict Mode uchun)
    // Faqat xabarni o'chirish kifoya
    return () => {
      if (connection) {
        connection.off("UpdateTasks");
      }
    };
  }, []);



  // 3. Status Logikasi (Siz so'ragan ranglar)
  const getServiceStatus = (serviceId) => {
    const serviceTasks = allTasks.filter(t => t.serviceId === serviceId);
    
    // Agar birorta bajarilmagan ish bo'lsa (Status: 4) -> Qizil
    if (serviceTasks.some(t => t.status === 4)) return "bg-red-600 shadow-[0_0_15px_#dc2626]";
    
    // Ish bajarilayotgan bo'lsa (Status: 1, 2) -> Ko'k yonib o'chadi
    if (serviceTasks.some(t => t.status === 1 || t.status === 2)) return "bg-blue-500 animate-pulse shadow-[0_0_15px_#3b82f6]";
    
    // Ish yo'q bo'lsa -> Yashil yonib o'chadi
    return "bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]";
  };

  const getMSMStyle = () => {
    // Agar hamma joyda ishlar tugagan bo'lsa -> Yashil
    // Birorta joyda ish ketsa -> Ko'k
    const isAnyActive = allTasks.some(t => t.status === 1 || t.status === 2);
    const isAnyError = allTasks.some(t => t.status === 4);

    if (isAnyError) return "border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.3)]";
    if (isAnyActive) return "border-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.4)]";
    return "border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.3)]";
  };

const renderGraph = () => {
  const gapX = 440;      
  const gapY = 280;      
  const blockWidth = 230;  // Hajm ixcham
  const blockHeight = 140; // Balandlik biroz oshirildi matn sig'ishi uchun

  const positions = [
    { x: -gapX, y: -gapY }, { x: 0, y: -gapY }, { x: gapX, y: -gapY }, 
    { x: -gapX, y: 0 },                         { x: gapX, y: 0 },    
    { x: -gapX, y: gapY },  { x: 0, y: gapY },  { x: gapX, y: gapY }  
  ];

  return (
    <div className="relative w-full h-[850px] flex items-center justify-center overflow-hidden">
      
      {/* 1. SVG Chiziqlar */}
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
              <circle cx={`calc(50% + ${pos.x}px)`} cy={`calc(50% + ${pos.y}px)`} r="4" fill="#10b981" />
            </g>
          );
        })}
      </svg>

      {/* 2. Markaziy MSM HUB */}
      <div className="relative z-30 w-52 h-52 bg-[#1e293b] border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.3)] rounded-[2.5rem] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-black text-white tracking-tighter">MSM</div>
          <p className="mt-2 text-[11px] text-white font-bold uppercase tracking-[0.4em]">Metallurgiya Service Markazi</p>
        </div>
      </div>

      {/* 3. Servis Bloklari - KATTA MATN BILAN */}
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
              className="w-full h-[140px] group bg-[#1e293b]/95 backdrop-blur-2xl border-2 border-white/10 p-5 rounded-[1.8rem] hover:border-emerald-500 hover:bg-emerald-500/10 transition-all shadow-2xl text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  {/* Sarlavha: text-lg va font-black (juda qalin) qilindi */}
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors uppercase leading-none tracking-tight">
                    {service.name}
                  </h3>
                  <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                </div>
                <div className="w-12 h-1 bg-emerald-500/40 group-hover:w-full transition-all duration-500 rounded-full"></div>
              </div>
              
              {/* Tavsif: text-[12px] va font-bold qilindi */}
              <p className="text-[12px] text-slate-300 leading-tight font-bold uppercase opacity-90 line-clamp-2">
                {service.description || "XIZMAT TAVSIFI"}
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
