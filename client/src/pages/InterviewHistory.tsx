import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { Interview } from '../types/interview.types';
import { Button } from '../components/Button';

const STATUS_STYLES: Record<Interview['status'], string> = {
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-green-50 text-green-700',
  ABANDONED: 'bg-slate-100 text-slate-500',
};

export default function InterviewHistoryPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    interviewService
      .list()
      .then(setInterviews)
      .catch(() => toast.error('Failed to load interviews'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Interviews</h1>
        <Link to="/interviews/new">
          <Button className="flex items-center gap-1.5 text-xs">
            <Plus size={14} /> New Interview
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : interviews.length === 0 ? (
          <p className="text-sm text-slate-500">No interviews yet — start your first one.</p>
        ) : (
          interviews.map((interview) => (
            <Link
              key={interview._id}
              to={interview.status === 'COMPLETED' ? `/interviews/${interview._id}/report` : `/interviews/${interview._id}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-300"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{interview.category}</p>
                <p className="text-xs text-slate-500">{new Date(interview.startedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                {interview.report && <span className="text-sm font-semibold text-brand-600">{interview.report.overallScore}</span>}
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[interview.status]}`}>
                  {interview.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
