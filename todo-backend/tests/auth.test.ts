import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import request from "supertest";
import { app } from "../src/app";
import { environment } from "../src/config/environment";
import { signAccessToken, verifyAccessToken } from "../src/config/jwt";
import { AuthService } from "../src/modules/auth/auth.service";
import { registerSchema } from "../src/modules/auth/auth.validation";
import { UserRepository } from "../src/modules/users/user.repository";
import { AppError } from "../src/common/errors/AppError";

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    hash: jest.fn().mockResolvedValue("$2b$12$hashed-password"),
    compare: jest.fn()
  }
}));

describe("AuthService", () => {
  it("registers a user with a hashed password", async () => {
    const create = jest.fn().mockResolvedValue({
      id: "user-1",
      username: "siva"
    });
    const users = { create } as unknown as UserRepository;
    const service = new AuthService(users);

    const result = await service.register({
      username: "siva",
      password: "LongSecurePassword123"
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("LongSecurePassword123", 12);
    expect(create).toHaveBeenCalledWith({
      username: "siva",
      passwordHash: "$2b$12$hashed-password"
    });
    expect(result).toEqual({ id: "user-1", username: "siva" });
  });

  it("rejects login when credentials do not match", async () => {
    jest.mocked(bcrypt.compare).mockImplementation(async () => false);
    const users = {
      findByUsername: jest.fn().mockResolvedValue({
        id: "user-1",
        username: "siva",
        passwordHash: "$2b$12$hashed-password"
      })
    } as unknown as UserRepository;
    const service = new AuthService(users);

    await expect(service.login({
      username: "siva",
      password: "WrongPassword123"
    })).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS"
    });
  });

  it("logs in a user with valid credentials", async () => {
    jest.mocked(bcrypt.compare).mockImplementation(async () => true);
    const users = {
      findByUsername: jest.fn().mockResolvedValue({
        id: "user-1",
        username: "siva",
        passwordHash: "$2b$12$hashed-password"
      })
    } as unknown as UserRepository;
    const service = new AuthService(users);

    const result = await service.login({
      username: "siva",
      password: "LongSecurePassword123"
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "LongSecurePassword123",
      "$2b$12$hashed-password"
    );
    expect(result.user).toEqual({ id: "user-1", username: "siva" });
    expect(verifyAccessToken(result.accessToken)).toEqual({
      sub: "user-1",
      username: "siva"
    });
  });

  it("rejects unknown usernames with a generic authentication error", async () => {
    const users = {
      findByUsername: jest.fn().mockResolvedValue(null)
    } as unknown as UserRepository;
    const service = new AuthService(users);

    await expect(service.login({
      username: "unknown",
      password: "LongSecurePassword123"
    })).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS"
    });
  });

  it("enforces registration validation", () => {
    expect(() => registerSchema.parse({
      username: "si",
      password: "short"
    })).toThrow();
  });
});

describe("Authentication middleware", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects requests with no token", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required"
      }
    });
  });

  it("rejects invalid tokens", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects expired tokens", async () => {
    const expiredToken = jwt.sign(
      { username: "siva" },
      environment.JWT_SECRET,
      { subject: "user-1", expiresIn: -1 }
    );
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("registers a user through the API without exposing a password hash", async () => {
    jest.spyOn(UserRepository.prototype, "create").mockResolvedValue({
      id: "user-1",
      username: "siva",
      passwordHash: "$2b$12$hashed-password"
    } as never);

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ username: " siva ", password: "LongSecurePassword123" });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: { id: "user-1", username: "siva" }
    });
  });

  it("rejects duplicate usernames through the API", async () => {
    jest.spyOn(UserRepository.prototype, "create").mockRejectedValue(
      new AppError(409, "USERNAME_EXISTS", "Username already exists")
    );

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ username: "siva", password: "LongSecurePassword123" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("USERNAME_EXISTS");
  });

  it("sets an HTTP-only access-token cookie on login", async () => {
    jest.mocked(bcrypt.compare).mockImplementation(async () => true);
    jest.spyOn(UserRepository.prototype, "findByUsername").mockResolvedValue({
      id: "user-1",
      username: "siva",
      passwordHash: "$2b$12$hashed-password"
    } as never);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "siva", password: "LongSecurePassword123" });

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"][0]).toContain("accessToken=");
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(response.body.data.user).toEqual({ id: "user-1", username: "siva" });
  });

  it("returns the current user for a valid bearer token", async () => {
    jest.spyOn(UserRepository.prototype, "findById").mockResolvedValue({
      id: "user-1",
      username: "siva",
      passwordHash: "$2b$12$hashed-password"
    } as never);
    const token = signAccessToken("user-1", "siva");

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: "user-1", username: "siva" });
  });

  it("clears the access-token cookie on logout", async () => {
    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", "accessToken=token");

    expect(response.status).toBe(204);
    expect(response.headers["set-cookie"][0]).toContain("accessToken=");
  });
});
