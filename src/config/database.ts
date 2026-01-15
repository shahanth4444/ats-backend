import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}. ` +
    'Please check your .env file.'
  );
}

export const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 3,
    },
  }
);