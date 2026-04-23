const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, verificationLink) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Outfittr <no-reply@outfittr.xyz>',
      to: [email],
      subject: 'Verify your account',
      html: `
        <h1>Welcome!</h1>
        <p>Thanks for signing up. Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Link: ${verificationLink}</p>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    return { success: false, err };
  }
};

// --- ADD THIS NEW FUNCTION ---
const sendResetEmail = async (email, resetLink) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Outfittr <no-reply@outfittr.xyz>',
      to: [email],
      subject: 'Reset your Outfittr password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Click the button below to set a new one:</p>
        <a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
    return error ? { success: false, error } : { success: true, data };
  } catch (err) {
    return { success: false, err };
  }
};

module.exports = { sendVerificationEmail, sendResetEmail };