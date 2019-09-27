'use strict';
const Course = require( '../models/Course' );
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
  Course.findOne({_id:id})
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


exports.getUsersReviews = (req,res,next) => {
  // we want to return a list of objects
  //   {answer,review,points,createdAt}
  // we we have to do
  res.locals.usersReviews =
    [{
      answer:'I don\'t know',
      review:'Make a guess!',
      review_id:'review_id',
      points:0,
      createdAt:new Date()
    },
    {
      answer:'a*b*math.cos(t)',
      review:'excellent',
      review_id:'review_id',
      points:5,
      createdAt:new Date()
    }]
  next()

}
