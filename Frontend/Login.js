const BASE_URL = "https://company-default-website.onrender.com";

console.log("🚀 Auth script loaded");

// ======================
// ELEMENTS
// ======================
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");


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


// ======================
// SIGNUP HANDLER
// ======================
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = signupForm.querySelector('input[type="text"]').value.trim();
    const email = signupForm.querySelector('input[type="email"]').value.trim();
    const password = signupForm.querySelector('input[type="password"]').value.trim();

    if (!name || !email || !password) {
        alert("All fields are required ❌");
        return;
    }

    console.log("📤 Sending signup request...");

    try {
        const res = await fetch(`${BASE_URL}/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        console.log("Signup response:", data);

        alert(data.message || "Signup successful");

        // Switch to login after signup
        switchToLogin();

    } catch (error) {
        console.error("❌ Signup error:", error);
        alert("Signup failed ❌");
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
        alert("Email and password required ❌");
        return;
    }

    console.log("🔐 Login attempt:", email);

    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        console.log("Login response:", data);

        if (res.ok && data.token) {
            localStorage.setItem("token", data.token);

            alert("Login successful ✅");

            // Redirect to dashboard
            window.location.href = "index.html";
        } else {
            alert(data.message || "Login failed ❌");
        }

    } catch (error) {
        console.error("❌ Login error:", error);
        alert("Login failed ❌");
    }
});