import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

class PrismaService {
  private static instance: PrismaClient;

  public static getClient(): PrismaClient {
    if (!PrismaService.instance) {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL is not set in the environment variables');
      }

      const pool = new pg.Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      PrismaService.instance = new PrismaClient({ adapter });
    }

    return PrismaService.instance;
  }
}

export const prisma = PrismaService.getClient();
export default PrismaService;
