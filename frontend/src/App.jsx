import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LessonView from './pages/LessonView';
import AdminDashboard from './pages/AdminDashboard';
import ContentManager from './pages/ContentManager';
import AnalyticsView from './pages/AnalyticsView';
import UserMonitor from './pages/UserMonitor';
import Courses from './pages/Courses';
import SyllabusView from './pages/SyllabusView';
import DiagnosticSurvey from './pages/DiagnosticSurvey';
import QuizView from './pages/QuizView';
import ScheduleView from './pages/ScheduleView';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-primary-600 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Initializing Session Layer...</p>
        </div>
    );
    if (!user) return <Navigate to="/login" />;
    if (user.needs_diagnostic && user.role !== 'admin' && location.pathname !== '/diagnostic') return <Navigate to="/diagnostic" />;
    return children;
};

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-primary-600 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Authenticating Protocol Authority...</p>
        </div>
    );
    if (!user || user.role !== 'admin') return <Navigate to="/courses" />;
    return children;
};

const RoleRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" />;
    return <Navigate to={user.role === 'admin' ? '/admin' : '/courses'} />;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/diagnostic" element={
                        <ProtectedRoute>
                            <DiagnosticSurvey />
                        </ProtectedRoute>
                    } />

                    {/* Student Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/analytics" element={
                        <ProtectedRoute>
                            <AnalyticsView />
                        </ProtectedRoute>
                    } />
                    <Route path="/courses" element={
                        <ProtectedRoute>
                            <Courses />
                        </ProtectedRoute>
                    } />
                    <Route path="/syllabus/:subjectId" element={
                        <ProtectedRoute>
                            <SyllabusView />
                        </ProtectedRoute>
                    } />
                    <Route path="/lesson/:id" element={
                        <ProtectedRoute>
                            <LessonView />
                        </ProtectedRoute>
                    } />
                    <Route path="/assessment/:unitId" element={
                        <ProtectedRoute>
                            <QuizView />
                        </ProtectedRoute>
                    } />
                    <Route path="/schedule" element={
                        <ProtectedRoute>
                            <ScheduleView />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    } />
                    <Route path="/admin/content" element={
                        <AdminRoute>
                            <ContentManager />
                        </AdminRoute>
                    } />
                    <Route path="/admin/analytics" element={
                        <AdminRoute>
                            <AnalyticsView />
                        </AdminRoute>
                    } />
                    <Route path="/admin/users" element={
                        <AdminRoute>
                            <UserMonitor />
                        </AdminRoute>
                    } />

                    {/* Default Route — role-based */}
                    <Route path="/" element={<RoleRedirect />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;