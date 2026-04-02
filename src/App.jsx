import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import PublisherPage from "./pages/PublisherPage.jsx";
import ReviewerPage from "./pages/ReviewerPage.jsx";
import ReviewerMainPage from "./pages/ReviewerMainPage.jsx";

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              // Role 1 bo'lsa Publisher, Role 2 bo'lsa Reviewer Grafik sahifasi
              <Navigate to={user.role === 1 ? "/publisher" : "/reviewer_main"} />
            ) : (
              <AuthPage setUser={setUser} />
            )
          }
        />
        
        {/* Publisher sahifasi */}
        <Route
          path="/publisher"
          element={user && user.role === 1 ? <PublisherPage /> : <Navigate to="/" />}
        />
        
        {/* Reviewer Grafik Asosiy sahifasi */}
        <Route
          path="/reviewer_main"
          element={user && user.role === 2 ? <ReviewerMainPage /> : <Navigate to="/" />}
        />

        {/* Reviewer Tasklar ro'yxati (Grafikdan keyingi sahifa) */}
        <Route
          path="/reviewer_tasks"
          element={user && user.role === 2 ? <ReviewerPage /> : <Navigate to="/" />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
