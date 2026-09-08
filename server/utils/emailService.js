const nodemailer = require("nodemailer");

function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendClassInviteEmail({ to, studentName, className, joinLink }) {
  const subject = `You've been added to ${className} on Smart-Class`;
  const html = `
    <p>Hi ${studentName},</p>
    <p>Your teacher has added you to <strong>${className}</strong> on Smart-Class.</p>
    <p>Click below to join the classroom:</p>
    <p><a href="${joinLink}" style="background:#007AFF;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Join Classroom</a></p>
    <p>Or copy this link: ${joinLink}</p>
  `;

  const transporter = getTransporter();

  if (!transporter) {
    console.log("─────────────────────────────────────────");
    console.log("📧  [DEV MODE] No SMTP configured — simulated email:");
    console.log("   To:", to);
    console.log("   Subject:", subject);
    console.log("   Join link:", joinLink);
    console.log("─────────────────────────────────────────");
    return { simulated: true };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "Smart-Class <no-reply@smartclass.edu>",
    to,
    subject,
    html,
  });
  return { simulated: false };
}

module.exports = { sendClassInviteEmail };
