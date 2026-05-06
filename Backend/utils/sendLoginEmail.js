
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// ======================
// LOGIN SUCCESS EMAIL
// ======================
async function sendLoginEmail(userEmail, userName) {

    const loginTime = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
    });

    try {

        await resend.emails.send({
            from: "onboarding@resend.dev",
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

        console.log("Login email sent");

    } catch (error) {

        console.log("Email error:", error);
    }
}

module.exports = {
    sendLoginEmail
};