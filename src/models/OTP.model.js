import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
  },
  action: {
    type: String,
    enum: ['account_verification', 'event_verification'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, //OTP expires after 5 minutes
  },
});

export const otpModel = mongoose.model('otp', otpSchema);
