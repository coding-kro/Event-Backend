import express from 'express';
import cors from 'cors';

export const app = express();


import cookieParser from 'cookie-parser';

import { router as authRouter } from './routes/auth.route.js';
import { router as eventsRouter } from './routes/events.route.js';
import { router as bookingRouter } from './routes/booking.route.js';

app.use(cors({
  origin:"http://localhost:5173",
    credentials: true
}))

// middleware
app.use(express.json());
app.use(cookieParser());

// auth router
app.use('/api/auth', authRouter);

// events router
app.use('/api/events', eventsRouter);

// booking router
app.use('/api/bookings', bookingRouter);
