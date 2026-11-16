import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

export interface JwtPayload {
  userId: string;
  role: string;
  username: string;
  orgId?: string;
  campusId?: string;
}

export interface Context {
  user: JwtPayload | null;
  db: typeof db;
}

export async function createContext(req: Request): Promise<Context> {
  let user: JwtPayload | null = null;

  const authHeader = req.headers.authorization ?? '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      user = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as JwtPayload;
    } catch {
      // Invalid or expired token — treat as unauthenticated
    }
  }

  return { user, db };
}
