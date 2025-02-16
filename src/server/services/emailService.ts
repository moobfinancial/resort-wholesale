import nodemailer from 'nodemailer';

// Hostinger SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.SMTP_USER || 'noreply@resort-accessories.shop',
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

export const sendVerificationEmail = async (to: string, token: string) => {
  const verificationUrl = `https://resort-accessories.shop/verify-email/${token}`;

  await transporter.sendMail({
    from: '"Resort Accessories" <noreply@resort-accessories.shop>',
    to,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Resort Accessories!</h2>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Verify Email
        </a>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eaeaea;" />
        <p style="color: #666; font-size: 14px;">
          Resort Accessories<br />
          Kingston, Jamaica<br />
          support@resort-accessories.shop
        </p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetUrl = `https://resort-accessories.shop/reset-password/${token}`;

  await transporter.sendMail({
    from: '"Resort Accessories" <noreply@resort-accessories.shop>',
    to,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Reset Password
        </a>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eaeaea;" />
        <p style="color: #666; font-size: 14px;">
          Resort Accessories<br />
          Kingston, Jamaica<br />
          support@resort-accessories.shop
        </p>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async (to: string, firstName: string) => {
  await transporter.sendMail({
    from: '"Resort Accessories" <noreply@resort-accessories.shop>',
    to,
    subject: 'Welcome to Resort Accessories!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${firstName}!</h2>
        <p>Thank you for joining Resort Accessories. We're excited to have you as a member of our community.</p>
        <p>Here are a few things you can do:</p>
        <ul style="padding-left: 20px; line-height: 1.6;">
          <li>Browse our latest wholesale products</li>
          <li>Update your profile and preferences</li>
          <li>Contact our support team if you need assistance</li>
        </ul>
        <p>If you have any questions, feel free to reach out to us at support@resort-accessories.shop</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eaeaea;" />
        <p style="color: #666; font-size: 14px;">
          Resort Accessories<br />
          Kingston, Jamaica<br />
          support@resort-accessories.shop
        </p>
      </div>
    `,
  });
};
