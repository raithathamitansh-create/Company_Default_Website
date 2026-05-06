const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// ======================
// LOGIN SUCCESS EMAIL
// ======================
async function sendLoginEmail(userEmail, userName) {

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

// ======================
// OTP EMAIL
// ======================
async function sendOTPEmail(userEmail, otp) {

    await transporter.sendMail({
        from: `"Product System" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Your OTP Code",

        html: `
            <h2>OTP Verification</h2>

            <p>Your OTP is:</p>

            <h1>${otp}</h1>

            <p>This OTP expires in 5 minutes.</p>
        `
    });
}

module.exports = {
    sendLoginEmail,
    sendOTPEmail
};
