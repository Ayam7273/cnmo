
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
      phone,
      location,
      message,
      captcha
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !location) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields."
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

    // Create mail transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email to CNMO
    const adminEmail = transporter.sendMail({
      from: `"CNMO UK Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `New Friend Sign-Up: ${fullName}`,
      html: `
        <h2>New Friend of CNMO Registration</h2>

        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Location:</strong> ${location}</p>

        <hr>

        <h3>Support Message</h3>

        <p>${(message || "No message provided").replace(/\n/g, "<br>")}</p>

        <hr>

        <p>
          <strong>Submitted:</strong>
          ${new Date().toLocaleString("en-GB")}
        </p>
      `
    });

    // Welcome Email
    const welcomeEmail = transporter.sendMail({
      from: `"CNMO UK" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome as a Friend of CNMO UK",
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:650px;margin:auto;line-height:1.7;color:#333;">

          <div style="background:#0f5132;padding:20px;text-align:center;">
            <h1 style="margin:0;color:#fff;">
              Welcome to CNMO UK
            </h1>
          </div>

          <div style="padding:30px;">

            <p>Assalamu Alaikum ${fullName},</p>

            <p>
              Thank you for signing up as a Friend of the
              Council of Nigerian Muslim Organisations (CNMO), UK.
            </p>

            <p>
              We are delighted to welcome you to our growing community
              of supporters and well-wishers.
            </p>

            <p>
              As a Friend of CNMO UK, you will receive updates about
              our activities, community initiatives, events, and
              opportunities to support our mission.
            </p>

            <p>
              We appreciate your willingness to stand with us in
              promoting unity, service, education, community welfare,
              and positive engagement.
            </p>

            <p>
              Jazakumullahu Khairan for your support.
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

    await Promise.all([
      adminEmail,
      welcomeEmail
    ]);

    return res.status(200).json({
      success: true,
      message: "Friend registration submitted successfully."
    });

  } catch (error) {
    console.error("Friend Form Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process your registration at this time."
    });
  }
}