import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ReportsAndStatistics from "./pages/ReportsAndStatistics";

import AuthPage from "./pages/AuthPage";
import ReviewerPage from "./pages/ReviewerPage";
import PublisherPage from "./pages/PublisherPage";
import ReviewerMainPage from "./pages/ReviewerMainPage";
import WorkersPage from "./pages/WorkersPage";
import PublisherSettings from "./pages/PublisherSettingsPage";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage setUser={setUser} />} />

        <Route
          path="/publisher"
          element={
            user ? <PublisherPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/workers"
          element={
            user ? <WorkersPage /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/reviewer_main"
          element={
            user ? <ReviewerMainPage /> : <Navigate to="/" replace />
          }
        />

        <Route
          path="/publisher-settings"
          element={
            user ? <PublisherSettings /> : <Navigate to="/" replace />
          }
        />

        <Route 
        path="/reports" element={
          user ? <ReportsAndStatistics /> : <Navigate to="/" replace />

        } 
        />

        <Route
        path="/reviewer_department/:departmentId"
        element={user ? <ReviewerPage /> : <Navigate to="/" replace />}
        />
        </Routes>
    </BrowserRouter>
  );
}

export default App;

