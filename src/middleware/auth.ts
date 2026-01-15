import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Validate JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is not defined. ' +
    'This is required for secure token verification. ' +
    'Please set JWT_SECRET in your .env file.'
  );
}

const SECRET_KEY = process.env.JWT_SECRET;

// Extend Express Request to include user data
export interface AuthRequest extends Request {
  user?: { id: number; role: string; companyId?: number };
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

// Check if user is a Candidate
export const requireCandidate = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'candidate') {
    return res.status(403).json({ error: 'Access denied: Candidates only' });
  }
  next();
};

// Check if user is a Hiring Manager
export const requireHiringManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'hiring_manager') {
    return res.status(403).json({ error: 'Access denied: Hiring Managers only' });
  }
  next();
};

// Check if user is a Recruiter or Hiring Manager
export const requireRecruiterOrHiringManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'recruiter' && req.user?.role !== 'hiring_manager') {
    return res.status(403).json({ error: 'Access denied: Recruiters or Hiring Managers only' });
  }
  next();
};