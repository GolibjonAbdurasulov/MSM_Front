import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../services/api.js";

export default function TelegramSettingsPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const [subDepartments, setSubDepartments] = useState([]);
  const [telegramGroups, setTelegramGroups] = useState([]);
  const [savingId, setSavingId] = useState(null);

  // fake groups example
  // keyinchalik buni backenddan olasiz
  const mockTelegramGroups = [
    {
      chatId: -1002456789012,
      title: "NOA Elektrik Guruhi",
      canSendMessage: true,
      botJoined: true,
    },
    {
      chatId: -1002456789013,
      title: "Avtomatika Navbatchilar",
      canSendMessage: false,
      botJoined: true,
    },
    {
      chatId: -1002456789014,
      title: "Mexanika Boshqaruvi",
      canSendMessage: true,
      botJoined: true,
    },
  ];

useEffect(() => {
  fetchSubDepartments();
  fetchTelegramGroups();
}, []);

  const fetchTelegramGroups = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/TelegramChat/GetAllTelegramChats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setTelegramGroups(res.data.content || []);
  } catch (err) {
    console.error("Telegram grouplarni olishda xatolik:", err);
  }
};


  const fetchSubDepartments = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/SubDepartment/GetAllSubDepartments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSubDepartments(res.data.content || []);
    } catch (err) {
      console.error("Sub departmentlarni olishda xatolik:", err);
    }
  };

  useEffect(() => {
    fetchSubDepartments();
    setTelegramGroups(mockTelegramGroups);
  }, []);

  const handleConnect = async (subDepartmentId, telegramChatId) => {
    try {
      setSavingId(subDepartmentId);

      await axios.put(
        `${BASE_URL}/SubDepartment/AddTelegramChatIdToSubDepartment`,
        null,
        {
          params: {
            subDepartmentId,
            telegramChatId,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSubDepartments((prev) =>
        prev.map((s) =>
          s.id === subDepartmentId
            ? {
                ...s,
                subDepartmentTelegramChatId: telegramChatId,
              }
            : s
        )
      );

      alert("Telegram guruh muvaffaqiyatli biriktirildi");
    } catch (err) {
      console.error("Biriktirishda xatolik:", err);
      alert("Biriktirib bo'lmadi");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6">
      <div className="max-w-[1700px] mx-auto">

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 flex items-center justify-center text-3xl">
              🤖
            </div>

            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Telegram Sozlamalari
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Bot qo'shilgan telegram guruhlarini sub departmentlarga ulang
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">

            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-5 text-xs uppercase tracking-widest text-gray-400 font-black">
                    Sub Department
                  </th>

                  <th className="text-left px-6 py-5 text-xs uppercase tracking-widest text-gray-400 font-black">
                    Biriktirilgan Guruh
                  </th>

                  <th className="text-left px-6 py-5 text-xs uppercase tracking-widest text-gray-400 font-black">
                    Telegram Guruh Tanlash
                  </th>

                  <th className="text-center px-6 py-5 text-xs uppercase tracking-widest text-gray-400 font-black">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {subDepartments.map((sub) => {
                  const connectedGroup = telegramGroups.find(
                    (g) =>
                      g.chatId === sub.subDepartmentTelegramChatId
                  );

                  return (
                    <tr
                      key={sub.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-all"
                    >
                      {/* Sub Department */}
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-gray-900">
                            {sub.subDepartmentShortName}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {sub.subDepartmentFullName}
                          </p>
                        </div>
                      </td>

                      {/* Connected */}
                      <td className="px-6 py-5">
                        {connectedGroup ? (
                          <div>
                            <p className="font-bold text-emerald-600">
                              {connectedGroup.title}
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              {connectedGroup.chatId}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 font-semibold">
                            Biriktirilmagan
                          </span>
                        )}
                      </td>

                      {/* Group Select */}
                      <td className="px-6 py-5">
                        <div className="flex gap-3">

                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (!e.target.value) return;

                              handleConnect(
                                sub.id,
                                Number(e.target.value)
                              );
                            }}
                            className="border border-gray-300 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 min-w-[320px]"
                          >
                            <option value="">
                              Telegram guruh tanlang
                            </option>

                            {telegramGroups.map((group) => (
                              <option
                                key={group.chatId}
                                value={group.chatId}
                                disabled={
                                  !group.botJoined ||
                                  !group.canSendMessage
                                }
                              >
                                {group.title}
                              </option>
                            ))}
                          </select>

                          {savingId === sub.id && (
                            <div className="text-sm text-emerald-600 font-bold flex items-center">
                              Saqlanmoqda...
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          {connectedGroup ? (
                            connectedGroup.canSendMessage ? (
                              <div className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider">
                                Aktiv
                              </div>
                            ) : (
                              <div className="px-4 py-2 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider">
                                Xabar yuborish ruhsati yo'q
                              </div>
                            )
                          ) : (
                            <div className="px-4 py-2 rounded-full bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-wider">
                              Ulanmagan
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-6 mt-8">

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="text-3xl mb-3">🤖</div>

            <h3 className="font-black text-lg mb-2">
              Botni qo'shish
            </h3>

            <p className="text-sm text-gray-500 leading-relaxed">
              Telegram guruhga botni admin sifatida qo'shing
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="text-3xl mb-3">📨</div>

            <h3 className="font-black text-lg mb-2">
              Xabar yuborish huquqi
            </h3>

            <p className="text-sm text-gray-500 leading-relaxed">
              Botga message yuborish ruxsatini bering
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="text-3xl mb-3">🔗</div>

            <h3 className="font-black text-lg mb-2">
              Departmentga biriktirish
            </h3>

            <p className="text-sm text-gray-500 leading-relaxed">
              Guruhni kerakli sub department bilan ulang
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}