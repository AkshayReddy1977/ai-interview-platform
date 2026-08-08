import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks/reduxHooks';
import { bootstrapSession } from './store/slices/authSlice';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const dispatch = useAppDispatch();
  const { status } = useAppSelector((state) => state.auth);

  // On first load, try to silently restore a session using the httpOnly
  // refresh cookie (if the user has one from a previous visit).
  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={status === 'authenticated' ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
