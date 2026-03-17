import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
    },
    description: {
      type: String,
      required: [true, 'description is required'],
    },
    date: {
      type: Date,
      required: [true, 'date is required'],
    },
    location: {
      type: String,
      required: [true, 'location is required'],
    },
    category: {
      type: String,
      required: [true, 'category is required'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'total seats is required'],
    },
    availableSeats: {
      type: Number,
      required: [true, 'available seats is required'],
    },
    ticketPrice: {
      type: Number,
      required: [true, 'ticket price is required'],
    },
    imageUrl: {
      type: String,
      required: [true, 'image is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user details is required'],
    },
  },
  { timestamps: true },
);

export const eventModel = mongoose.model('Events', eventSchema);
