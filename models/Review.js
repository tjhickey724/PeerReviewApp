'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

var reviewSchema = Schema( {
  reviewerId: ObjectId,
  courseId: ObjectId,
  psetId: ObjectId,
  problemId: ObjectId,
  answerId: ObjectId,
  review: String,
  points: Number,
  createdAt: Date,
} );

module.exports = mongoose.model( 'Review', reviewSchema );
