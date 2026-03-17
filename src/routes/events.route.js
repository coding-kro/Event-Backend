import { Router } from 'express';

export const router = Router();

import { protect, admin } from '../middlewares/auth.middleware.js';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/events.controller.js';
import upload from '../middlewares/upload.middleware.js';

// Get all Events
router.get('/', getAllEvents);

// Get Event by ID
router.get('/:id', getEventById);

// Create Event (Admin Only)
router.post(
  '/create-event',
  protect,
  admin,
  upload.single('image'),
  createEvent,
);

// Update Event(Admin Only)
router.put('/:id', protect, admin, upload.single('image'), updateEvent);

// Delete Events (Admin Only)
router.delete('/:id', protect, admin, deleteEvent);
