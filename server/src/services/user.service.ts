import { IUser, User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { UpdateProfileInput } from '../validators/user.validator';

export const userService = {
  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId).populate('activeResume');
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
    // Whitelisting via the validator schema already guarantees `role`,
    // `email`, `password` etc. cannot appear on `input` — this is a second,
    // explicit layer of defense in case the validator is ever loosened.
    const { name, phone, location, bio, education, experience, skills, github, linkedin, portfolio } = input;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { name, phone, location, bio, education, experience, skills, github, linkedin, portfolio } },
      { new: true, runValidators: true, omitUndefined: true }
    );

    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  },
};
