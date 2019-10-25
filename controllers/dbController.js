'use strict';
const Course     = require('../models/Course' );
const ProblemSet = require('../models/ProblemSet' );
const Problem    = require('../models/Problem' );
const Answer     = require('../models/Answer')
const Review     = require('../models/Review')
const User       = require('../models/User')

/*
   Maybe all of these should be in their own controllers,
   e.g. problemController.getProblem would use probId to get the problem
   Or we could call it getProblemP  meaning get it from the parameters
   or getProblemB meaning to get the probID from the body
   Could we make a general getDocumentP(Typestring) method which
   would look at the Type and use it to do a lookup?
*/
exports.getReview = ( req, res, next ) => {
  const id = req.params.reviewId
  Review.findOne({_id:id})
    .exec()
    .then( (x) => {
      res.locals.review = x
      next()
    } )
    .catch( ( error ) => {
      res.send("Error in getReview: "+error)
    } )
};

exports.getReviews = ( req, res, next ) => {
  const id = req.params.answerId
  Review.find({answerId:id})
    .exec()
    .then( reviews => {
      res.locals.reviews = reviews
      next()
    } )
    .catch( ( error ) => {
      res.send("Error in getReviews: "+error)
    } )
};


exports.getAnswer = ( req, res, next ) => {
  const id = req.params.answerId
  Answer.findOne({_id:id})
    .exec()
    .then( (x) => {
      res.locals.answer = x
      next()
    } )
    .catch( ( error ) => {
      res.send("Error in getAnswer: "+error)
    } )
};

exports.getProblem = ( req, res, next ) => {
  const id = req.params.probId
  Problem.findOne({_id:id})
    .exec()
    .then( (problem) => {
      res.locals.problem = problem
      next()
    } )
    .catch( ( error ) => {
      res.send("Error in getProblem: "+error)
    } )
};
exports.getProblemSet = ( req, res, next ) => {
  const id = req.params.problemSetId
  Answer.findOne({_id:id})
    .exec()
    .then( (x) => {
      res.locals.problemSet = x
      next()
    } )
    .catch( ( error ) => {
      res.send("Error in getProblemSet: "+error)
    } )
};

exports.getCourse = ( req, res, next ) => {
  const id = req.params.courseId
  Course.findOne({_id:id})
    .exec()
    .then( (x) => {
      res.locals.course = x
      next()
    } )
    .catch( ( error ) => {
      res.send("Error in getCourse: "+error)
    } )
};


exports.getUsersReviews = (req,res,next) => {
  // we want to return a list of objects
  //   {_id,answer,review,points,createdAt}
  // this returns the reviews with
  //  reviewerId == req.user._id
  //  problemId == res.locals.problem._id
  // we we have to do
  Review.find(
      {reviewerId:req.user._id,
       problemId:res.locals.problem._id}
     )
  .then(reviews => {
    res.locals.usersReviews = reviews
    next()
  })
  .catch((error) => {
    res.send("Error in db.getUsersReviews: "+error.message)
  })

}

exports.getUsersReviewedAnswers = (req,res,next) => {
  // we want to return a list of objects
  //   {_id,answer,review,points,createdAt}
  // this returns the reviews with
  //  reviewerId == req.user._id
  //  problemId == res.locals.problem._id
  // we we have to do
  const answerIds = res.locals.usersReviews.map((r)=>r.answerId)
  Answer.find(
      {_id:{$in:answerIds}}
     )
  .then(answers => {
    res.locals.usersReviewedAnswers = answers
    next()
  })
  .catch((error) => {
    res.send("Error in db.getUsersReviewedAnswers: "+error.message)
  })

}

exports.getStudentInfo = (req,res,next) => {
  User.findOne(
      {_id:req.params.studentId}
     )
  .then(studentInfo => {
    res.locals.studentInfo = studentInfo
    next()
  })
  .catch((error) => {
    res.send("Error in db.getStudentInfo: "+error.message)
  })
}
