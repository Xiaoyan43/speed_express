const mongoose = require('../db/mongodb');
const { Schema, Types } = require('mongoose');

const RatingSchema = new Schema({
    _id: {
        type: Types.ObjectId,
        auto: true,
    },
    userSubmitId: {
        type: String,
        ref: 'UserSubmit',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
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

const Rating = mongoose.model('Rating', RatingSchema);

module.exports = Rating;