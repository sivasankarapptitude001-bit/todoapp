import jwt, { SignOptions } from "jsonwebtoken";
import { environment } from "./environment";

export interface JwtPayload {
  sub: string;
  username: string;
}

export function signAccessToken(userId: string, username: string): string {
  return jwt.sign(
    { username },
    environment.JWT_SECRET,
    { subject: userId, expiresIn: environment.JWT_EXPIRES_IN } as SignOptions
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, environment.JWT_SECRET);
  if (
    typeof payload === "string"
    || typeof payload.sub !== "string"
    || typeof payload.username !== "string"
  ) {
    throw new Error("Invalid token payload");
  }
  return { sub: payload.sub, username: payload.username };
}
