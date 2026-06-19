

import nodemailer from "nodemailer";
import axios from "axios";

export default async function handler(req, res) {

    if (req.method !== "POST") {
    return res.status(405).json({
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

    if (!captcha) {
      return res.status(400).json({
        message: "Please complete reCAPTCHA"
      });
    }

    const verify = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET,
          response: captcha
        }
      }
    );

    if (!verify.data.success) {
      return res.status(400).json({
        message: "reCAPTCHA verification failed"
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `Website Contact: ${subject}`,
      html: `
        <h2>New Message</h2>

        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>

        <hr>

        <p>${message}</p>
      `
    });

    await transporter.sendMail({
      from: `"CNMO UK" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank You for Contacting CNMO UK",
      html: `
        <p>Assalamu Alaikum ${fullName},</p>

        <p>
          Thank you for contacting the Council of Nigerian Muslim Organisations (CNMO), UK.
          We have received your message and will respond shortly.
        </p>

        <p>Jazakum Allahu Khairan.</p>

        <p>CNMO UK Secretariat</p>
      `
    });

    return res.status(200).json({
      success: true
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: error.message
    });
  }
}