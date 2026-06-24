import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PageWrapper } from './components/layout/PageWrapper';
import { Dashboard } from './pages/Dashboard';
import { Generate } from './pages/Generate';
import { Jobs } from './pages/Jobs';
import { Roadmap } from './pages/Roadmap';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
      <Routes>
        <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/generate" element={<PageWrapper><Generate /></PageWrapper>} />
        <Route path="/jobs" element={<PageWrapper><Jobs /></PageWrapper>} />
        <Route path="/roadmap" element={<PageWrapper><Roadmap /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
