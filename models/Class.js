'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

var classSchema = Schema( {
  name: String,
  ownerId: ObjectId,
  classPin: Number,
  createdAt: Date,
} );

module.exports = mongoose.model( 'Class', classSchema );
