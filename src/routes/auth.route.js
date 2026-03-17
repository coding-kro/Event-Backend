import { Router } from 'express';

export const router = Router();

import {
  userRegisterController,
  userLoginController,
  userVerifyOtpController,
} from '../controllers/auth.controller.js';

// Register
router.post('/register', userRegisterController);

// verify otp
router.post('/verify-otp', userVerifyOtpController);

// Login
router.post('/login', userLoginController);
