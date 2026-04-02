import React, { useState, useEffect } from "react";
import axios from "axios";

// Statuslar enumiga mos o'zbekcha nomlar
const statusNames = {
  1: { label: "Boshlandi", color: "bg-blue-500/10 border-blue-500/50 text-blue-500" },
  2: { label: "Jarayonda", color: "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" },
  3: { label: "Tugallandi", color: "bg-green-500/10 border-green-500/50 text-green-500" },
  4: { label: "Muvaffaqiyatsiz", color: "bg-red-500/10 border-red-500/50 text-red-500" }
};

export default function PublisherPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });

  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/ServiceTask/getall");
      setTasks(res.data);
    } catch (err) {
      console.error("Xatolik:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Yangi task yaratish
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/ServiceTask/create", {
        id: 0,
        title: newTask.title,
        description: newTask.description,
        publisherId: user?.id || 0,
        status: 1, // Boshlang'ich holat: Started
        createdDate: new Date().toISOString()
      });
      setNewTask({ title: "", description: "" });
      fetchTasks();
    } catch (err) {
      alert("Yaratishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Statusni o'zgartirish (Update)
  const handleStatusChange = async (task, newStatus) => {
    try {
      const updatedTask = {
        ...task,
        status: parseInt(newStatus)
      };
      // Backend [HttpPut] metodiga yuborish
      await axios.put("http://localhost:5000/api/ServiceTask/update", updatedTask);
      fetchTasks(); // Ro'yxatni yangilash
    } catch (err) {
      alert("Statusni o'zgartirib bo'lmadi");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Navbar */}
        <div className="flex justify-between items-center bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl mb-10 shadow-xl">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">MSM Publisher</h1>
          <button onClick={() => { localStorage.clear(); window.location.href="/"; }} className="bg-red-500/20 px-5 py-2 rounded-xl border border-red-500/50 font-bold">Chiqish</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl sticky top-6">
              <h2 className="text-xl font-bold mb-4">Yangi Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Sarlavha"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Tavsif"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />
                <button disabled={loading} className="w-full bg-blue-600 py-3 rounded-xl font-bold">
                  {loading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold mb-4">Topshiriqlar Ro'yxati</h2>
            {tasks.map((task) => (
              <div key={task.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400">{task.title}</h3>
                    <p className="text-slate-400 text-sm">{task.description}</p>
                  </div>
                  <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase ${statusNames[task.status]?.color}`}>
                    {statusNames[task.status]?.label || "Noma'lum"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="text-[10px] text-slate-500">
                    Sana: {new Date(task.createdDate).toLocaleDateString()}
                  </div>
                  
                  {/* Statusni o'zgartirish Selectboxi */}
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value)}
                    className="bg-slate-800 border border-white/10 text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                  >
                    <option value="1">Boshlandi</option>
                    <option value="2">Jarayonda</option>
                    <option value="3">Tugallandi</option>
                    <option value="4">Muvaffaqiyatsiz</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
