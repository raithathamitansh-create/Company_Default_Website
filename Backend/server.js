const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middleware/auth");
const validateEntry = require("./middleware/validateEntry");
require("dotenv").config();

const app = express();

const allowedOrigins = [
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
app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
    }

    try {
        // Check existing user
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
            if (err) return res.status(500).json({ message: "Server error" });

            if (result.length > 0) {
                return res.status(400).json({ message: "Email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            db.query(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [name, email, hashedPassword],
                (err) => {
                    if (err) return res.status(500).json({ message: "Signup failed" });

                    

                    res.json({ message: "User registered successfully" });
                }
            );
        });

    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
});


// ======================
// LOGIN
// ======================
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) return res.status(500).json({ message: "Server error" });

            if (result.length === 0) {
                return res.status(400).json({ message: "User not found" });
            }

            const user = result[0];

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ message: "Invalid password" });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                SECRET_KEY,
                { expiresIn: "1h" }
            );

            res.json({ token });
        }
    );
});


// ======================
// PRODUCTS
// ======================

// ADD
app.post("/add-entry", verifyToken,validateEntry, (req, res) => {
    const { product, quantity, price, total } = req.body;

    db.query(
        "INSERT INTO products (product, quantity, price, total) VALUES (?, ?, ?, ?)",
        [product, quantity, price, total],
        (err) => {
            if (err) return res.status(500).json({ message: "Error adding entry" });
            res.json({ message: "Added" });
        }
    );
});

// GET
app.get("/entries", verifyToken, (req, res) => {
    db.query("SELECT * FROM products", (err, result) => {
        if (err) return res.status(500).json({ message: "Error fetching data" });
        res.json(result);
    });
});


//UPDATE
app.put("/update-entry/:id", verifyToken, (req,res)=>{
     const id = req.params.id;
     const {product,quantity,price,total} = req.body;

     console.log("Updated Hit", req.params.id);

     db.query(
        "UPDATE products SET product=? , quantity=? , price=? , total=? WHERE id=?",
        [product,quantity,price,total,id],
        (err)=>{
            if(err) return res.status(500).json({message:"Error updating entry"});
            res.json({message: "updated successfully"});
        }
     )
});


// DELETE
app.delete("/delete-entry/:id", verifyToken, (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting" });
        res.json({ message: "Deleted" });
    });
});


// ======================
app.get("/", (req, res) => {
    res.send("Backend running 🚀");
});

app.listen(process.env.PORT || 5000, () => {
    console.log("Server running 🚀");
});
