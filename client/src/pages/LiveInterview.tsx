import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, FileCheck2 } from 'lucide-react';
import { interviewService } from '../services/interviewService';
import { Interview } from '../types/interview.types';
import { TextAreaField } from '../components/TextAreaField';
import { Button } from '../components/Button';

function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'text-green-600' : value >= 40 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-slate-50 px-3 py-2">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  );
}

export default function LiveInterviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    if (!id) return;
    interviewService
      .getById(id)
      .then(setInterview)
      .catch(() => toast.error('Failed to load interview'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <div className="text-sm text-slate-500">Loading interview…</div>;
  if (!interview) return <div className="text-sm text-slate-500">Interview not found.</div>;

  const currentTurn = interview.turns[interview.turns.length - 1];
  const hasAnswered = Boolean(currentTurn?.answer);
  const questionCount = interview.turns.length;
  const MAX_QUESTIONS = 8;

  const handleSubmitAnswer = async () => {
    if (!id || !answer.trim()) return;
    setIsSubmitting(true);
    try {
      const updated = await interviewService.submitAnswer(id, answer);
      setInterview(updated);
      setAnswer('');
    } catch {
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!id) return;
    setIsAdvancing(true);
    try {
      const updated = await interviewService.nextQuestion(id);
      setInterview(updated);
    } catch {
      toast.error('Failed to get next question');
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleFinish = async () => {
    if (!id) return;
    setIsAdvancing(true);
    try {
      await interviewService.getReport(id);
      navigate(`/interviews/${id}/report`);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setIsAdvancing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{interview.category} Interview</h1>
          <p className="text-xs text-slate-500">
            Question {questionCount} of {MAX_QUESTIONS} · Difficulty: {currentTurn?.difficulty}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-800">{currentTurn?.question}</p>

        {!hasAnswered ? (
          <div className="mt-4 flex flex-col gap-3">
            <TextAreaField
              label="Your answer"
              rows={6}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here…"
            />
            <Button onClick={handleSubmitAnswer} isLoading={isSubmitting} disabled={!answer.trim()} className="self-start">
              Submit Answer
            </Button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Your answer</p>
              <p className="text-sm text-slate-700">{currentTurn.answer}</p>
            </div>

            {currentTurn.evaluation && (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  <ScorePill label="Score" value={currentTurn.evaluation.score} />
                  <ScorePill label="Accuracy" value={currentTurn.evaluation.technicalAccuracy} />
                  <ScorePill label="Depth" value={currentTurn.evaluation.depth} />
                  <ScorePill label="Clarity" value={currentTurn.evaluation.clarity} />
                  <ScorePill label="Complete" value={currentTurn.evaluation.completeness} />
                  <ScorePill label="Confidence" value={currentTurn.evaluation.confidence} />
                </div>
                <p className="text-sm text-slate-600">{currentTurn.evaluation.feedback}</p>
                {currentTurn.usedFallback && (
                  <p className="text-xs text-amber-600">
                    ⓘ Evaluated with the built-in scorer (AI unavailable) — feedback is approximate.
                  </p>
                )}
              </>
            )}

            <div className="flex gap-3">
              {questionCount < MAX_QUESTIONS ? (
                <Button onClick={handleNextQuestion} isLoading={isAdvancing} className="flex items-center gap-1.5">
                  Next Question <ArrowRight size={14} />
                </Button>
              ) : null}
              <Button
                onClick={handleFinish}
                isLoading={isAdvancing}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900"
              >
                <FileCheck2 size={14} /> Finish &amp; See Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
