
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
      organisation,
      email,
      phone,
      address,
      reason,
      captcha
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields."
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

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const adminEmail = transporter.sendMail({
      from: `"CNMO UK Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `New Membership Application - ${fullName}`,
      html: `
        <h2>New Membership Application</h2>

        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Organisation:</strong> ${organisation || "N/A"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>

        <h3>Reason for Joining</h3>
        <p>${reason.replace(/\n/g, "<br>")}</p>
      `
    });

    const applicantEmail = transporter.sendMail({
      from: `"CNMO UK" <noreply@gmail.com>`,
      to: email,
      subject: "CNMO Membership Application Received",
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
          Thank you for submitting your application for membership
          of the Council of Nigerian Muslim Organisations (CNMO), UK.
        </p>

        <p>
          We have successfully received your application and it
          will be reviewed by the relevant team.
        </p>

        <p>
          We will contact you regarding the next steps in due course.
        </p>

        <p>
          Jazakumullahu Khairan.
        </p>

        <p>
          <strong>CNMO UK Secretariat</strong>
        </p>
      `
    });

    await Promise.all([
      adminEmail,
      applicantEmail
    ]);

    return res.status(200).json({
      success: true,
      message: "Membership application submitted successfully."
    });

  } catch (error) {
    console.error("Membership Form Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process your application at this time."
    });
  }
}
