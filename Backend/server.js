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
    const requestedPage = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 100);
    const search = String(req.query.search || "").trim();
    const sortKeyMap = {
        product: "product",
        quantity: "quantity",
        price: "price",
        total: "total",
        created_at: "created_at"
    };
    const sortKey = sortKeyMap[req.query.sortKey] || "created_at";
    const sortDirection = req.query.sortDirection === "asc" ? "ASC" : "DESC";

    const conditions = ["user_id = ?"];
    const params = [userId];

    if (search) {
        conditions.push("(product LIKE ? OR CAST(quantity AS CHAR) LIKE ? OR CAST(price AS CHAR) LIKE ? OR CAST(total AS CHAR) LIKE ?)");
        const searchValue = `%${search}%`;
        params.push(searchValue, searchValue, searchValue, searchValue);
    }

    addNumberFilter("price", req.query.minPrice, ">=");
    addNumberFilter("price", req.query.maxPrice, "<=");
    addNumberFilter("quantity", req.query.minQuantity, ">=");
    addNumberFilter("quantity", req.query.maxQuantity, "<=");

    if (req.query.dateFrom) {
        conditions.push("DATE(created_at) >= ?");
        params.push(req.query.dateFrom);
    }

    if (req.query.dateTo) {
        conditions.push("DATE(created_at) <= ?");
        params.push(req.query.dateTo);
    }

    const whereClause = conditions.join(" AND ");
    const countSql = `SELECT COUNT(*) AS totalRows FROM products WHERE ${whereClause}`;
    const summarySql = `
        SELECT
            COUNT(*) AS totalProducts,
            COALESCE(SUM(quantity), 0) AS totalQuantity,
            COALESCE(SUM(total), 0) AS totalAmount,
            (
                SELECT product
                FROM products
                WHERE ${whereClause}
                ORDER BY price DESC, id DESC
                LIMIT 1
            ) AS highestPriceProduct
        FROM products
        WHERE ${whereClause}
    `;
    const dataSql = `
        SELECT id, product, quantity, price, total, created_at
        FROM products
        WHERE ${whereClause}
        ORDER BY ${sortKey} ${sortDirection}, id DESC
        LIMIT ? OFFSET ?
    `;

    db.query(countSql, params, (countErr, countRows) => {
        if (countErr) return res.status(500).json({ message: "Error fetching data" });
        const totalRows = Number(countRows[0].totalRows || 0);
        const totalPages = Math.max(1, Math.ceil(totalRows / limit));
        const page = Math.min(requestedPage, totalPages);
        const offset = (page - 1) * limit;

        db.query(summarySql, [...params, ...params], (summaryErr, summaryRows) => {
            if (summaryErr) return res.status(500).json({ message: "Error fetching summary" });

            db.query(dataSql, [...params, limit, offset], (dataErr, result) => {
                if (dataErr) return res.status(500).json({ message: "Error fetching data" });

                const summary = summaryRows[0] || {};

                res.json({
                    data: result,
                    pagination: {
                        page,
                        limit,
                        totalRows,
                        totalPages
                    },
                    summary: {
                        totalProducts: Number(summary.totalProducts || 0),
                        totalQuantity: Number(summary.totalQuantity || 0),
                        totalAmount: Number(summary.totalAmount || 0),
                        highestPriceProduct: summary.highestPriceProduct || "-"
                    }
                });
            });
        });
    });

    function addNumberFilter(column, value, operator) {
        if (value === undefined || value === "") return;

        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) return;

        conditions.push(`${column} ${operator} ?`);
        params.push(numberValue);
    }
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
