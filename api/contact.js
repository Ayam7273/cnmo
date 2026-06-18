

import nodemailer from "nodemailer";
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const {
      fullName,
      email,
      subject,
      message,
      captcha
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Verify reCAPTCHA
    if (!captcha) {
      return res.status(400).json({
        success: false,
        message: "Please complete the reCAPTCHA verification."
      });
    }

    const captchaResponse = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET,
          response: captcha
        }
      }
    );

    if (!captchaResponse.data.success) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed."
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email to CNMO UK
    const adminEmail = transporter.sendMail({
      from: `"CNMO UK Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `Website Contact: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>

        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>

        <hr>

        <p>${message}</p>
      `
    });

    // Auto-response to sender
    const autoReply = transporter.sendMail({
      from: `"CNMO UK" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank You for Contacting CNMO UK",
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:650px;margin:auto;line-height:1.6;color:#333;">

          <div style="background:#0f5132;padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;">
              Council of Nigerian Muslim Organisations (CNMO), UK
            </h1>
          </div>

          <div style="padding:30px;">

            <p>Assalamu Alaikum ${fullName},</p>

            <p>
              Thank you for contacting the Council of Nigerian Muslim Organisations (CNMO), UK.
              We have successfully received your message and appreciate your interest in our organisation.
            </p>

            <p>
              A member of our team will review your enquiry and respond as soon as possible.
            </p>

            <h3>Your Submission</h3>

            <p><strong>Subject:</strong> ${subject}</p>

            <div style="background:#f8f9fa;padding:15px;border-left:4px solid #0f5132;">
              ${message}
            </div>

            <p style="margin-top:25px;">
              Jazakum Allahu Khairan for reaching out to us.
            </p>

            <p>
              Kind regards,<br>
              <strong>CNMO UK Secretariat</strong><br>
              Council of Nigerian Muslim Organisations (CNMO), UK
            </p>

          </div>

          <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#666;">
            © CNMO UK | https://cnmo.uk
          </div>

        </div>
      `
    });

    await Promise.all([adminEmail, autoReply]);

    return res.status(200).json({
      success: true,
      message: "Message sent successfully"
    });

  } catch (error) {
    console.error("Contact Form Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message
    });
  }
}