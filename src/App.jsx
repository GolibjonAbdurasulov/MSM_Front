import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import PublisherPage from "./pages/PublisherPage.jsx";
import ReviewerPage from "./pages/ReviewerPage.jsx"; // <<< 1. BUNI ALBATTA QO'SHING

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
              // TO'G'IRLANGAN MANTIQ:
              // Role 1 bo'lsa Publisher, Role 2 bo'lsa Reviewer
              <Navigate to={user.role === 1 ? "/publisher" : "/reviewer"} />
            ) : (
              <AuthPage setUser={setUser} />
            )
          }
        />
        
        {/* Role 1 -> Publisher */}
        <Route
          path="/publisher"
          element={user && user.role === 1 ? <PublisherPage /> : <Navigate to="/" />}
        />
        
        {/* Role 2 -> Reviewer */}
        <Route
          path="/reviewer"
          element={user && user.role === 2 ? <ReviewerPage /> : <Navigate to="/" />}
        />

        {/* Noma'lum yo'llar uchun */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
