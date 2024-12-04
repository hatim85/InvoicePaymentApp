const { Schema, model } = require("mongoose");

const pdfSchema = new Schema({
    recepient: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    deadline: {
        type: Date,
        required: true,
    },
    data: {
        type: Buffer,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, {timestamps: true});

const PDF = model("PDF", pdfSchema);

module.exports = PDF;