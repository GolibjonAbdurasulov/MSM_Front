import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Sahifalarni import qilish
import AuthPage from "./pages/AuthPage.jsx";
import PublisherPage from "./pages/PublisherPage.jsx";
import ReviewerPage from "./pages/ReviewerPage.jsx";
import ReviewerMainPage from "./pages/ReviewerMainPage.jsx";

export default function App() {
  // LocalStorage'dan foydalanuvchini olish
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. DEFAULT YO'L: Doim Login sahifasini ochadi (agar foydalanuvchi kirgan bo'lsa yo'naltiradi) */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 1 ? <Navigate to="/publisher" /> : <Navigate to="/reviewer_main" />
            ) : (
              <AuthPage setUser={setUser} />
            )
          }
        />

        {/* 2. LOGIN YO'LI: Agar user bo'lsa, Loginni ko'rsatmasdan asosiy sahifaga qaytaradi */}
        <Route
          path="/login"
          element={!user ? <AuthPage setUser={setUser} /> : <Navigate to="/" />}
        />

        {/* 3. PUBLISHER YO'LI: Faqat role 1 uchun */}
        <Route
          path="/publisher"
          element={user && user.role === 1 ? <PublisherPage /> : <Navigate to="/" />}
        />
        
        {/* 4. REVIEWER ASOSIY (GRAFIK) YO'LI: Faqat role 2 uchun */}
        <Route
          path="/reviewer_main"
          element={user && user.role === 2 ? <ReviewerMainPage /> : <Navigate to="/" />}
        />

        {/* 5. REVIEWER TASKLAR RO'YXATI YO'LI */}
        <Route
          path="/reviewer_tasks"
          element={user && user.role === 2 ? <ReviewerPage /> : <Navigate to="/" />}
        />

        {/* NOTO'G'RI URL: Har qanday xato yo'lni Login (/) ga qaytaradi */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
