import { ChangeEvent, DragEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import { resumeService } from '../services/resumeService';
import { Resume } from '../types/profile.types';

function StatusBadge({ status }: { status: Resume['status'] }) {
  const styles: Record<Resume['status'], string> = {
    PROCESSING: 'bg-amber-50 text-amber-700',
    COMPLETED: 'bg-green-50 text-green-700',
    FAILED: 'bg-red-50 text-red-700',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const loadResumes = () => {
    resumeService
      .list()
      .then(setResumes)
      .catch(() => toast.error('Failed to load resumes'))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadResumes, []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setIsUploading(true);
    try {
      await resumeService.upload(file);
      toast.success('Resume uploaded and processed');
      loadResumes();
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await resumeService.remove(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      toast.success('Resume deleted');
    } catch {
      toast.error('Failed to delete resume');
    }
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    e.target.value = ''; // allow re-uploading the same filename
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900">Resume</h1>
      <p className="mt-1 text-sm text-slate-500">Upload your resume as a PDF — we'll extract your skills automatically.</p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-white'
        }`}
      >
        <UploadCloud className="text-slate-400" size={32} />
        <p className="text-sm font-medium text-slate-700">{isUploading ? 'Uploading…' : 'Drag & drop your resume, or click to browse'}</p>
        <p className="text-xs text-slate-400">PDF only, up to 10MB</p>
        <input type="file" accept="application/pdf" className="hidden" onChange={onFileInputChange} disabled={isUploading} />
      </label>

      <div className="mt-8">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading resumes…</p>
        ) : resumes.length === 0 ? (
          <p className="text-sm text-slate-500">No resumes uploaded yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {resumes.map((resume) => (
              <li key={resume._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 shrink-0 text-brand-600" size={20} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{resume.originalFilename}</p>
                      <p className="text-xs text-slate-400">{(resume.sizeBytes / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={resume.status} />
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Delete resume"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {resume.status === 'FAILED' && resume.failureReason && (
                  <p className="mt-2 text-xs text-red-600">{resume.failureReason}</p>
                )}

                {resume.status === 'COMPLETED' && resume.parsed && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-1 text-xs font-medium text-slate-500">Extracted skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.parsed.skills.length > 0 ? (
                        resume.parsed.skills.map((skill) => (
                          <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">None detected</span>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
