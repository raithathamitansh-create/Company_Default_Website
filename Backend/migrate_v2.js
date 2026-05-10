require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    multipleStatements: true
});

const migrate = () => {
    db.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General' AFTER total", (err) => {
        if (err) console.log("Category column check failed (might already exist):", err.message);
        
        db.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT AFTER category", (err) => {
            if (err) console.log("Image URL column check failed (might already exist):", err.message);
            
            console.log("Migration complete.");
            db.end();
        });
    });
};

migrate();
