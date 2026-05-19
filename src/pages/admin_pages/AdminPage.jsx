import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { BASE_URL } from "../../services/api.js";

const TABS = ["Departmentlar", "SubDepartmentlar", "Foydalanuvchilar", "Ishchilar"];

const ROLES = [
  { value: "Publisher", label: "Publisher" },
  { value: "Reviewer", label: "Reviewer" },
  { value: "Admin", label: "Admin" },
];
//{ value: "Director", label: "Direktor" },
// AdminPage.jsx ning eng boshiga qo'shing
console.log("AdminPage loaded");
console.log("user:", JSON.parse(localStorage.getItem("user")));

export default function AdminPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const [activeTab, setActiveTab] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ── DEPARTMENT ──
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [showDeptCreate, setShowDeptCreate] = useState(false);
  const [showDeptEdit, setShowDeptEdit] = useState(false);
  const [showDeptDelete, setShowDeptDelete] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [newDept, setNewDept] = useState({ departmentShortName: "", departmentFullName: "" });
  const [deptSaving, setDeptSaving] = useState(false);

  // ── SUBDEPARTMENT ──
  const [subDepartments, setSubDepartments] = useState([]);
  const [subDeptLoading, setSubDeptLoading] = useState(false);
  const [showSubCreate, setShowSubCreate] = useState(false);
  const [showSubEdit, setShowSubEdit] = useState(false);
  const [showSubDelete, setShowSubDelete] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [newSub, setNewSub] = useState({ subDepartmentShortName: "", subDepartmentFullName: "", departmentId: "" });
  const [subSaving, setSubSaving] = useState(false);

  // ── USER ──
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [showUserCreate, setShowUserCreate] = useState(false);
  const [showUserEdit, setShowUserEdit] = useState(false);
  const [showUserDelete, setShowUserDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    firstName: "", lastName: "", login: "", password: "",
    role: "Publisher", departmentId: "", subDepartmentId: "",
  });
  const [userSaving, setUserSaving] = useState(false);

  // ── WORKER ──
  const [workers, setWorkers] = useState([]);
  const [workerLoading, setWorkerLoading] = useState(false);
  const [showWorkerCreate, setShowWorkerCreate] = useState(false);
  const [showWorkerEdit, setShowWorkerEdit] = useState(false);
  const [showWorkerDelete, setShowWorkerDelete] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [newWorker, setNewWorker] = useState({ fullName: "", personnelNumber: "", position: "", departmentId: "", subDepartmentId: "" });
  const [workerSaving, setWorkerSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [workerDeptFilter, setWorkerDeptFilter] = useState("");
  const fileInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  // ════════════ DEPARTMENT API ════════════
  const fetchDepartments = useCallback(async () => {
    try {
      setDeptLoading(true);
      const res = await axios.get(`${BASE_URL}/Department/GetAllDepartments`, { headers });
      setDepartments(res.data.content || []);
    } catch (e) { console.error(e); }
    finally { setDeptLoading(false); }
  }, []);

  const handleCreateDept = async () => {
    try {
      setDeptSaving(true);
      await axios.post(`${BASE_URL}/Department/CreateDepartment`, newDept, { headers });
      setShowDeptCreate(false);
      setNewDept({ departmentShortName: "", departmentFullName: "" });
      fetchDepartments();
    } catch (e) { alert("Xatolik"); }
    finally { setDeptSaving(false); }
  };

  const handleUpdateDept = async () => {
    try {
      setDeptSaving(true);
      await axios.put(`${BASE_URL}/Department/UpdateDepartment`, selectedDept, { headers });
      setShowDeptEdit(false);
      fetchDepartments();
    } catch (e) { alert("Xatolik"); }
    finally { setDeptSaving(false); }
  };

  const handleDeleteDept = async () => {
    try {
      setDeptSaving(true);
      await axios.delete(`${BASE_URL}/Department/DeleteDepartment`, { params: { id: selectedDept.id }, headers });
      setShowDeptDelete(false);
      setShowDeptEdit(false);
      fetchDepartments();
    } catch (e) { alert("Xatolik"); }
    finally { setDeptSaving(false); }
  };

  // ════════════ SUBDEPARTMENT API ════════════
  const fetchSubDepartments = useCallback(async () => {
    try {
      setSubDeptLoading(true);
      const res = await axios.get(`${BASE_URL}/SubDepartment/GetAllSubDepartments`, { headers });
      setSubDepartments(res.data.content || []);
    } catch (e) { console.error(e); }
    finally { setSubDeptLoading(false); }
  }, []);

  const handleCreateSub = async () => {
    try {
      setSubSaving(true);
      await axios.post(`${BASE_URL}/SubDepartment/CreateSubDepartment`, {
        ...newSub,
        departmentId: Number(newSub.departmentId),
      }, { headers });
      setShowSubCreate(false);
      setNewSub({ subDepartmentShortName: "", subDepartmentFullName: "", departmentId: "" });
      fetchSubDepartments();
    } catch (e) { alert("Xatolik"); }
    finally { setSubSaving(false); }
  };

  const handleUpdateSub = async () => {
    try {
      setSubSaving(true);
      await axios.put(`${BASE_URL}/SubDepartment/UpdateSubDepartment`, selectedSub, { headers });
      setShowSubEdit(false);
      fetchSubDepartments();
    } catch (e) { alert("Xatolik"); }
    finally { setSubSaving(false); }
  };

  const handleDeleteSub = async () => {
    try {
      setSubSaving(true);
      await axios.delete(`${BASE_URL}/SubDepartment/DeleteSubDepartment`, { params: { id: selectedSub.id }, headers });
      setShowSubDelete(false);
      setShowSubEdit(false);
      fetchSubDepartments();
    } catch (e) { alert("Xatolik"); }
    finally { setSubSaving(false); }
  };

  // ════════════ USER API ════════════
  const fetchUsers = useCallback(async () => {
    try {
      setUserLoading(true);
      const res = await axios.get(`${BASE_URL}/User/GetAllUsers`, { headers });
      setUsers(res.data.content || []);
    } catch (e) { console.error(e); }
    finally { setUserLoading(false); }
  }, []);

  const handleCreateUser = async () => {
    try {
      setUserSaving(true);
      await axios.post(`${BASE_URL}/User/CreateUser`, {
        ...newUser,
        departmentId: Number(newUser.departmentId),
        subDepartmentId: Number(newUser.subDepartmentId),
      }, { headers });
      setShowUserCreate(false);
      setNewUser({ firstName: "", lastName: "", login: "", password: "", role: "Publisher", departmentId: "", subDepartmentId: "" });
      fetchUsers();
    } catch (e) { alert("Xatolik"); }
    finally { setUserSaving(false); }
  };

  const handleUpdateUser = async () => {
    try {
      setUserSaving(true);
      await axios.put(`${BASE_URL}/User/UpdateUser`, selectedUser, { headers });
      setShowUserEdit(false);
      fetchUsers();
    } catch (e) { alert("Xatolik"); }
    finally { setUserSaving(false); }
  };

  const handleDeleteUser = async () => {
    try {
      setUserSaving(true);
      await axios.delete(`${BASE_URL}/User/DeleteUser`, { params: { id: selectedUser.id }, headers });
      setShowUserDelete(false);
      setShowUserEdit(false);
      fetchUsers();
    } catch (e) { alert("Xatolik"); }
    finally { setUserSaving(false); }
  };

  // ════════════ WORKER API ════════════
  const fetchWorkers = useCallback(async () => {
    try {
      setWorkerLoading(true);
      const res = await axios.get(`${BASE_URL}/Worker/GetDepartmentAllWorkersById`, {
        params: { id: workerDeptFilter || departments[0]?.id },
        headers,
      });
      setWorkers(res.data.content || []);
    } catch (e) { console.error(e); }
    finally { setWorkerLoading(false); }
  }, [workerDeptFilter, departments]);

  const handleCreateWorker = async () => {
    try {
      setWorkerSaving(true);
      await axios.post(`${BASE_URL}/Worker/CreateWorker`, {
        ...newWorker,
        personnelNumber: Number(newWorker.personnelNumber),
        departmentId: Number(newWorker.departmentId),
        subDepartmentId: Number(newWorker.subDepartmentId),
      }, { headers });
      setShowWorkerCreate(false);
      setNewWorker({ fullName: "", personnelNumber: "", position: "", departmentId: "", subDepartmentId: "" });
      fetchWorkers();
    } catch (e) { alert("Xatolik"); }
    finally { setWorkerSaving(false); }
  };

  const handleUpdateWorker = async () => {
    try {
      setWorkerSaving(true);
      await axios.put(`${BASE_URL}/Worker/UpdateWorker`, {
        id: selectedWorker.workerId,
        fullName: selectedWorker.fullName,
        personnelNumber: Number(selectedWorker.personnelNumber),
        position: selectedWorker.position,
      }, { headers });
      setShowWorkerEdit(false);
      fetchWorkers();
    } catch (e) { alert("Xatolik"); }
    finally { setWorkerSaving(false); }
  };

  const handleDeleteWorker = async () => {
    try {
      setWorkerSaving(true);
      await axios.delete(`${BASE_URL}/Worker/DeleteWorker`, { params: { id: selectedWorker.workerId }, headers });
      setShowWorkerDelete(false);
      setShowWorkerEdit(false);
      fetchWorkers();
    } catch (e) { alert("Xatolik"); }
    finally { setWorkerSaving(false); }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) { alert("Faqat .xlsx fayl"); return; }
    if (!workerDeptFilter) { alert("Avval department tanlang"); return; }
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${BASE_URL}/Worker/ImportWorkers/${workerDeptFilter}`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      alert("Import muvaffaqiyatli!");
      fetchWorkers();
    } catch (e) { alert("Import xatoligi"); }
    finally { setImporting(false); e.target.value = ""; }
  };

  useEffect(() => { fetchDepartments(); fetchSubDepartments(); }, []);
  useEffect(() => { if (activeTab === 2) fetchUsers(); }, [activeTab]);
  useEffect(() => { if (activeTab === 3 && departments.length > 0) fetchWorkers(); }, [activeTab, workerDeptFilter, departments]);

  // ════════════ ROLE LABEL ════════════
  const getRoleLabel = (role) => ROLES.find(r => r.value === role)?.label || role;

  // ════════════ DEPT NAME ════════════
  const getDeptName = (id) => departments.find(d => d.id === id)?.departmentFullName || "-";
  const getSubName = (id) => subDepartments.find(s => s.id === id)?.subDepartmentFullName || "-";

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6 text-gray-900">
      <div className="max-w-[1800px] mx-auto">

        {/* Sidebar overlay */}
        {showSidebar && <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowSidebar(false)} />}

        {/* Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="px-6 py-6 border-b border-gray-100">
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">MSM ERP</h2>
          </div>
          <nav className="px-4 py-6 space-y-2">
{[
  { href: "/telegram_settings", icon: "🤖", label: "Telegram sozlamalari" }
].map((item) => (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${item.active ? "bg-emerald-50 text-emerald-600" : "hover:bg-emerald-50 text-gray-700 hover:text-emerald-600"}`}>
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Navbar */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-md px-8 py-6 mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(true)} className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-gray-100 transition-all">
              <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
              <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
              <span className="w-6 h-0.5 bg-gray-700 rounded-full"></span>
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Admin Panel</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Tizim boshqaruvi</p>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-300 flex items-center justify-center transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </button>
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 w-56 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="font-bold text-gray-900 text-sm">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-emerald-600 font-semibold uppercase">Admin</p>
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

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-md p-2 mb-8 flex gap-2">
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === i ? "bg-emerald-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ════════ DEPARTMENT TAB ════════ */}
        {activeTab === 0 && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-700">Departmentlar</h2>
              <button onClick={() => setShowDeptCreate(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold transition-all">
                + Yangi
              </button>
            </div>

            {deptLoading ? (
              <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="col-span-1 text-xs font-black text-gray-400 uppercase">#</div>
                  <div className="col-span-3 text-xs font-black text-gray-400 uppercase">Qisqa nomi</div>
                  <div className="col-span-6 text-xs font-black text-gray-400 uppercase">To'liq nomi</div>
                  <div className="col-span-2"></div>
                </div>
                {departments.map((dept, i) => (
                  <div key={dept.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 items-center">
                    <div className="col-span-1 text-sm text-gray-400">{i + 1}</div>
                    <div className="col-span-3 font-semibold text-sm">{dept.departmentShortName}</div>
                    <div className="col-span-6 text-sm text-gray-600">{dept.departmentFullName}</div>
                    <div className="col-span-2 flex justify-end">
                      <button onClick={() => { setSelectedDept({ ...dept }); setShowDeptEdit(true); }}
                        className="bg-blue-100 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all">
                        Tahrirlash
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ════════ SUBDEPARTMENT TAB ════════ */}
        {activeTab === 1 && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-700">SubDepartmentlar</h2>
              <button onClick={() => setShowSubCreate(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold transition-all">
                + Yangi
              </button>
            </div>

            {subDeptLoading ? (
              <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="col-span-1 text-xs font-black text-gray-400 uppercase">#</div>
                  <div className="col-span-2 text-xs font-black text-gray-400 uppercase">Qisqa nomi</div>
                  <div className="col-span-4 text-xs font-black text-gray-400 uppercase">To'liq nomi</div>
                  <div className="col-span-3 text-xs font-black text-gray-400 uppercase">Department</div>
                  <div className="col-span-2"></div>
                </div>
                {subDepartments.map((sub, i) => (
                  <div key={sub.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 items-center">
                    <div className="col-span-1 text-sm text-gray-400">{i + 1}</div>
                    <div className="col-span-2 font-semibold text-sm">{sub.subDepartmentShortName}</div>
                    <div className="col-span-4 text-sm text-gray-600">{sub.subDepartmentFullName}</div>
                    <div className="col-span-3 text-sm text-gray-500">{getDeptName(sub.departmentId)}</div>
                    <div className="col-span-2 flex justify-end">
                      <button onClick={() => { setSelectedSub({ ...sub }); setShowSubEdit(true); }}
                        className="bg-blue-100 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all">
                        Tahrirlash
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ════════ USER TAB ════════ */}
        {activeTab === 2 && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-700">Foydalanuvchilar</h2>
              <button onClick={() => setShowUserCreate(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold transition-all">
                + Yangi
              </button>
            </div>

            {userLoading ? (
              <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="col-span-1 text-xs font-black text-gray-400 uppercase">#</div>
                  <div className="col-span-2 text-xs font-black text-gray-400 uppercase">Ism Familiya</div>
                  <div className="col-span-2 text-xs font-black text-gray-400 uppercase">Login</div>
                  <div className="col-span-2 text-xs font-black text-gray-400 uppercase">Rol</div>
                  <div className="col-span-2 text-xs font-black text-gray-400 uppercase">Department</div>
                  <div className="col-span-2 text-xs font-black text-gray-400 uppercase">SubDepartment</div>
                  <div className="col-span-1"></div>
                </div>
                {users.map((u, i) => (
                  <div key={u.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 items-center">
                    <div className="col-span-1 text-sm text-gray-400">{i + 1}</div>
                    <div className="col-span-2 font-semibold text-sm">{u.firstName} {u.lastName}</div>
                    <div className="col-span-2 text-sm text-gray-600">{u.login}</div>
                    <div className="col-span-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        {getRoleLabel(u.role)}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">{getDeptName(u.departmentId)}</div>
                    <div className="col-span-2 text-sm text-gray-500">{getSubName(u.subDepartmentId)}</div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => { setSelectedUser({ ...u }); setShowUserEdit(true); }}
                        className="bg-blue-100 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all">
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ════════ WORKER TAB ════════ */}
        {activeTab === 3 && (
          <div className="bg-white border border-gray-200 rounded-3xl shadow-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-gray-700">Ishchilar</h2>
                <select value={workerDeptFilter}
                  onChange={(e) => setWorkerDeptFilter(e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-sm font-semibold">
                  <option value="">Department tanlang</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.departmentShortName}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} disabled={importing}
                  className="flex items-center gap-2 bg-blue-100 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white px-4 py-2.5 rounded-2xl font-bold transition-all text-sm">
                  {importing ? "Import..." : "📥 Excel import"}
                </button>
                <button onClick={() => setShowWorkerCreate(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold transition-all">
                  + Yangi
                </button>
              </div>
            </div>

            {workerLoading ? (
              <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>
            ) : !workerDeptFilter ? (
              <div className="text-center py-20 text-gray-400 font-semibold">Department tanlang</div>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="col-span-1 text-xs font-black text-gray-400 uppercase">#</div>
                  <div className="col-span-2 text-xs font-black text-gray-400 uppercase">Tabel №</div>
                  <div className="col-span-4 text-xs font-black text-gray-400 uppercase">FIO</div>
                  <div className="col-span-4 text-xs font-black text-gray-400 uppercase">Lavozim</div>
                  <div className="col-span-1"></div>
                </div>
                {workers.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">Ishchilar yo'q</div>
                ) : workers.map((w, i) => (
                  <div key={w.workerId} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 items-center">
                    <div className="col-span-1 text-sm text-gray-400">{i + 1}</div>
                    <div className="col-span-2 font-bold text-sm">{w.personnelNumber}</div>
                    <div className="col-span-4 font-semibold text-sm">{w.fullName}</div>
                    <div className="col-span-4 text-sm text-gray-500 line-clamp-1">{w.position}</div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => { setSelectedWorker({ ...w }); setShowWorkerEdit(true); }}
                        className="bg-blue-100 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all">
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            MODALS
        ════════════════════════════════════════ */}

        {/* DEPT CREATE */}
        {showDeptCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-xl font-bold mb-6">Yangi Department</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Qisqa nomi"
                  value={newDept.departmentShortName}
                  onChange={(e) => setNewDept({ ...newDept, departmentShortName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="To'liq nomi"
                  value={newDept.departmentFullName}
                  onChange={(e) => setNewDept({ ...newDept, departmentFullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setShowDeptCreate(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                <button onClick={handleCreateDept} disabled={deptSaving} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  {deptSaving ? "..." : "Yaratish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEPT EDIT */}
        {showDeptEdit && selectedDept && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-xl font-bold mb-6">Departmentni tahrirlash</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Qisqa nomi"
                  value={selectedDept.departmentShortName}
                  onChange={(e) => setSelectedDept({ ...selectedDept, departmentShortName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="To'liq nomi"
                  value={selectedDept.departmentFullName}
                  onChange={(e) => setSelectedDept({ ...selectedDept, departmentFullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
              </div>
              <div className="flex justify-between items-center mt-6">
                <button onClick={() => setShowDeptDelete(true)} className="px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white font-bold transition-all">O'chirish</button>
                <div className="flex gap-4">
                  <button onClick={() => setShowDeptEdit(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                  <button onClick={handleUpdateDept} disabled={deptSaving} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                    {deptSaving ? "..." : "Saqlash"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEPT DELETE */}
        {showDeptDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">!</div>
                <div>
                  <h2 className="text-xl font-bold">Departmentni o'chirish</h2>
                  <p className="text-sm text-gray-500">Bu amalni qaytarib bo'lmaydi</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="font-bold">{selectedDept?.departmentFullName}</p>
              </div>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowDeptDelete(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                <button onClick={handleDeleteDept} disabled={deptSaving} className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold">
                  {deptSaving ? "..." : "O'chirish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB CREATE */}
        {showSubCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-xl font-bold mb-6">Yangi SubDepartment</h2>
              <div className="space-y-4">
                <select value={newSub.departmentId}
                  onChange={(e) => setNewSub({ ...newSub, departmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  <option value="">Department tanlang</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.departmentFullName}</option>)}
                </select>
                <input type="text" placeholder="Qisqa nomi"
                  value={newSub.subDepartmentShortName}
                  onChange={(e) => setNewSub({ ...newSub, subDepartmentShortName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="To'liq nomi"
                  value={newSub.subDepartmentFullName}
                  onChange={(e) => setNewSub({ ...newSub, subDepartmentFullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setShowSubCreate(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                <button onClick={handleCreateSub} disabled={subSaving} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  {subSaving ? "..." : "Yaratish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB EDIT */}
        {showSubEdit && selectedSub && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-xl font-bold mb-6">SubDepartmentni tahrirlash</h2>
              <div className="space-y-4">
                <select value={selectedSub.departmentId}
                  onChange={(e) => setSelectedSub({ ...selectedSub, departmentId: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.departmentFullName}</option>)}
                </select>
                <input type="text" placeholder="Qisqa nomi"
                  value={selectedSub.subDepartmentShortName}
                  onChange={(e) => setSelectedSub({ ...selectedSub, subDepartmentShortName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="To'liq nomi"
                  value={selectedSub.subDepartmentFullName}
                  onChange={(e) => setSelectedSub({ ...selectedSub, subDepartmentFullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
              </div>
              <div className="flex justify-between items-center mt-6">
                <button onClick={() => setShowSubDelete(true)} className="px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white font-bold transition-all">O'chirish</button>
                <div className="flex gap-4">
                  <button onClick={() => setShowSubEdit(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                  <button onClick={handleUpdateSub} disabled={subSaving} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                    {subSaving ? "..." : "Saqlash"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB DELETE */}
        {showSubDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">!</div>
                <div>
                  <h2 className="text-xl font-bold">SubDepartmentni o'chirish</h2>
                  <p className="text-sm text-gray-500">Bu amalni qaytarib bo'lmaydi</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="font-bold">{selectedSub?.subDepartmentFullName}</p>
              </div>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowSubDelete(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                <button onClick={handleDeleteSub} disabled={subSaving} className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold">
                  {subSaving ? "..." : "O'chirish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* USER CREATE */}
        {showUserCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">Yangi Foydalanuvchi</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Ism"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="Familiya"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="Login"
                  value={newUser.login}
                  onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="password" placeholder="Parol"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <select value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select value={newUser.departmentId}
                  onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value, subDepartmentId: "" })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  <option value="">Department tanlang</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.departmentFullName}</option>)}
                </select>
                <select value={newUser.subDepartmentId}
                  onChange={(e) => setNewUser({ ...newUser, subDepartmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  <option value="">SubDepartment tanlang</option>
                  {subDepartments
                    .filter(s => s.departmentId === Number(newUser.departmentId))
                    .map(s => <option key={s.id} value={s.id}>{s.subDepartmentFullName}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setShowUserCreate(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                <button onClick={handleCreateUser} disabled={userSaving} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  {userSaving ? "..." : "Yaratish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* USER EDIT */}
        {showUserEdit && selectedUser && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">Foydalanuvchini tahrirlash</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Ism"
                  value={selectedUser.firstName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="Familiya"
                  value={selectedUser.lastName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="Login"
                  value={selectedUser.login}
                  onChange={(e) => setSelectedUser({ ...selectedUser, login: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <select value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select value={selectedUser.departmentId}
                  onChange={(e) => setSelectedUser({ ...selectedUser, departmentId: Number(e.target.value), subDepartmentId: 0 })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  {departments.map(d => <option key={d.id} value={d.id}>{d.departmentFullName}</option>)}
                </select>
                <select value={selectedUser.subDepartmentId}
                  onChange={(e) => setSelectedUser({ ...selectedUser, subDepartmentId: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  <option value="">SubDepartment tanlang</option>
                  {subDepartments
                    .filter(s => s.departmentId === selectedUser.departmentId)
                    .map(s => <option key={s.id} value={s.id}>{s.subDepartmentFullName}</option>)}
                </select>
              </div>
              <div className="flex justify-between items-center mt-6">
                <button onClick={() => setShowUserDelete(true)} className="px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white font-bold transition-all">O'chirish</button>
                <div className="flex gap-4">
                  <button onClick={() => setShowUserEdit(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                  <button onClick={handleUpdateUser} disabled={userSaving} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                    {userSaving ? "..." : "Saqlash"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USER DELETE */}
        {showUserDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">!</div>
                <div>
                  <h2 className="text-xl font-bold">Foydalanuvchini o'chirish</h2>
                  <p className="text-sm text-gray-500">Bu amalni qaytarib bo'lmaydi</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="font-bold">{selectedUser?.firstName} {selectedUser?.lastName}</p>
                <p className="text-sm text-gray-500">{selectedUser?.login}</p>
              </div>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowUserDelete(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                <button onClick={handleDeleteUser} disabled={userSaving} className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold">
                  {userSaving ? "..." : "O'chirish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WORKER CREATE */}
        {showWorkerCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-xl font-bold mb-6">Yangi Ishchi</h2>
              <div className="space-y-4">
                <input type="text" placeholder="FIO"
                  value={newWorker.fullName}
                  onChange={(e) => setNewWorker({ ...newWorker, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="number" placeholder="Tabel raqam"
                  value={newWorker.personnelNumber}
                  onChange={(e) => setNewWorker({ ...newWorker, personnelNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="Lavozim"
                  value={newWorker.position}
                  onChange={(e) => setNewWorker({ ...newWorker, position: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <select value={newWorker.departmentId}
                  onChange={(e) => setNewWorker({ ...newWorker, departmentId: e.target.value, subDepartmentId: "" })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  <option value="">Department tanlang</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.departmentFullName}</option>)}
                </select>
                <select value={newWorker.subDepartmentId}
                  onChange={(e) => setNewWorker({ ...newWorker, subDepartmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500">
                  <option value="">SubDepartment tanlang</option>
                  {subDepartments
                    .filter(s => s.departmentId === Number(newWorker.departmentId))
                    .map(s => <option key={s.id} value={s.id}>{s.subDepartmentFullName}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setShowWorkerCreate(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                <button onClick={handleCreateWorker} disabled={workerSaving} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  {workerSaving ? "..." : "Yaratish"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WORKER EDIT */}
        {showWorkerEdit && selectedWorker && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h2 className="text-xl font-bold mb-6">Ishchini tahrirlash</h2>
              <div className="space-y-4">
                <input type="text" placeholder="FIO"
                  value={selectedWorker.fullName}
                  onChange={(e) => setSelectedWorker({ ...selectedWorker, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="number" placeholder="Tabel raqam"
                  value={selectedWorker.personnelNumber}
                  onChange={(e) => setSelectedWorker({ ...selectedWorker, personnelNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
                <input type="text" placeholder="Lavozim"
                  value={selectedWorker.position}
                  onChange={(e) => setSelectedWorker({ ...selectedWorker, position: e.target.value })}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500" />
              </div>
              <div className="flex justify-between items-center mt-6">
                <button onClick={() => setShowWorkerDelete(true)} className="px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-500 border border-red-300 text-red-600 hover:text-white font-bold transition-all">O'chirish</button>
                <div className="flex gap-4">
                  <button onClick={() => setShowWorkerEdit(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                  <button onClick={handleUpdateWorker} disabled={workerSaving} className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                    {workerSaving ? "..." : "Saqlash"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKER DELETE */}
        {showWorkerDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl font-bold">!</div>
                <div>
                  <h2 className="text-xl font-bold">Ishchini o'chirish</h2>
                  <p className="text-sm text-gray-500">Bu amalni qaytarib bo'lmaydi</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <p className="font-bold">{selectedWorker?.fullName}</p>
                <p className="text-sm text-gray-500">Tabel: {selectedWorker?.personnelNumber}</p>
              </div>
              <div className="flex justify-end gap-4">
                <button onClick={() => setShowWorkerDelete(false)} className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100">Bekor</button>
                <button onClick={handleDeleteWorker} disabled={workerSaving} className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold">
                  {workerSaving ? "..." : "O'chirish"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}