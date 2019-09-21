'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

var answerSchema = Schema( {
  studentId: ObjectId,
  classId: ObjectId,
  psetId: ObjectId,
  problemId: ObjectId,
  answer: String,
  createdAt: Date,
} );

module.exports = mongoose.model( 'Answer', answerSchema );
