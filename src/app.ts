import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';
import pg from 'pg';
import cookieParser from 'cookie-parser';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { globalErrorHandler } from './shared/middlewares/error.middleware.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app: Express = express();

app.use(express.json());
app.use(cookieParser());

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World!');
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Global Error Handler (Must be registered after all routes/middlewares)
app.use(globalErrorHandler);

const port = Number(process.env.PORT ?? 3000);
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export default app;
