const entrySchema = {
    type: "object",
    properties: {
        product: {
            type: "string",
            minLength: 1,
            maxLength: 20
        },
        quantity: {
            type: "integer",
            minimum: 1,
            maximum: 20
        },
        price: {
            type: "number",
            minimum: 1
        },
        total: {
            type: "number",
            minimum: 1
        }
    },
    required: ["product", "quantity", "price", "total"],
    additionalProperties: false
};

module.exports = entrySchema;