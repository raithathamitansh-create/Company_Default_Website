

const validateEntrySchema = require("../utils/validateSchema");

function validateEntry(req,res,next){

    console.log("validateEntry running", req.body);

    const errors = validateEntrySchema(req.body);

    if(errors.length > 0){
        return res.status(400).json({
            message: "Validation failed",
            errors
        });
    }

    next();
}

module.exports = validateEntry;