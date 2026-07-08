import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app: Express = express();


app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World!');
});


const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
