require("dotenv").config();
const db = require("./db");

const addColumnIfMissing = (tableName, columnName, definition) => {
    return new Promise((resolve, reject) => {
        db.query(`SHOW COLUMNS FROM ${tableName} LIKE '${columnName}'`, (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                console.log(`Column ${columnName} already exists in ${tableName}`);
                return resolve();
            }
            db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`, (err) => {
                if (err) return reject(err);
                console.log(`Added column ${columnName} to ${tableName}`);
                resolve();
            });
        });
    });
};

const runMigration = async () => {
    try {
        await addColumnIfMissing("products", "category", "VARCHAR(50) DEFAULT 'General' AFTER total");
        await addColumnIfMissing("products", "image_url", "TEXT AFTER category");
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        db.end();
    }
};

runMigration();
