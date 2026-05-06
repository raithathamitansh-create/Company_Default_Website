const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTPEmail(userEmail, otp) {

    try {

        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: userEmail,
            subject: "Your OTP Code",

            html: `
                <h2>OTP Verification</h2>

                <p>Your OTP is:</p>

                <h1>${otp}</h1>

                <p>This OTP expires in 5 minutes.</p>
            `
        });

        console.log("OTP email sent");

    } catch (error) {
        console.log("Email error:", error);
        throw error;
    }
}

module.exports = {
    sendOTPEmail
};