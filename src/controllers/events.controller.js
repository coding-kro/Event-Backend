import { eventModel } from '../models/Event.model.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const filters = {};

    if (req.query.category) filters.category = req.query.category;
    if (req.query.location) filters.location = req.query.location;
    if (req.query.ticketPrice) filters.ticketPrice = req.query.ticketPrice;

    const events = await eventModel.find(filters);

    const formattedEvents = events.map((event) => ({
      ...event._doc,
      availableSeats: event.totalSeats - (event.bookedSeats || 0),
    }));

    return res.status(200).json({
      message: formattedEvents.length
        ? 'Events fetched successfully'
        : 'No events found',
      events: formattedEvents,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Unable to fetch events' });
  }
};

// Get event by id
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const event = await eventModel
      .findById(id)
      .populate('createdBy', 'username email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const bookedSeats = event.bookedSeats || 0;

    return res.status(200).json({
      message: 'Event fetched successfully',
      event: {
        ...event.toObject(),
        bookedSeats,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch event' });
  }
};

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'eventify' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(fileBuffer);
  });
};

// Create Event
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      location,
      category,
      totalSeats,
      ticketPrice,
    } = req.body;

    if (
      !title ||
      !description ||
      !date ||
      !location ||
      !category ||
      !totalSeats ||
      !ticketPrice
    ) {
      return res.status(400).json({
        message: 'Please fill all the input fields',
      });
    }

    let imageUrl = '';

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    } else {
      return res.status(400).json({ message: 'Event image is required' });
    }

    const event = await eventModel.create({
      title,
      description,
      date,
      location,
      category,
      totalSeats,
      availableSeats: totalSeats, // ✅ IMPORTANT FIX
      ticketPrice,
      imageUrl,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: 'Event created successfully',
      event,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to create event' });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const event = await eventModel.findById(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updateData = {};

    const fields = [
      'title',
      'description',
      'date',
      'location',
      'category',
      'ticketPrice',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // ✅ Safe totalSeats update
    if (req.body.totalSeats !== undefined) {
      const newTotal = Number(req.body.totalSeats);
      const bookedSeats = event.totalSeats - event.availableSeats;

      if (newTotal < bookedSeats) {
        return res.status(400).json({
          message: 'Total seats cannot be less than already booked seats',
        });
      }

      updateData.totalSeats = newTotal;
      updateData.availableSeats = newTotal - bookedSeats;
    }

    // Handle image update
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        updateData.imageUrl = result.secure_url;
      } catch (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    const updatedEvent = await eventModel.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    return res.status(200).json({
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Event update failed' });
  }
};

// Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const event = await eventModel.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    return res.status(200).json({
      message: 'Event deleted successfully',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete event' });
  }
};
