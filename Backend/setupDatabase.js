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

const sql = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

db.query(sql, (err) => {
    if (err) {
        console.error("Database setup failed:", err.message);
        process.exit(1);
    }

    db.query("SHOW COLUMNS FROM products LIKE 'user_id'", (err, columns) => {
        if (err) {
            console.error("Could not verify products table:", err.message);
            process.exit(1);
        }

        if (columns.length > 0) {
            return showTables();
        }

        db.query("ALTER TABLE products ADD COLUMN user_id INT NULL AFTER id", (err) => {
            if (err) {
                console.error("Could not add user_id column:", err.message);
                process.exit(1);
            }

            console.log("Added user_id column to products table");
            showTables();
        });
    });
});

function showTables() {
    db.query("SHOW TABLES", (err, rows) => {
        if (err) {
            console.error("Could not verify tables:", err.message);
            process.exit(1);
        }

        console.log("Database tables ready:");
        console.table(rows);
        db.end();
    });
}
