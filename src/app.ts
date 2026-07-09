import 'dotenv/config';
import express, { type Express, type Request, type Response } from 'express';
import pg from 'pg';
import cookieParser from 'cookie-parser';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { categoryRoutes } from './modules/category/category.routes.js';
import { gearRoutes, providerGearRoutes } from './modules/gear/gear.routes.js';
import { rentalRoutes, providerOrderRoutes } from './modules/rental/rental.routes.js';
import { paymentRoutes } from './modules/payment/payment.routes.js';
import { reviewRoutes } from './modules/review/review.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { globalErrorHandler } from './shared/middlewares/error.middleware.js';
import { AppError } from './shared/utils/app-error.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './shared/utils/swagger.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const app: Express = express();

app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(cookieParser());

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World!');
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Category routes
app.use('/api/categories', categoryRoutes);

// Gear routes
app.use('/api/gear', gearRoutes);
app.use('/api/provider/gear', providerGearRoutes);

// Rental & Order routes
app.use('/api/rentals', rentalRoutes);
app.use('/api/provider/orders', providerOrderRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Swagger Documentation
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.js'
    ]
  })
);
 
// Handle 404 Not Found
app.use((req: Request, res: Response, next) => {
  next(new AppError(404, `Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// Global Error Handler (Must be registered after all routes/middlewares)
app.use(globalErrorHandler);

const port = Number(process.env.PORT ?? 3000);
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  }); 
}

export default app;
