import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Play } from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { INTERVIEW_CATEGORIES, InterviewCategory, Difficulty } from '../types/interview.types';
import { Button } from '../components/Button';

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<InterviewCategory>('JavaScript');
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const interview = await interviewService.start({ category, startingDifficulty: difficulty });
      navigate(`/interviews/${interview._id}`);
    } catch {
      toast.error('Failed to start interview');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-slate-900">Start a Mock Interview</h1>
      <p className="mt-1 text-sm text-slate-500">Choose a category and starting difficulty — the AI adapts as you go.</p>

      <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Category</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INTERVIEW_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  category === cat ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Starting difficulty</p>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  difficulty === d ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleStart} isLoading={isStarting} className="flex items-center justify-center gap-2">
          <Play size={16} /> Start Interview
        </Button>
      </div>
    </div>
  );
}
