import { Router } from 'express';

export const router = Router();

import { protect, admin } from '../middlewares/auth.middleware.js';

import {
  bookEvent,
  sendBookingOtp,
  getMyBooking,
  confirmBooking,
  cancelBooking,
} from '../controllers/booking.controller.js';

router.post('/', protect, bookEvent);
router.post('/send-otp', protect, sendBookingOtp);
router.get('/my-booking', protect, getMyBooking);
router.put('/:id/confirm', protect, admin, confirmBooking);
router.delete('/:id', protect, cancelBooking);
