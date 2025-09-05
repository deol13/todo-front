import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';
import Task from '../components/Task';
import User from '../components/User.jsx';
import NotFound from "../components/NotFound";
import RoleProtectedRoute from "./RoleProtectedRoute.jsx";

const AppRoutes = () => {
    const { hasRole } = useAuth();

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* Dashboard route - only for admin */}
            {hasRole('ROLE_ADMIN') && (
                <Route path="/dashboard" element={
                    <RoleProtectedRoute requiredRoles={['ROLE_ADMIN']}>
                        <Dashboard />
                    </RoleProtectedRoute>
                } />
            )}

            {/* Tasks route - for both admin and user */}
            <Route path="/dashboard/tasks" element={
                <RoleProtectedRoute requiredRoles={['ROLE_USER', 'ROLE_ADMIN']}>
                    <Task />
                </RoleProtectedRoute>
            } />

            {/* Redirect non-admin users to tasks page when trying to access dashboard */}
            <Route path="/dashboard" element={
                <Navigate to="/dashboard/tasks" replace />
            } />

            {/* Team route - for both admin and user */}
            <Route path="/dashboard/teams" element={
                <RoleProtectedRoute requiredRoles={['ROLE_ADMIN']}>
                    <User />
                </RoleProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;