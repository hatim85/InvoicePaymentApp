const { Schema, model } = require("mongoose");

const receiptSchema = new Schema({
    payer: {
        type: String,
        required: true,
    },
    receipt: {
        type: Buffer,
        required: true,
    },
    paidAt: {
        type: Date,
        default: Date.now,
    }
}, {timestamps: true});

const Receipt = model("Receipt", receiptSchema);

module.exports = Receipt;