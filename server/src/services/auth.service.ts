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
   * Rotates the refresh token: the presented token is verified, checked
   * against the stored hash list (so a logged-out/revoked token can't be
   * reused), removed, and replaced with a freshly issued one. This limits
   * the damage window if a refresh token is ever stolen.
   */
  async refresh(presentedToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(presentedToken);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(payload.sub).select('+refreshTokens');
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const hashedPresented = hashToken(presentedToken);
    if (!user.refreshTokens.includes(hashedPresented)) {
      // Token isn't in the known-valid list — either already used (rotation
      // reuse, a signal of theft) or explicitly revoked via logout.
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const { accessToken, refreshToken, hashedRefreshToken } = issueTokenPair(user);
    user.refreshTokens = user.refreshTokens
      .filter((t) => t !== hashedPresented)
      .concat(hashedRefreshToken)
      .slice(-MAX_ACTIVE_SESSIONS);
    await user.save();

    return { user: toPublicUser(user), accessToken, refreshToken };
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
