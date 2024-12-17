// mailer.js
const nodemailer = require("nodemailer");

// Mail credentials (replace with your actual credentials)
const EMAIL = process.env.EMAIL; // Your email address
const PASSWORD = process.env.PASSWORD; // Your email password or app password

// Create a transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (Gmail, Outlook, etc.)
  auth: {
    user: EMAIL,
    pass: PASSWORD,
  },
});

/**
 * Function to send email
 * @param {string} to - Recipient's email address
 * @param {string} subject - Subject of the email
 * @param {string} text - Plain text email body
 * @param {string} html - HTML email body
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: EMAIL,
    to: to,
    subject: subject,
    text: text,
    html: html, // HTML content for rich email
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
