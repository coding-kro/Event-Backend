import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

//  Booking Confirmation Email
export const sendBookingEmail = async (userEmail, userName, eventTitle) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: userEmail,
      subject: `Booking Confirmed: ${eventTitle}`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { 
            font-family: Arial, sans-serif;
            background-color: #f4f6f8;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto; 
            background-color: #ffffff;
            padding: 30px; 
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h2 {
           color: #333333;
          }
          p { 
            color: #555555; 
            line-height: 1.6;
          }
          .event-title { 
          font-weight: bold; 
          color: #1a73e8; 
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #888888;
            text-align: center;
            }
          .button { 
            display: inline-block; 
            padding: 10px 20px; 
            margin-top: 20px; 
            background-color: #1a73e8;
            color: #ffffff; 
            text-decoration: none;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Hi ${userName},</h2>
          <p>We are excited to confirm your booking for the event <span class="event-title">${eventTitle}</span>.</p>
          <p>Thank you for choosing Eventify. We look forward to seeing you at the event!</p>
          <a href="#" class="button">View Event Details</a>
          <div class="footer">&copy; ${new Date().getFullYear()} Eventify. All rights reserved.</div>
        </div>
      </body>
      </html>
      `,
    });

    console.log('Booking email sent');
  } catch (err) {
    console.error('Error sending booking email:', err);
  }
};

//  OTP Email with highlighted OTP box
export const sendOTPEmail = async (userEmail, otp, type) => {
  try {
    const title =
      type === 'account_verification'
        ? 'Verify Your Eventify Account'
        : 'Eventify Booking Verification';

    const msg =
      type === 'account_verification'
        ? 'Please use the following OTP to verify your new Eventify account.'
        : 'Please use the following OTP to verify and confirm your booking.';

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: userEmail,
      subject: title,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
          body { 
            font-family: Arial, sans-serif;
            background-color: #f4f6f8;
            margin: 0;
            padding: 0;
          }
          .container { 
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          h2 { 
            color: #333333;
           }
          p { 
            color: #555555;
            line-height: 1.6; 
          }
          .otp {
            display: inline-block;
            margin-top: 20px;
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            background: linear-gradient(135deg, #1a73e8, #4285f4);
            padding: 15px 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            letter-spacing: 3px;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #888888; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${title}</h2>
          <p>${msg}</p>
          <div class="otp">${otp}</div>
          <div class="footer">&copy; ${new Date().getFullYear()} Eventify. All rights reserved.</div>
        </div>
      </body>
      </html>
      `,
    });

    console.log('OTP email sent');
  } catch (err) {
    console.error('Error sending OTP email:', err);
  }
};

//  Booking Cancellation Email
export const sendCancellationEmail = async (userEmail, eventTitle) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: userEmail,
      subject: `Booking Cancelled: ${eventTitle}`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Cancellation</title>
        <style>
          body { 
            font-family: Arial, sans-serif;
            background-color: #f4f6f8;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto; 
            background-color: #ffffff;
            padding: 30px; 
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h2 {
            color: #333333;
          }
          p { 
            color: #555555; 
            line-height: 1.6;
          }
          .event-title { 
            font-weight: bold; 
            color: #d93025; 
          }
          .footer { 
            margin-top: 30px; 
            font-size: 12px; 
            color: #888888;
            text-align: center;
          }
          .button { 
            display: inline-block; 
            padding: 10px 20px; 
            margin-top: 20px; 
            background-color: #d93025;
            color: #ffffff; 
            text-decoration: none;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Booking Cancelled</h2>
          <p>Your booking for the event <span class="event-title">${eventTitle}</span> has been successfully cancelled.</p>
          <p>If you wish, you can rebook this event or explore other events on Eventify.</p>
          <a href="#" class="button">View Events</a>
          <div class="footer">&copy; ${new Date().getFullYear()} Eventify. All rights reserved.</div>
        </div>
      </body>
      </html>
      `,
    });
    console.log('Cancellation email sent');
  } catch (err) {
    console.error('Error sending cancellation email:', err);
  }
};
