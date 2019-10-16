'use strict';
const Course = require( '../models/Course' );
const ProblemSet = require( '../models/ProblemSet' );
const Problem = require( '../models/Problem' );
const Answer = require('../models/Answer')
const Review = require('../models/Review')

exports.saveAnswer = ( req, res, next ) => {
  const problemId = req.params.probId
  const problem = res.locals.problem
  let newAnswer = new Answer(
   {
    studentId:req.user._id,
    courseId:problem.courseId,
    psetId:problem.psetId,
    problemId:problem._id,
    answer:req.body.answer,
    createdAt: new Date()
   }
  )

  newAnswer.save()
    .then( (a) => {
      console.log('saved a new Answer: '+req.body.answer)
      res.locals.answered = true
      res.locals.answer = a
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};



exports.getAnswer = ( req, res, next ) => {
  console.log('in getAnswer')
  const id = req.params.probId
  console.log(`probId=${id} studentId=${res.locals.user._id}`)
  Answer.find({problemId:id,studentId:res.locals.user._id})
    .exec()
    .then( answers => {
      if (answers.length==0){
        res.locals.answered = false
        res.locals.answer=""
      } else {
        res.locals.answered = true
        res.locals.answer = answers[0]
      }
      console.log(`answer=${res.locals.answer} answered=${res.locals.answered}`)
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getCourseInfo: "+ error.message );
      res.send(error)
    } )

};


// REMOVE!!
exports.getProblem = ( req, res, next ) => {
  console.log('in getProblem')
  const id = req.params.probId
  Problem.findOne({_id:id})
    .exec()
    .then( (problem) => {
      res.locals.problem = problem
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getProblem: "+ error.message );
      res.send(error)
    } )

};


// *** MOVE TO reviewController
exports.saveReview = ( req, res, next ) => {
  const problemId = req.params.probId
  const answerId = req.params.answerId
  const problem = res.locals.problem
  let newReview = new Review(
   {
    reviewerId:req.user._id,
    courseId:problem.courseId,
    psetId:problem.psetId,
    problemId:problem._id,
    answerId:answerId,
    review:req.body.review,
    points:req.body.points,
    createdAt: new Date()
   }
  )

  newReview.save()
    .then( (r) => {
      console.log('saved a new Review: '+req.body.review)
      res.locals.review = r
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};


// *** MOVE TO reviewController
exports.getMyReviews = ( req, res, next ) => {
  console.log('in getMyReviews')
  const probId = req.params.probId
  Review.find({reviewerId:req.user._id,problemId:probId})
    .exec()
    .then( (reviews) => {
      res.locals.reviewedAnswers
        = reviews.map((r)=>r.answerId)
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getMyReviews: "+ error.message );
      res.send(error)
    } )

};


exports.getNextAnswer = ( req, res, next ) => {
  console.log('in getNextAnswer')
  const id = req.params.probId
  console.log(`probId=${id} studentId=${res.locals.user._id}`)

  /*
    Here we find a random answer for that problem which
    we have not already reviewed...
    We should modify add another one which first finds a problem
    which has not been reviewed, and if all have been reviewed then
    it picks randomly... Or maybe looks for ones with <2 reviews,
    then <3, etc. before picking randomly.... Once it finds a review
    it can quickly exit the middleware so this would not be too expensive.
    We could also sort on the number of reviews, but that might take
    longer...
  */
  Answer.find({problemId:id,_id:{$not:{$in:res.locals.reviewedAnswers}}})
    .exec()
    .then( answers => {
      res.locals.answers = answers.map((x)=>x.answer)
      if (answers.length==0){
        res.locals.answered = false
        res.locals.answer={}
      } else {
        const randPos =
           Math.floor(Math.random() * answers.length)
        res.locals.answered = true
        res.locals.answer = answers[randPos]
      }
      console.log(`answer=${res.locals.answer} answered=${res.locals.answered}`)
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getCourseInfo: "+ error.message );
      res.send(error)
    } )

};
