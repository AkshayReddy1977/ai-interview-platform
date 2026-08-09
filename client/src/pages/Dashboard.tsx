import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/reduxHooks';
import { logoutUser } from '../store/slices/authSlice';
import { Button } from '../components/Button';

/**
 * Phase 2 placeholder. The real dashboard (charts, scores, recent
 * interviews, etc.) is built in Phase 12 per the build order — this
 * exists to prove the auth + protected-route flow works end to end.
 */
export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">You&apos;re logged in 🎉</h1>
        <div className="mt-4 space-y-1 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-800">Name:</span> {user?.name}
          </p>
          <p>
            <span className="font-medium text-slate-800">Email:</span> {user?.email}
          </p>
          <p>
            <span className="font-medium text-slate-800">Role:</span> {user?.role}
          </p>
        </div>
        <Button onClick={handleLogout} className="mt-6 w-full">
          Log out
        </Button>
      </div>
    </div>
  );
}
