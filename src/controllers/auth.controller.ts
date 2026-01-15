import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

// Validate JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is not defined. ' +
    'This is required for secure token generation. ' +
    'Please set JWT_SECRET in your .env file.'
  );
}

const SECRET_KEY = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Hash the password so we don't store it in plain text
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    // FIX IS HERE: Added "as string" to tell TypeScript the password definitely exists
    if (!user || !(await bcrypt.compare(password, user.getDataValue('password') as string))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a Token
    const token = jwt.sign(
      { id: user.id, role: user.getDataValue('role') },
      SECRET_KEY,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.json({ token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};