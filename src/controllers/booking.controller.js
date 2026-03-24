import { bookingModel } from '../models/Booking.model.js';
import { otpModel } from '../models/OTP.model.js';
import { eventModel } from '../models/Event.model.js';
import {
  sendBookingEmail,
  sendOTPEmail,
  sendCancellationEmail,
} from '../utils/email.js';
import { generateOTP } from './auth.controller.js';

// ================================
// SEND BOOKING OTP
// ================================
export const sendBookingOtp = async (req, res) => {
  try {
    const { email } = req.user;
    const otp = generateOTP();
    const action = 'event_verification';

    await otpModel.findOneAndDelete({ email, action });

    await otpModel.create({ email, otp, action });

    await sendOTPEmail(email, otp, action);

    return res.status(201).json({ message: 'OTP sent to email' });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// ================================
// BOOK EVENT (USER BOOKING → SEAT DECREASE)
// ================================
export const bookEvent = async (req, res) => {
  try {
    const { eventId, otp } = req.body;
    const { email, _id: userId } = req.user;
    const action = 'event_verification';

    // Validate OTP
    const otpRecord = await otpModel.findOne({ email, otp, action });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Prevent duplicate booking
    const existingBooking = await bookingModel.findOne({ userId, eventId });
    if (existingBooking) {
      return res.status(400).json({
        message: 'You already booked this event',
      });
    }

    // 🔥 ATOMIC SEAT DECREASE (IMPORTANT)
    const event = await eventModel.findOneAndUpdate(
      {
        _id: eventId,
        $expr: { $lt: ['$bookedSeats', '$totalSeats'] },
      },
      {
        $inc: { bookedSeats: 1 },
      },
      { returnDocument: 'after' },
    );

    if (!event) {
      return res.status(400).json({ message: 'No seats available' });
    }

    // Create booking (pending)
    const booking = await bookingModel.create({
      userId,
      eventId,
      status: 'pending',
      paymentStatus: 'unpaid',
      amount: event.ticketPrice,
    });

    // Clear OTP
    await otpModel.deleteMany({ email, action });

    return res.status(201).json({
      message: 'Booking successful',
      bookingId: booking._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Booking failed',
      error: error.message,
    });
  }
};

// ================================
// CONFIRM BOOKING (NO SEAT CHANGE)
// ================================
export const confirmBooking = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const { id } = req.params;

    if (!['paid', 'unpaid'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const booking = await bookingModel
      .findById(id)
      .populate('eventId')
      .populate('userId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'Already confirmed' });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = paymentStatus;
    await booking.save();

    await sendBookingEmail(
      booking.userId.email,
      booking.eventId.title,
      booking._id,
    );

    return res.status(200).json({
      message: 'Booking confirmed',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Booking confirmation failed',
      error: error.message,
    });
  }
};

// ================================
// GET BOOKINGS
// ================================
export const getMyBooking = async (req, res) => {
  try {
    const bookings =
      req.user.role === 'admin'
        ? await bookingModel
            .find()
            .populate('eventId')
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
        : await bookingModel
            .find({ userId: req.user._id })
            .populate('eventId')
            .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Bookings fetched',
      bookings,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};

// ================================
// CANCEL BOOKING (RESTORE SEAT)
// ================================
export const cancelBooking = async (req, res) => {
  try {
    const booking = await bookingModel
      .findById(req.params.id)
      .populate('eventId')
      .populate('userId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Allow owner OR admin
    if (
      booking.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // 🔥 Restore seat (ONLY because seat was already deducted at booking)
    await eventModel.findByIdAndUpdate(booking.eventId._id, {
      $inc: { bookedSeats: -1 },
    });

    await sendCancellationEmail(
      booking.userId.email,
      booking.eventId.title,
      booking._id,
    );

    await bookingModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};
