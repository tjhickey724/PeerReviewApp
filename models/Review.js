'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

var reviewSchema = Schema( {
  reviewerId: ObjectId,
  answerId: ObjectId,
  problemId: ObjectId,
  review: String,
  points: Number,
  createdAt: Date,
} );

module.exports = mongoose.model( 'Review', reviewSchema );
