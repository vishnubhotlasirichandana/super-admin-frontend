import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminLayout from './components/SuperAdminLayout';
import Applications from './pages/dashboard/Applications';
import ProjectsView from './pages/dashboard/ProjectsView';
import ChatInterface from './pages/dashboard/ChatInterface';
import Communications from './pages/dashboard/Communications';
import AuditLogs from './pages/dashboard/AuditLogs';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route element={<SuperAdminLayout />}>
              <Route index element={<Navigate to="applications" replace />} />
              <Route path="applications" element={<Applications />} />
              <Route path="projects" element={<ProjectsView />} />
              <Route path="chat" element={<ChatInterface />} />
              <Route path="communications" element={<Communications />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
