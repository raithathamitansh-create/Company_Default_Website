const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all products
router.get("/", (req, res) => {
    db.query("SELECT * FROM products", (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// ADD product
router.post("/", (req, res) => {
    const { name, price, image } = req.body;

    if (!name || !price || !image) {
        return res.status(400).send("All fields required");
    }

    db.query(
        "INSERT INTO products (name, price, image) VALUES (?, ?, ?)",
        [name, price, image],
        (err) => {
            if (err) return res.status(500).send(err);
            res.send("Product added");
        }
    );
});

module.exports = router;