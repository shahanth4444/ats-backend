import request from 'supertest';
import app from '../../server';
import { sequelize } from '../../config/database';

describe('Auth Integration Tests', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new candidate', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'John Doe',
                    email: 'john@example.com',
                    password: 'password123',
                    role: 'candidate'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('userId');
        });

        it('should reject registration with invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Jane Doe',
                    email: 'invalid-email',
                    password: 'password123',
                    role: 'candidate'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('errors');
        });

        it('should reject registration with short password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    password: '123',
                    role: 'candidate'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Register a user first
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    role: 'candidate'
                });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        it('should reject login with invalid password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });

        it('should reject login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
        });
    });
});
