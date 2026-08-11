import { IUser, Role, User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import {
  AccessTokenPayload,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { logger } from '../utils/logger';

interface AuthResult {
  user: Pick<IUser, '_id' | 'name' | 'email' | 'role'>;
  accessToken: string;
  refreshToken: string;
}

// Cap concurrent sessions per user so refreshTokens[] can't grow unbounded.
const MAX_ACTIVE_SESSIONS = 5;

function toPublicUser(user: IUser) {
  return { _id: user._id, name: user.name, email: user.email, role: user.role };
}

function issueTokenPair(user: IUser): { accessToken: string; refreshToken: string; hashedRefreshToken: string } {
  const accessToken = signAccessToken({ sub: user._id.toString(), email: user.email, role: user.role });
  const { token: refreshToken } = signRefreshToken(user._id.toString());
  return { accessToken, refreshToken, hashedRefreshToken: hashToken(refreshToken) };
}

export const authService = {
  async register(input: { name: string; email: string; password: string }): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw AppError.conflict('An account with this email already exists');
    }

    // role is intentionally never taken from `input` — it is impossible
    // for a client-supplied field to set anything other than the default.
    const user = await User.create({
      name: input.name,
      email: input.email,
      password: input.password,
      role: Role.USER,
    });

    const { accessToken, refreshToken, hashedRefreshToken } = issueTokenPair(user);
    user.refreshTokens = [hashedRefreshToken];
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('User registered', { userId: user._id.toString() });
    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await User.findOne({ email: input.email }).select('+password +refreshTokens');
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }
    if (!user.isActive) {
      throw AppError.forbidden('This account has been disabled');
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const { accessToken, refreshToken, hashedRefreshToken } = issueTokenPair(user);
    user.refreshTokens = [...user.refreshTokens, hashedRefreshToken].slice(-MAX_ACTIVE_SESSIONS);
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('User logged in', { userId: user._id.toString() });
    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  /**
   * Rotates the refresh token: the presented token is verified, then
   * atomically pulled from the stored hash list and replaced with a
   * freshly issued one.
   *
   * This uses two atomic findOneAndUpdate calls rather than fetch-then-
   * .save() specifically to avoid a race condition: if two requests
   * present the same refresh token at nearly the same time (e.g. React
   * StrictMode double-invoking an effect in development, or a retried
   * request), a read-modify-write would have both reads see the token
   * as present, and the second .save() would fail with a Mongoose
   * VersionError. With an atomic $pull conditioned on the token still
   * being in the array, only the first request's update actually
   * matches a document — the second legitimately gets "token not found"
   * (401) instead of a confusing 500.
   */
  async refresh(presentedToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(presentedToken);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const hashedPresented = hashToken(presentedToken);

    const userAfterPull = await User.findOneAndUpdate(
      { _id: payload.sub, isActive: true, refreshTokens: hashedPresented },
      { $pull: { refreshTokens: hashedPresented } },
      { new: true }
    ).select('+refreshTokens');

    if (!userAfterPull) {
      // Either the user doesn't exist/is inactive, or this exact token
      // was already rotated/revoked by a concurrent or earlier request.
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const { accessToken, refreshToken, hashedRefreshToken } = issueTokenPair(userAfterPull);

    const userAfterPush = await User.findByIdAndUpdate(
      payload.sub,
      { $push: { refreshTokens: { $each: [hashedRefreshToken], $slice: -MAX_ACTIVE_SESSIONS } } },
      { new: true }
    );

    if (!userAfterPush) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    return { user: toPublicUser(userAfterPush), accessToken, refreshToken };
  },

  async logout(userId: string, presentedToken: string | undefined): Promise<void> {
    if (!presentedToken) return;
    const hashedPresented = hashToken(presentedToken);
    await User.updateOne({ _id: userId }, { $pull: { refreshTokens: hashedPresented } });
  },

  async getCurrentUser(userId: string): Promise<Pick<IUser, '_id' | 'name' | 'email' | 'role'>> {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User no longer exists or is disabled');
    }
    return toPublicUser(user);
  },
};

export type { AccessTokenPayload };
