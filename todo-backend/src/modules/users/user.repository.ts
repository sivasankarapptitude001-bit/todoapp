import { UniqueConstraintError } from "sequelize";
import { AppError } from "../../common/errors/AppError";
import { User } from "./user.model";

export interface CreateUserInput {
  username: string;
  passwordHash: string;
}

export class UserRepository {
  async findByUsername(username: string): Promise<User | null> {
    return User.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  async create(input: CreateUserInput): Promise<User> {
    try {
      return await User.create({
        username: input.username,
        passwordHash: input.passwordHash
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new AppError(409, "USERNAME_EXISTS", "Username already exists");
      }
      throw error;
    }
  }
}
