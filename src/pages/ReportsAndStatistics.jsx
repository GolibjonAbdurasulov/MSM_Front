import React, { useState, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../services/api.js";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";

const COLORS = {
  completed: "#10b981",
  inProgress: "#f59e0b",
  failed: "#ef4444",
  created: "#6366f1",
};

export default function ReportsAndStatistics() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searched, setSearched] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/Statistics/GetDepartmentStatisticsByDateRange`, {
        params: {
          departmentId: user.departmentId,
          startDate: `${startDate}T00:00:00`,
          endDate: `${endDate}T23:59:59`,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data.content || null);
      setSearched(true);
    } catch (err) {
      console.error("Statistika yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, user.departmentId, token]);

  // Pie chart data
  const pieData = stats ? [
    { name: "Tugallangan", value: stats.completedJobs, color: COLORS.completed },
    { name: "Jarayonda", value: stats.inProgressJobs, color: COLORS.inProgress },
    { name: "Muvaffaqiyatsiz", value: stats.failedJobs, color: COLORS.failed },
  ].filter(d => d.value > 0) : [];

  // Bar chart data
  const barData = stats ? [
    { name: "Tugallangan", soni: stats.completedJobs, fill: COLORS.completed },
    { name: "Jarayonda", soni: stats.inProgressJobs, fill: COLORS.inProgress },
    { name: "Muvaffaqiyatsiz", soni: stats.failedJobs, fill: COLORS.failed },
  ] : [];

  const handleExport = async () => {
  if (!startDate || !endDate) return;
  try {
    setExporting(true);
    const res = await axios.get(`${BASE_URL}/Statistics/Export/statistics/export`, {
      params: {
        departmentId: user.departmentId,
        fromDate: `${startDate}T00:00:00`,
        toDate: `${endDate}T23:59:59`,
      },
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob", // ← muhim!
    });

    // Yuklab olish
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hisobot_${startDate}_${endDate}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export xatolik:", err);
    alert("Hisobotni yuklab bo'lmadi");
  } finally {
    setExporting(false);
  }
};

  const completionRate = stats?.totalJobs > 0
    ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
    : 0;

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
            <a href="/publisher" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all">
              <span className="text-xl">📋</span><span>Vazifalar</span>
            </a>
            <a href="/workers" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all">
              <span className="text-xl">👷</span><span>Ishchilar</span>
            </a>
    <a href="/reports"
      className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all">
      <span className="text-xl">📊</span>
      <span>Hisobotlar va Statistika</span>
    </a>
            <a href="/publisher-settings" className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 font-semibold transition-all">
              <span className="text-xl">⚙️</span><span>Sozlamalar</span>
            </a>
          </nav>
        </div>

        {/* Navbar */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-md px-8 py-6 mb-8 flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(true)}
              className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-gray-100 transition-all">
              <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
              <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
              <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Hisobotlar va Statistika
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{user?.departmentName}</p>
            </div>
          </div>

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
                    <span>🚪</span><span>Chiqish</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sana tanlash */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-md px-8 py-6 mb-8">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Sana oralig'ini tanlang</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-600">Boshlanish:</label>
              <input type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 bg-white text-gray-700 font-medium"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-gray-600">Tugash:</label>
              <input type="date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 bg-white text-gray-700 font-medium"
              />
            </div>
            <button onClick={fetchStats} disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-2xl font-bold transition-all disabled:opacity-50">
              {loading ? "Yuklanmoqda..." : "Ko'rsatish"}
            </button>

{/* YANGI — Export tugmasi */}
<button
  onClick={handleExport}
  disabled={exporting || !startDate || !endDate}
  className="flex items-center gap-2 bg-white hover:bg-emerald-50 border-2 border-emerald-400 text-emerald-600 px-6 py-2.5 rounded-2xl font-bold transition-all disabled:opacity-50">
  {exporting ? (
    <>
      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Yuklanmoqda...
    </>
  ) : (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4 4 4-4M12 4v12" />
      </svg>
      Excel yuklab olish
    </>
  )}
</button>
          </div>
        </div>

        {/* Natijalar */}
        {!searched ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-16 text-center text-gray-400 font-semibold">
            Statistikani ko'rish uchun sana oralig'ini tanlang
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>
        ) : !stats ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-16 text-center text-gray-400 font-semibold">
            Ma'lumot topilmadi
          </div>
        ) : (
          <>
            {/* Statistika kartochkalari */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: "Jami vazifalar", value: stats.totalJobs, color: "bg-indigo-50 border-indigo-200", text: "text-indigo-600", icon: "📋" },
                { label: "Tugallangan", value: stats.completedJobs, color: "bg-emerald-50 border-emerald-200", text: "text-emerald-600", icon: "✅" },
                { label: "Jarayonda", value: stats.inProgressJobs, color: "bg-amber-50 border-amber-200", text: "text-amber-600", icon: "⏳" },
                { label: "Muvaffaqiyatsiz", value: stats.failedJobs, color: "bg-red-50 border-red-200", text: "text-red-600", icon: "❌" },
                { label: "Safarbar ishchilar", value: stats.totalMobilizedWorkers, color: "bg-blue-50 border-blue-200", text: "text-blue-600", icon: "👷" },
                { label: "Bajarilish %", value: `${completionRate}%`, color: "bg-teal-50 border-teal-200", text: "text-teal-600", icon: "📈" },
              ].map((card, i) => (
                <div key={i} className={`border rounded-3xl p-5 ${card.color}`}>
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">{card.label}</p>
                  <p className={`text-3xl font-black ${card.text}`}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* O'rtacha vaqt */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-md px-8 py-6 mb-8">
              <div className="flex items-center gap-4">
                <span className="text-4xl">⏱️</span>
                <div>
                  <p className="text-xs uppercase font-black text-gray-400 tracking-widest mb-1">O'rtacha bajarish vaqti</p>
                  <p className="text-2xl font-black text-gray-800">{stats.averageJobDuration}</p>
                </div>
              </div>
            </div>

            {/* Diagrammalar */}
            {stats.totalJobs > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pie Chart */}
                <div className="bg-white border border-gray-200 rounded-3xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-700 mb-6">Vazifalar holati</h3>
{pieData.length === 1 ? (
  // Bitta segment — oddiy to'liq doira
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={pieData}
        cx="50%"
        cy="50%"
        innerRadius={70}
        outerRadius={110}
        startAngle={0}
        endAngle={360}
        dataKey="value"
        strokeWidth={0}
      >
        {pieData.map((entry, index) => (
          <Cell key={index} fill={entry.color} stroke="none" />
        ))}
      </Pie>
      <Tooltip formatter={(value) => [`${value} ta`, ""]} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
) : (
  // Ko'p segment — oddiy pie
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={pieData}
        cx="50%"
        cy="50%"
        innerRadius={70}
        outerRadius={110}
        paddingAngle={4}
        dataKey="value"
        strokeWidth={0}
      >
        {pieData.map((entry, index) => (
          <Cell key={index} fill={entry.color} stroke="none" />
        ))}
      </Pie>
      <Tooltip formatter={(value) => [`${value} ta`, ""]} />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
)}
                </div>

                {/* Bar Chart */}
                <div className="bg-white border border-gray-200 rounded-3xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-700 mb-6">Vazifalar soni</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} barSize={50}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`${value} ta`, "Soni"]} />
                      <Bar dataKey="soni" radius={[8, 8, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}