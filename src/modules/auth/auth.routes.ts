import { Router } from 'express';
import { register, login, refreshToken, logout, getMe } from './auth.controller.js';
import { validateRequest } from '../../shared/middlewares/validation.middleware.js';
import { auth } from '../../shared/middlewares/auth.middleware.js';
import { registerSchema, loginSchema } from './auth.dto.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', auth, getMe);

export const authRoutes = router;
export default authRoutes;
