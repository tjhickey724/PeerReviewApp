'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

var problemSchema = Schema( {
  classId: ObjectId,
  psetId: ObjectId,
  description: String,
  problemText: String,
  points: Number,
  rubric: String,
  createdAt: Date,
} );

module.exports = mongoose.model( 'Problem', problemSchema );
