import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize('ats_db', 'user', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false, // Set to console.log to see raw SQL queries
});