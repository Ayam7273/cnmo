
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
      skills,
      availability,
      message,
      captcha
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !location ||
      !skills ||
      !availability
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

    // Email to CNMO
    const adminEmail = transporter.sendMail({
      from: `"CNMO UK Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `New Volunteer Registration - ${fullName}`,
      html: `
        <h2>New Volunteer Registration</h2>

        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Location:</strong> ${location}</p>

        <hr>

        <p><strong>Availability:</strong> ${availability}</p>

        <h3>Skills / Interests</h3>
        <p>${skills.replace(/\n/g, "<br>")}</p>

        <h3>Additional Information</h3>
        <p>${(message || "None provided").replace(/\n/g, "<br>")}</p>

        <hr>

        <p>
          <strong>Submitted:</strong>
          ${new Date().toLocaleString("en-GB")}
        </p>
      `
    });

    // Auto-response
    const volunteerEmail = transporter.sendMail({
      from: `"CNMO UK" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Volunteer Registration Received",
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:650px;margin:auto;line-height:1.7;color:#333;">

          <div style="background:#0f5132;padding:20px;text-align:center;">
            <h1 style="margin:0;color:#fff;">
              Thank You for Volunteering
            </h1>
          </div>

          <div style="padding:30px;">

            <p>Assalamu Alaikum ${fullName},</p>

            <p>
              JazakAllahu Khayran for registering as a volunteer with
              the Council of Nigerian Muslim Organisations (CNMO), UK.
            </p>

            <p>
              We appreciate your willingness to contribute your time,
              skills, and experience to support our community initiatives.
            </p>

            <p>
              Our team will review your registration and contact you
              regarding suitable volunteering opportunities.
            </p>

            <p>
              We look forward to working with you in service to our
              community.
            </p>

            <p>
              Jazakumullahu Khairan,<br>
              <strong>CNMO UK Secretariat</strong>
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
      volunteerEmail
    ]);

    return res.status(200).json({
      success: true,
      message: "Volunteer registration submitted successfully."
    });

  } catch (error) {
    console.error("Volunteer Form Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process your registration at this time."
    });
  }
}