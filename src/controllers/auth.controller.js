import { userModel } from '../models/User.model.js';
import jwt from 'jsonwebtoken';
import { sendOTPEmail } from '../utils/email.js';
import { otpModel } from '../models/OTP.model.js';
import bcrypt from 'bcrypt';

// Generate OTP
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate token
export function generateToken(userId, userRole) {
  return jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
    expiresIn: '3d',
  });
}

// Register user
export async function userRegisterController(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Username, email and password is required',
      });
    }

    // Check existing user
    const isUserExists = await userModel.findOne({ email });

    if (isUserExists) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    // Create user
    const user = await userModel.create({
      username,
      email,
      password,
      role: 'user',
      isVerified: false,
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, 
      sameSite: 'None',
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    // Genrate OTP
    const otp = generateOTP();
    // console.log(`OTP for ${email}: ${otp}`);

    // Save OTP
    await otpModel.create({
      email,
      otp,
      action: 'account_verification',
    });

    // Send email
    await sendOTPEmail(email, otp, 'account_verification');

    return res.status(201).json({
      message:
        'User register successfully. Please check your email for OTP to verify your account.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

// Verify OTP
export async function userVerifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required',
      });
    }

    const otpRecord = await otpModel.findOne({
      email,
      otp,
      action: 'account_verification',
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: 'Invalid or expired OTP',
      });
    }

    const user = await userModel.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    await otpModel.deleteMany({
      email,
      action: 'account_verification',
    });

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, 
      sameSite: 'None',
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: 'Account verified successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

//Login user
export async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await userModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials, please sign up first',
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    if (!user.isVerified && user.role === 'user') {
      const otp = generateOTP();

      await otpModel.deleteMany({
        email,
        action: 'account_verification',
      });

      await otpModel.create({
        email,
        otp,
        action: 'account_verification',
      });

      await sendOTPEmail(email, otp, 'account_verification');

      return res.status(403).json({
        message: 'Account not verified. A new OTP has been sent to your email.',
      });
    }

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, 
      sameSite: 'None',
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
