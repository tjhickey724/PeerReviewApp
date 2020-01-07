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
  upvoters: [Schema.Types.ObjectId],
  downvoters: [Schema.Types.ObjectId],
  createdAt: Date,
} );
/*
upvoters and downvoters are the lists of users who
upvoted or downvoted that review.
*/

module.exports = mongoose.model( 'Review', reviewSchema );
