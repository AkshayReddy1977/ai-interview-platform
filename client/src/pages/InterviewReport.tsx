import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { interviewService } from '../services/interviewService';
import { Interview } from '../types/interview.types';

function BigScore({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'text-green-600' : value >= 40 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white p-4">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

export default function InterviewReportPage() {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    interviewService
      .getById(id)
      .then(setInterview)
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className="text-sm text-slate-500">Loading report…</div>;
  if (!interview?.report) return <div className="text-sm text-slate-500">Report not available yet.</div>;

  const { report } = interview;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">{interview.category} — Interview Report</h1>
      <p className="mt-2 text-sm text-slate-600">{report.summary}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <BigScore label="Overall" value={report.overallScore} />
        <BigScore label="Technical" value={report.technicalScore} />
        <BigScore label="Communication" value={report.communicationScore} />
        <BigScore label="Problem Solving" value={report.problemSolvingScore} />
        <BigScore label="Knowledge Depth" value={report.knowledgeDepth} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-2 text-sm font-semibold text-slate-800">Strong areas</p>
          <ul className="flex flex-col gap-1.5">
            {report.strongAreas.length > 0 ? (
              report.strongAreas.map((a) => (
                <li key={a} className="text-sm text-green-700">
                  ✓ {a}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-400">None identified</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-2 text-sm font-semibold text-slate-800">Weak areas</p>
          <ul className="flex flex-col gap-1.5">
            {report.weakAreas.length > 0 ? (
              report.weakAreas.map((a) => (
                <li key={a} className="text-sm text-red-700">
                  ✕ {a}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-400">None identified</li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-2 text-sm font-semibold text-slate-800">Recommended topics to study</p>
        <div className="flex flex-wrap gap-1.5">
          {report.recommendedTopics.map((t) => (
            <span key={t} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">
              {t}
            </span>
          ))}
        </div>
      </div>

      <Link to="/interviews" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to interviews
      </Link>
    </div>
  );
}
