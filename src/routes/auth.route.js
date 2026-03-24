import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';

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

router.get('/me', protect, (req, res) => {
  res.json({
    user: req.user,
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});
