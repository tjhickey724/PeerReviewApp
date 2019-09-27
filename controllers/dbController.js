'use strict';
const Class = require( '../models/Class' );
const ProblemSet = require( '../models/ProblemSet' );
const Problem = require( '../models/Problem' );
const Answer = require('../models/Answer')
const Review = require('../models/Review')

exports.getReview = ( req, res, next ) => {
  console.log('in db.getReview')
  const id = req.params.reviewId
  Review.findOne({_id:id})
    .exec()
    .then( (x) => {
      res.locals.review = x
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in db.getReview: "+ error.message );
      res.send(error)
    } )
};

exports.getReviews = ( req, res, next ) => {
  console.log('in db.getReviews')
  const id = req.params.answerId
  Review.find({answerId:id})
    .exec()
    .then( reviews => {
      res.locals.reviews = reviews
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in db.getReviews: "+ error.message );
      res.send(error)
    } )
};


exports.getAnswer = ( req, res, next ) => {
  console.log('in db.getAnswer')
  const id = req.params.answerId
  Answer.findOne({_id:id})
    .exec()
    .then( (x) => {
      res.locals.answer = x
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in db.getAnswer: "+ error.message );
      res.send(error)
    } )
};

exports.getProblem = ( req, res, next ) => {
  console.log('in db.getProblem')
  const id = req.params.problemId
  Problem.findOne({_id:id})
    .exec()
    .then( (x) => {
      res.locals.problem = x
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in db.getProblem: "+ error.message );
      res.send(error)
    } )
};
exports.getProblemSet = ( req, res, next ) => {
  console.log('in db.getProblemSet')
  const id = req.params.problemSetId
  Answer.findOne({_id:id})
    .exec()
    .then( (x) => {
      res.locals.problemSet = x
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in db.getProblemSet: "+ error.message );
      res.send(error)
    } )
};

exports.getCourse = ( req, res, next ) => {
  console.log('in db.getCourse')
  const id = req.params.courseId
  Class.findOne({_id:id})
    .exec()
    .then( (x) => {
      res.locals.course = x
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in db.getCourse: "+ error.message );
      res.send(error)
    } )
};
