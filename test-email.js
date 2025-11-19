// Quick test to verify SMTP credentials work
require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('📧 Testing SMTP configuration...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'GharSe'}" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Test Email from GharSe',
      html: '<h1>✅ Email is working!</h1><p>Your SMTP configuration is correct.</p>',
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP test failed:', error.message);
  }
}

testEmail();
