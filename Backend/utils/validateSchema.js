function validateEntrySchema(data) {
    const errors = [];

    // PRODUCT
    if (typeof data.product !== "string" || data.product.trim() === "") {
        errors.push("Product must be a non-empty string");
    }

    if (data.product.length > 10) {
        errors.push("Product must not exceed 10 characters");
    }

    // CONVERT VALUES
    const quantity = Number(data.quantity);
    const price = Number(data.price);
    const total = Number(data.total);

    // QUANTITY
    if (!Number.isInteger(quantity)) {
        errors.push("Quantity must be an integer");
    }

    if (quantity < 1 || quantity > 50) {
        errors.push("Quantity must be between 1 and 50");
    }

    // PRICE
    if (price <= 0) {
        errors.push("Price must be positive");
    }

    // TOTAL
    if (total !== quantity * price) {
        errors.push("Total must be correct");
    }

    return errors;
}

module.exports = validateEntrySchema;