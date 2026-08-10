import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Briefcase, Sparkles, Trash2 } from 'lucide-react';
import { jobService } from '../services/jobService';
import { resumeService } from '../services/resumeService';
import { CreateJobPayload, JobDescription } from '../types/jobProject.types';
import { Resume } from '../types/profile.types';
import { TextField } from '../components/TextField';
import { TextAreaField } from '../components/TextAreaField';
import { Button } from '../components/Button';

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-current text-lg font-bold ${color}`}>
      {score}
    </div>
  );
}

function SkillPillList({ title, skills, tone }: { title: string; skills: string[]; tone: 'good' | 'bad' | 'neutral' }) {
  if (skills.length === 0) return null;
  const styles = { good: 'bg-green-50 text-green-700', bad: 'bg-red-50 text-red-700', neutral: 'bg-slate-100 text-slate-600' };
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <span key={s} className={`rounded-full px-2 py-0.5 text-xs ${styles[tone]}`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function JobAnalysisPage() {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateJobPayload>();

  const load = () => {
    Promise.all([jobService.list(), resumeService.list()])
      .then(([j, r]) => {
        setJobs(j);
        setResumes(r);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const onSubmit = async (payload: CreateJobPayload) => {
    setIsSubmitting(true);
    try {
      const job = await jobService.create(payload);
      setJobs((prev) => [job, ...prev]);
      reset();
      toast.success(job.usedFallbackAnalysis ? 'Job saved (analyzed with built-in parser)' : 'Job saved and analyzed');
    } catch {
      toast.error('Failed to save job description');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await jobService.remove(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleAnalyze = async (jobId: string) => {
    const activeResume = resumes[0];
    if (!activeResume) {
      toast.error('Upload a resume first to compare against this job');
      return;
    }
    setAnalyzingJobId(jobId);
    try {
      const updated = await jobService.analyze(jobId, activeResume._id);
      setJobs((prev) => prev.map((j) => (j._id === jobId ? updated : j)));
      toast.success('Analysis complete');
    } catch {
      toast.error('Analysis failed');
    } finally {
      setAnalyzingJobId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900">Job Description Analysis</h1>
      <p className="mt-1 text-sm text-slate-500">Paste a job description to see how your resume stacks up.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Job title" {...register('title', { required: 'Title is required' })} error={errors.title?.message} />
          <TextField label="Company (optional)" {...register('company')} />
        </div>
        <TextAreaField
          label="Job description"
          rows={8}
          placeholder="Paste the full job description here…"
          {...register('rawText', { required: 'Job description is required', minLength: { value: 20, message: 'Too short to analyze' } })}
          error={errors.rawText?.message}
        />
        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Save &amp; Analyze
        </Button>
      </form>

      <div className="mt-8 flex flex-col gap-4">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">No job descriptions saved yet.</p>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Briefcase className="mt-0.5 shrink-0 text-brand-600" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{job.title}</p>
                    {job.company && <p className="text-xs text-slate-500">{job.company}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(job._id)} className="text-slate-400 hover:text-red-600" aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.requiredSkills.slice(0, 8).map((s) => (
                  <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {s}
                  </span>
                ))}
              </div>

              {job.analysis ? (
                <div className="mt-4 flex items-start gap-4 border-t border-slate-100 pt-4">
                  <ScoreRing score={job.analysis.overallMatchScore} />
                  <div className="flex flex-1 flex-col gap-3">
                    <SkillPillList title="Matched skills" skills={job.analysis.matchedSkills} tone="good" />
                    <SkillPillList title="Missing skills" skills={job.analysis.missingSkills} tone="bad" />
                    <SkillPillList title="Recommended prep topics" skills={job.analysis.recommendedPreparationTopics} tone="neutral" />
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <Button
                    onClick={() => handleAnalyze(job._id)}
                    isLoading={analyzingJobId === job._id}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Sparkles size={14} /> Analyze against my resume
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
