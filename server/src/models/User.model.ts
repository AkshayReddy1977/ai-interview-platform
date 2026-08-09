import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface IEducationEntry {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: Date;
  endDate?: Date;
  description?: string;
}

export interface IExperienceEntry {
  company: string;
  title: string;
  startDate?: Date;
  endDate?: Date;
  current?: boolean;
  description?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  isActive: boolean;
  // Hashed refresh tokens currently valid for this user (supports multiple
  // devices; each login adds one, each logout/refresh rotates or removes one).
  refreshTokens: string[];
  lastLoginAt?: Date;
  comparePassword(candidate: string): Promise<boolean>;

  // --- Profile fields (Phase 3) ---
  phone?: string;
  location?: string;
  bio?: string;
  education: IEducationEntry[];
  experience: IExperienceEntry[];
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  activeResume?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never returned by default queries
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
      // No `select: false` — role is safe to read, it just must never be
      // client-settable. Enforced in the validator/service layer, not here.
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },

    // --- Profile fields (Phase 3) ---
    phone: { type: String, trim: true, maxlength: 30 },
    location: { type: String, trim: true, maxlength: 150 },
    bio: { type: String, trim: true, maxlength: 1000 },
    education: {
      type: [
        {
          institution: { type: String, required: true, trim: true },
          degree: { type: String, trim: true },
          fieldOfStudy: { type: String, trim: true },
          startDate: Date,
          endDate: Date,
          description: { type: String, maxlength: 1000 },
        },
      ],
      default: [],
    },
    experience: {
      type: [
        {
          company: { type: String, required: true, trim: true },
          title: { type: String, required: true, trim: true },
          startDate: Date,
          endDate: Date,
          current: { type: Boolean, default: false },
          description: { type: String, maxlength: 1000 },
        },
      ],
      default: [],
    },
    skills: { type: [String], default: [] },
    github: { type: String, trim: true, maxlength: 300 },
    linkedin: { type: String, trim: true, maxlength: 300 },
    portfolio: { type: String, trim: true, maxlength: 300 },
    activeResume: { type: Schema.Types.ObjectId, ref: 'Resume' },
  },
  { timestamps: true }
);

// Note: `unique: true` on the email field above already creates this index;
// no separate schema.index() call needed (that caused a duplicate-index
// warning at startup).

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Never leak password/refreshTokens even if a controller forgets to exclude them.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.password;
    delete obj.refreshTokens;
    delete obj.__v;
    return obj;
  },
});

export const User = model<IUser>('User', userSchema);
