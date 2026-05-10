const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middleware/auth");
const validateEntry = require("./middleware/validateEntry");
const { sendLoginEmail } = require("./utils/sendLoginEmail");
require("dotenv").config();

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://full-stack-projects-three.vercel.app"
];

app.use(cors({
    origin: (origin, callback) => {
        if (
            !origin ||
            allowedOrigins.includes(origin) ||
            /^https:\/\/.*\.vercel\.app$/.test(origin)
        ) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET;


// ======================
// SIGNUP
// ======================
app.post("/signup", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
    }

    // Check if user already exists
    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, result) => {
            if (err) {
                console.error("DB ERROR:", err);
                return res.status(500).json({ message: "Server error" });
            }

            if (result.length > 0) {
                return res.status(400).json({ message: "Email already exists" });
            }

            // Hash password
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    console.error("HASH ERROR:", err);
                    return res.status(500).json({ message: "Hashing failed" });
                }

                // Insert user
                db.query(
                    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                    [name, email, hashedPassword],
                    (err) => {
                        if (err) {
                            console.error("INSERT ERROR:", err);
                            return res.status(500).json({ message: "Signup failed" });
                        }

                        res.json({ message: "User registered successfully" });
                    }
                );
            });
        }
    );
});


// ======================
// LOGIN
// ======================
const authRoutes = require("./routes/authRoutes");

app.use("/", authRoutes);

// ======================
// PRODUCTS
// ======================

// ADD
app.post("/add-entry", verifyToken,validateEntry, (req, res) => {
    const { product, quantity, price, total } = req.body;
    const userId = req.user.id; //comes from JWT

    db.query(
        "INSERT INTO products (user_id, product, quantity, price, total) VALUES (? ,?, ?, ?, ?)",
        [userId, product, quantity, price, total],
        (err) => {
            if (err) return res.status(500).json({ message: "Error adding entry" });
            res.json({ message: "Added" });
        }
    );
});

// GET
app.get("/entries", verifyToken, (req, res) => {

    const userId = req.user.id;

    db.query(
        "SELECT * FROM products WHERE user_id = ? ORDER BY id DESC",
        [userId],
        (err, result) => {
            if (err) {
                console.error("Entries fetch error:", err);
                return res.status(500).json({ message: "Error fetching data" });
            }

            res.json(result);
        }
    );
});


//UPDATE
app.put("/update-entry/:id", verifyToken, validateEntry, (req,res)=>{
     const id = req.params.id;
     const {product,quantity,price,total} = req.body;

     console.log("Updated Hit", req.params.id);

     db.query(
        "UPDATE products SET product=? , quantity=? , price=? , total=? WHERE id=? AND user_id = ?",
        [product,quantity,price,total,id,req.user.id],
        (err)=>{
            if(err) return res.status(500).json({message:"Error updating entry"});
            res.json({message: "updated successfully"});
        }
     )
});


// DELETE
app.delete("/delete-entry/:id", verifyToken, (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM products WHERE id = ? AND user_id = ?", 
        [id,req.user.id], 
        (err) => {
        if (err) return res.status(500).json({ message: "Error deleting" });
        res.json({ message: "Deleted" });
    });
});

// DELETE MULTIPLE
app.post("/delete-multiple", verifyToken, (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
    }

    db.query(
        "DELETE FROM products WHERE id IN (?) AND user_id = ?",
        [ids, req.user.id],
        (err) => {
            if (err) {
                console.error("Bulk delete error:", err);
                return res.status(500).json({ message: "Error deleting entries" });
            }
            res.json({ message: "Selected entries deleted" });
        }
    );
});


// ======================
app.get("/", (req, res) => {
    res.send("Backend running 🚀");
});

// DEBUG DB
app.get("/debug-db", (req, res) => {
    db.query("SHOW TABLES", (err, result) => {
        if (err) {
            console.log("DB ERROR:", err);
            return res.status(500).json(err);
        }
        res.json(result);
    });
});

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running 🚀");
});
