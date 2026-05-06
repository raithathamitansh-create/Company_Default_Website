const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateOTP, hashOTP } = require("../utils/otp");
const sendOTPEmail = require("../utils/sendLoginEmail");

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  console.error("JWT_SECRET missing!");
}

// ======================
// STEP 1: LOGIN → SEND OTP
// ======================
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, result) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.length === 0) {
        return res.status(400).json({ message: "User not found" });
      }

      const user = result[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error("BCRYPT ERROR:", err);
          return res.status(500).json({ message: "Server error" });
        }

        if (!isMatch) {
          return res.status(400).json({ message: "Invalid password" });
        }

        const otp = generateOTP();
        const hashedOtp = hashOTP(otp);
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

        // Delete old OTP (if exists)
        db.query("DELETE FROM otp_codes WHERE user_id = ?", [user.id]);

        // Insert new OTP
        db.query(
          "INSERT INTO otp_codes (user_id, otp, expires_at) VALUES (?, ?, ?)",
          [user.id, hashedOtp, expires],
          (err) => {
            if (err) {
              console.error("OTP INSERT ERROR:", err);
              return res.status(500).json({ message: "OTP error" });
            }

            // Send email (non-blocking)
            sendOTPEmail(user.email, otp)
              .catch(err => console.error("Email error:", err));

            res.json({
              message: "OTP sent to your email",
              userId: user.id
            });
          }
        );
      });
    }
  );
});

// ======================
// STEP 2: VERIFY OTP → ISSUE TOKEN
// ======================
router.post("/verify-otp", (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ message: "OTP and userId required" });
  }

  const hashedOtp = hashOTP(otp);

  db.query(
    "SELECT * FROM otp_codes WHERE user_id = ?",
    [userId],
    (err, result) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (result.length === 0) {
        return res.status(400).json({ message: "OTP not found" });
      }

      const record = result[0];

      // Check expiry
      if (new Date() > record.expires_at) {
        return res.status(400).json({ message: "OTP expired" });
      }

      // Check match
      if (record.otp !== hashedOtp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: userId },
        SECRET_KEY,
        { expiresIn: "1h" }
      );

      // Delete OTP after success
      db.query("DELETE FROM otp_codes WHERE user_id = ?", [userId]);

      res.json({
        message: "Login successful",
        token
      });
    }
  );
});

module.exports = router;