const BASE_URL = window.APP_CONFIG?.API_BASE_URL || (
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://company-default-website.onrender.com"
);

console.log("Auth script loaded");

// ======================
// ELEMENTS
// ======================
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authToast = document.getElementById("authToast");
const otpModal = document.getElementById("otpModal");
const otpInput = document.getElementById("otpInput");
const otpCancelBtn = document.getElementById("otpCancelBtn");
const otpVerifyBtn = document.getElementById("otpVerifyBtn");
const passwordToggles = document.querySelectorAll(".password-toggle");

function showToast(message) {
    authToast.textContent = message;
    authToast.classList.add("show");

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
        authToast.classList.remove("show");
    }, 3000);
}

function requestOtp() {
    otpInput.value = "";
    otpModal.classList.add("open");
    otpModal.setAttribute("aria-hidden", "false");
    otpInput.focus();

    return new Promise(resolve => {
        function close(value) {
            otpModal.classList.remove("open");
            otpModal.setAttribute("aria-hidden", "true");
            otpVerifyBtn.removeEventListener("click", onVerify);
            otpCancelBtn.removeEventListener("click", onCancel);
            otpInput.removeEventListener("keydown", onKeydown);
            resolve(value);
        }

        function onVerify() {
            close(otpInput.value.trim());
        }

        function onCancel() {
            close("");
        }

        function onKeydown(event) {
            if (event.key === "Enter") onVerify();
            if (event.key === "Escape") onCancel();
        }

        otpVerifyBtn.addEventListener("click", onVerify);
        otpCancelBtn.addEventListener("click", onCancel);
        otpInput.addEventListener("keydown", onKeydown);
    });
}

// ======================
// TOGGLE FORMS
// ======================
const switchToLogin = () => {
    loginForm.classList.add("active");
    signupForm.classList.remove("active");

    loginTab.classList.add("active");
    signupTab.classList.remove("active");
};

const switchToSignup = () => {
    signupForm.classList.add("active");
    loginForm.classList.remove("active");

    signupTab.classList.add("active");
    loginTab.classList.remove("active");
};

loginTab.addEventListener("click", switchToLogin);
signupTab.addEventListener("click", switchToSignup);

passwordToggles.forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);
        const shouldShow = input.type === "password";

        input.type = shouldShow ? "text" : "password";
        button.textContent = shouldShow ? "Hide" : "Show";
    });
});

// ======================
// SIGNUP HANDLER
// ======================
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = signupForm.querySelector('input[type="text"]').value.trim();
    const email = signupForm.querySelector('input[type="email"]').value.trim();
    const password = signupForm.querySelector('input[type="password"]').value.trim();

    if (!name || !email || !password) {
        showToast("All fields are required.");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        showToast(data.message || "Signup successful.");
        switchToLogin();

    } catch (error) {
        console.error("Signup error:", error);
        showToast("Signup failed.");
    }
});

// ======================
// LOGIN HANDLER
// ======================
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('input[type="email"]').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value.trim();

    if (!email || !password) {
        showToast("Email and password are required.");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast(data.message || "OTP sent.");

            const otp = await requestOtp();

            if (!otp) {
                showToast("OTP is required.");
                return;
            }

            const verifyRes = await fetch(`${BASE_URL}/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: data.userId,
                    otp
                })
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
                localStorage.setItem("token", verifyData.token);
                showToast("Login successful.");
                window.location.href = "index.html";
                return;
            }

            showToast(verifyData.message || "Invalid OTP.");
            return;
        }

        showToast(data.message || "Login failed.");

    } catch (error) {
        console.error("Login error:", error);
        showToast("Login failed.");
    }
});
