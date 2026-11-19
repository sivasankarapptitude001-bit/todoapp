import bcrypt from "bcrypt";
import { environment } from "../../config/environment";
import { signAccessToken } from "../../config/jwt";
import { AppError } from "../../common/errors/AppError";
import { UserRepository } from "../users/user.repository";
import { LoginInput, RegisterInput } from "./auth.validation";

export class AuthService {
  constructor(private readonly users = new UserRepository()) {}

  async register(input: RegisterInput) {
    const passwordHash = await bcrypt.hash(input.password, environment.BCRYPT_ROUNDS);
    const user = await this.users.create({
      username: input.username,
      passwordHash
    });

    return { id: user.id, username: user.username };
  }

  async login(input: LoginInput) {
    const user = await this.users.findByUsername(input.username);
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid username or password");
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid username or password");
    }

    const accessToken = signAccessToken(user.id, user.username);
    return {
      accessToken,
      user: { id: user.id, username: user.username }
    };
  }

  async getUserById(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }
    return { id: user.id, username: user.username };
  }
}
