import jwt from "jsonwebtoken";

const SECRET = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET not set in environment");
  return s;
};

export interface JwtPayload {
  userId: number;
  adminId: number;
  role: string;
  email: string;
}

// Access token: 7 days
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET(), { expiresIn: "7d" });
}

// Refresh token: 30 days
export function signRefreshToken(payload: Pick<JwtPayload, "userId">): string {
  return jwt.sign(payload, SECRET(), { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET()) as JwtPayload;
}
