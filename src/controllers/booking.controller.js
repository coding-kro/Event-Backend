import { bookingModel } from '../models/Booking.model.js';
import { otpModel } from '../models/OTP.model.js';
import { eventModel } from '../models/Event.model.js';
import {
  sendBookingEmail,
  sendOTPEmail,
  sendCancellationEmail,
} from '../utils/email.js';
import { generateOTP } from './auth.controller.js';

// SEND BOOKING OTP
export const sendBookingOtp = async (req, res) => {
  try {
    const { email } = req.user;
    const otp = generateOTP();
    const action = 'event_verification';

    // Remove any previous OTP for this action
    await otpModel.findOneAndDelete({ email, action });

    await otpModel.create({ email, otp, action });

    await sendOTPEmail(email, otp, action);

    return res.status(201).json({ message: 'OTP sent to email' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to send OTP', error: error.message });
  }
};

// BOOK EVENT
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

    // Atomic seat decrement
    const event = await eventModel.findOneAndUpdate(
      { _id: eventId, totalSeats: { $gt: 0 } },
      { $inc: { totalSeats: -1 } },
      { new: true },
    );

    if (!event) {
      return res.status(400).json({ message: 'No seats available' });
    }

    // Check if user already booked
    const existingBooking = await bookingModel.findOne({ userId, eventId });
    if (existingBooking) {
      // Restore seat if already booked
      await eventModel.findByIdAndUpdate(eventId, { $inc: { totalSeats: 1 } });
      return res.status(400).json({ message: 'You already booked this event' });
    }

    // Create booking
    const booking = await bookingModel.create({
      userId,
      eventId,
      status: 'pending',
      paymentStatus: 'unpaid',
      amount: event.ticketPrice,
    });

    // Remove used OTP
    await otpModel.deleteMany({ email, action });

    return res.status(201).json({
      message: 'Booking created, please confirm payment to finalize',
      bookingId: booking._id,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Booking failed', error: error.message });
  }
};

// CONFIRM BOOKING
export const confirmBooking = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const { id } = req.params;
    const { email } = req.user;

    if (!['paid', 'unpaid'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const booking = await bookingModel.findById(id).populate('eventId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'Booking already confirmed' });
    }

    // Confirm booking
    booking.status = 'confirmed';
    booking.paymentStatus = paymentStatus;
    await booking.save();

    // Send confirmation email
    await sendBookingEmail(email, booking.eventId.title, booking._id);

    return res.status(200).json({ message: 'Booking confirmed' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Booking confirmation failed', error: error.message });
  }
};

// GET USER BOOKINGS
export const getMyBooking = async (req, res) => {
  try {
    const bookings = await bookingModel
      .find({ userId: req.user._id })
      .populate('eventId')
      .sort({ createdAt: -1 });

    return res.status(200).json({ message: 'Bookings fetched', bookings });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch bookings', error: error.message });
  }
};

// CANCEL BOOKING
export const cancelBooking = async (req, res) => {
  try {
    const booking = await bookingModel
      .findById(req.params.id)
      .populate('eventId');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Restore seat if booking was confirmed
    if (booking.status === 'confirmed') {
      await eventModel.findByIdAndUpdate(booking.eventId._id, {
        $inc: { totalSeats: 1 },
      });
    }

    //send cancellation email
    await sendCancellationEmail(
      req.user.email,
      booking.eventId.title,
      booking._id,
    );

    // Delete booking
    await bookingModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: 'Booking cancelled' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to cancel booking', error: error.message });
  }
};
