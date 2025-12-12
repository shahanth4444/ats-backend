import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Hash the password so we don't store it in plain text
    const hashedPassword = await bcrypt.hash(password, 10);
    
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
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};