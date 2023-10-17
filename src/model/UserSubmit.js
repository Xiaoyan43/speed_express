const mongoose = require('../db/mongodb');
const UserSubmitSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    authors: {
        type: String,
        required: true,
    },
    journal: {
        type: String,
        required: true,
    },
    year: {
        type: String,
        required: true,
    },
    volume: {
        type: String,
        required: true,
    },
    number: {
        type: String,
        required: true,
    },
    pages: {
        type: String,
        required: true,
    },
    doi: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        required: true,
        default: 0
    },
    createTime: {
        type: Date,
        default: Date.now,
    },
    updateTime: {
        type: Date,
        default: Date.now,
    },
});

const UserSubmit = mongoose.model('UserSubmit', UserSubmitSchema);

module.exports = UserSubmit;