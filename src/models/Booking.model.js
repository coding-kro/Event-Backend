import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user details are required'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Events',
      required: [true, 'event details is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
  },
  { timestamps: true },
);

export const bookingModel = mongoose.model('Booking', bookingSchema);
