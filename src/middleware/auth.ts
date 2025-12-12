import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key';

// Extend Express Request to include user data
export interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"

  if (!token) return res.sendStatus(401); // No token? Get out.

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.sendStatus(403); // Bad token? Forbidden.
    req.user = user;
    next(); // Valid token? Pass to the next function.
  });
};

// Check if user is a Recruiter
export const requireRecruiter = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'recruiter') {
    return res.status(403).json({ error: 'Access denied: Recruiters only' });
  }
  next();
};