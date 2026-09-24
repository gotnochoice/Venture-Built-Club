const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

async function sendCopyEmail({ subject, html }) {
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_APP_PASSWORD) {
    console.error('ZOHO_EMAIL/ZOHO_APP_PASSWORD not set, skipping notification email');
    return;
  }
  await getTransporter().sendMail({
    from: process.env.ZOHO_EMAIL,
    to: process.env.ZOHO_EMAIL,
    subject,
    html,
  });
}

module.exports = { sendCopyEmail };
