import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';
import { UpdateProfilePayload, UserProfile } from '../types/profile.types';
import { TextField } from '../components/TextField';
import { TextAreaField } from '../components/TextAreaField';
import { SkillsInput } from '../components/SkillsInput';
import { Button } from '../components/Button';

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { register, control, handleSubmit, reset } = useForm<UpdateProfilePayload>({
    defaultValues: { skills: [] },
  });

  useEffect(() => {
    userService
      .getProfile()
      .then((profile: UserProfile) => {
        reset({
          name: profile.name,
          phone: profile.phone ?? '',
          location: profile.location ?? '',
          bio: profile.bio ?? '',
          skills: profile.skills ?? [],
          github: profile.github ?? '',
          linkedin: profile.linkedin ?? '',
          portfolio: profile.portfolio ?? '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setIsLoading(false));
  }, [reset]);

  const onSubmit = async (payload: UpdateProfilePayload) => {
    setIsSaving(true);
    try {
      await userService.updateProfile(payload);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading profile…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900">Your Profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Keep this up to date — the AI uses it to generate interview questions tailored to you.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <TextField label="Full name" {...register('name')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Phone" {...register('phone')} />
          <TextField label="Location" {...register('location')} />
        </div>
        <TextAreaField label="Bio" rows={3} {...register('bio')} />

        <Controller
          control={control}
          name="skills"
          render={({ field }) => <SkillsInput skills={field.value ?? []} onChange={field.onChange} />}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField label="GitHub" placeholder="https://github.com/you" {...register('github')} />
          <TextField label="LinkedIn" placeholder="https://linkedin.com/in/you" {...register('linkedin')} />
          <TextField label="Portfolio" placeholder="https://you.dev" {...register('portfolio')} />
        </div>

        <Button type="submit" isLoading={isSaving} className="mt-2 self-start">
          Save changes
        </Button>
      </form>
    </div>
  );
}
