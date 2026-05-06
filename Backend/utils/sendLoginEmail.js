const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendLoginEmail(userEmail, userName) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email credentials are missing. Login email was not sent.");
        return;
    }

    const loginTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
    });

    await transporter.sendMail({
        from: `"Product System" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Successful Login - Product System",
        html: `
            <h2>Login Successful</h2>
            <p>Hello ${userName || "User"},</p>
            <p>Your account was successfully logged in.</p>
            <p><strong>Login time:</strong> ${loginTime}</p>
            <p>If this was not you, please change your password immediately.</p>
        `
    });
}

module.exports = sendLoginEmail;
