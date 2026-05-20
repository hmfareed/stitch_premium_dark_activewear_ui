import nodemailer from 'nodemailer';

// Configure SMTP transport
// In a real app, these should be in environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // If SMTP credentials are not set, log the email for development
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('--- EMAIL SIMULATION ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: (HTML Content length: ${html.length})`);
      console.log('------------------------');
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: `"AfriCart Marketplace" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

export const getEmailTemplate = (title: string, body: string, actionText?: string, actionLink?: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background: #0a0a0a; color: #ffffff; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 20px; padding: 40px; border: 1px solid #333; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { color: #00e5ff; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #fff; }
    .body { font-size: 16px; line-height: 1.6; color: #ccc; margin-bottom: 30px; }
    .button { display: inline-block; padding: 14px 28px; background: #c3f400; color: #000; border-radius: 12px; text-decoration: none; font-weight: 800; text-transform: uppercase; font-size: 14px; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">AfriCart</div>
    </div>
    <div class="title">${title}</div>
    <div class="body">${body}</div>
    ${actionText && actionLink ? `<div style="text-align: center;"><a href="${actionLink}" class="button">${actionText}</a></div>` : ''}
    <div class="footer">
      &copy; ${new Date().getFullYear()} AfriCart Marketplace. All rights reserved.<br>
      High-Quality Activewear & More.
    </div>
  </div>
</body>
</html>
`;
