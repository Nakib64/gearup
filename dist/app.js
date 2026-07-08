import 'dotenv/config';
import express, {} from 'express';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app = express();
app.use(express.json());
app.get('/', (_req, res) => {
    res.send('Hello World!');
});
app.get('/users', async (_req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});
app.post('/users', async (req, res) => {
    const { email, name } = req.body;
    const user = await prisma.user.create({ data: { email, name } });
    res.status(201).json(user);
});
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
