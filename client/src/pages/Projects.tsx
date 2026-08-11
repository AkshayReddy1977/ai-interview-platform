import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FolderGit2, Trash2 } from 'lucide-react';
import { projectService } from '../services/projectService';
import { CreateProjectPayload, Project } from '../types/jobProject.types';
import { TextField } from '../components/TextField';
import { TextAreaField } from '../components/TextAreaField';
import { SkillsInput } from '../components/SkillsInput';
import { Button } from '../components/Button';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectPayload>({ defaultValues: { technologies: [], features: [] } });

  const load = () => {
    projectService
      .list()
      .then(setProjects)
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const onSubmit = async (payload: CreateProjectPayload) => {
    setIsSubmitting(true);
    try {
      const project = await projectService.create(payload);
      setProjects((prev) => [project, ...prev]);
      reset({ title: '', description: '', technologies: [], features: [], role: '', githubUrl: '', liveUrl: '' });
      toast.success('Project added');
    } catch {
      toast.error('Failed to add project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await projectService.remove(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
      <p className="mt-1 text-sm text-slate-500">
        Add your projects — the AI will ask questions specifically about these during mock interviews.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <TextField label="Project title" {...register('title', { required: 'Title is required' })} error={errors.title?.message} />
        <TextAreaField
          label="Description"
          rows={3}
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
        />
        <Controller
          control={control}
          name="technologies"
          render={({ field }) => <SkillsInput skills={field.value ?? []} onChange={field.onChange} />}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Your role (optional)" {...register('role')} />
          <TextField label="GitHub URL (optional)" {...register('githubUrl')} />
        </div>
        <TextField label="Live URL (optional)" {...register('liveUrl')} />
        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Add project
        </Button>
      </form>

      <div className="mt-8 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-slate-500">No projects added yet.</p>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FolderGit2 className="mt-0.5 shrink-0 text-brand-600" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{project.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{project.description}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(project._id)} className="text-slate-400 hover:text-red-600" aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
              {project.technologies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.technologies.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
