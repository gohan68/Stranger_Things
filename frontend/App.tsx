import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Reader } from './pages/Reader';
import { ChapterIndex } from './pages/ChapterIndex';
import { About, Legal } from './pages/StaticPages';
import { Loader2 } from 'lucide-react';

// Lazy load admin dashboard for better performance
const AdminDashboard = lazy(() => 
  import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard }))
);

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-st-black">
    <Loader2 className="animate-spin text-st-red" size={48} />
  </div>
);

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
            <Route 
              path="/admin" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminDashboard />
                </Suspense>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
