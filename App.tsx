import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Reader } from './pages/Reader';
import { ChapterIndex } from './pages/ChapterIndex';
import { About, Legal } from './pages/StaticPages';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chapters" element={<ChapterIndex />} />
            <Route path="/read" element={<Reader />} />
            <Route path="/read/:chapterId" element={<Reader />} />
            <Route path="/about" element={<About />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
