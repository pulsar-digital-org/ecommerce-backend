import { User, UserInterface } from '../db/models/User';
import { generateHash } from './auth';

import { AlreadyExistsError, BadRequestError, NotFoundError } from '../errors';
import { Op, Transaction } from 'sequelize';
import { UserRole } from '../db/types';
import db from '../db/db';
import { UserCreation, UserModifiable } from '../types/user';

async function userCreate(data: UserCreation, existing_user?: User): Promise<UserInterface> {
  const { username, email, plainPassword: password } = data;

  if (!username || !email || !password)
    throw new BadRequestError('Credentials not provided');

  var user = await User.findOne({
    where: {
      [Op.or]: {
        email: email,
        username: username
      }
    }
  });

  if (user)
    throw new AlreadyExistsError(
      'User with the same username or email already exists'
    );

  const hash = await generateHash(password);

  if (existing_user) {
    if (existing_user.role !== UserRole.guest) {
      throw new BadRequestError('User is already registered');
    }

    user = existing_user;

    user.set({ username, email, passwordHash: hash, role: UserRole.user });
  } else {
    user = User.build({ username, email, passwordHash: hash, role: UserRole.user });
  }

  try {
    await user.validate();
  } catch (err) {
    throw new BadRequestError(`Invalid user data: ${err}`);
  }

  await user.save();

  return user.data();
}

async function userCreateGuest() {
  const user = User.build({
    role: UserRole.guest
  });

  try {
    await user.validate();
  } catch (err) {
    throw new BadRequestError(
      `Something went wrong ${err}`
    );
  }

  await user.save();

  return user;
}

async function userGet(userId: string, options?: { transaction?: Transaction }) {
  const user = await User.findByPk(userId, options);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

async function userGetMultiple(
  options: { page?: number; size?: number } = {},
  filters: { [key: string]: string | undefined | null } = {}
): Promise<{ users: UserInterface[], total: number, page: number, size: number }> {
  const { page = 1, size = 10 } = options;

  if (page < 1 || size < 1) throw new BadRequestError("Invalid pagination params");

  const offset = (page - 1) * size;

  const filteredEntries = Object.entries(filters).filter(
    ([_, value]) =>
      value !== undefined &&
      value !== 'undefined' &&
      value !== null &&
      value !== ''
  );

  const conditions = filteredEntries.map(([key, value]) => ({
    [key]: {
      [Op.iLike]: `%${value}%`,
    },
  }));

  const queryOptions = {
    limit: Math.min(size, 10),
    offset,
    where: conditions.length > 0 ? { [Op.and]: conditions } : {},
  };

  const { rows, count } = await User.findAndCountAll({
    ...queryOptions,
    order: [['createdAt', 'DESC']],
  });

  const users = await Promise.all(rows.map(async (user) => user.data()));

  return { users, total: count, page, size };
}

// userRequested is the user that requested the update
async function userUpdate(
  userRequested: User,
  user: User,
  data: UserModifiable
) {
  const { role, ...userData } = data;

  user.set(userData);

  // Possible token update with admin privileges
  if (userRequested.isOwner() && role && userRequested.id !== user.id) {
    user.set({ role });
  }

  try {
    await user.validate();
  } catch (err) {
    throw new BadRequestError('User validation failed');
  }

  await user.save();

  return user.data();
}

async function userDelete(user: User) {
  await db.transaction(async (t: Transaction) => {
    await user.destroy({ transaction: t });
  })
}

export {
  userCreate,
  userGet,
  userGetMultiple,
  userUpdate,
  userDelete,
  userCreateGuest
};
