'use strict';
const Class = require( '../models/Class' );
const ProblemSet = require( '../models/ProblemSet' );
const Problem = require( '../models/Problem' );
const Answer = require('../models/Answer')
const Review = require('../models/Review')

exports.saveAnswer = ( req, res, next ) => {
  const problem = res.locals.problem
  let newAnswer = new Answer(
   {
    studentId:req.user._id,
    classId:problem.classId,
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



exports.getMyAnswerP = ( req, res, next ) => {
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
      console.log("Error in getClassInfo: "+ error.message );
      res.send(error)
    } )

};



exports.getProblemP = ( req, res, next ) => {
  console.log('in getProblem')
  const id = req.params.probId
  Problem.findOne({_id:id})
    .exec()
    .then( (problem) => {
      console.log("problem= "+problem)
      res.locals.problem = problem
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getProblem: "+ error.message );
      res.send(error)
    } )

};


exports.getMyReviewsP = ( req, res, next ) => {
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

exports.getNextAnswerPL = ( req, res, next ) => {
  console.log('in getNextAnswer')
  const id = req.params.probId
  console.log(`probId=${id} studentId=${res.locals.user._id}`)

  /*
    Here we find an answer for that problem which
    we have not already reviewed...
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
      console.log("Error in getClassInfo: "+ error.message );
      res.send(error)
    } )

};

exports.getCourseL = ( req, res, next ) => {
  console.log('in getCourseL')
  console.log(res.locals.problem)
  console.log("...")
  Class.findOne({_id:res.locals.problem.classId})
    .exec()
    .then( (course) => {
      console.log(course)
      res.locals.course = course
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getCourseL: "+ error.message );
      res.send(error)
    } )

};

exports.updateProblemLB = ( req, res, next ) => {
  console.log("in updateProblem")
  let problem = res.locals.problem
  problem.description= req.body.description
  problem.problemText= req.body.problemText
  problem.points= req.body.points
  problem.rubric= req.body.rubric
  problem.createdAt =  new Date()

  problem.save()
    .then( (p) => {
      console.log('update a problem: '+req.body.description)
      res.locals.problem = p
      next();
    } )
    .catch( error => {
      res.send( error );
    } );


};

exports.getProblemSetL = ( req, res, next ) => {
  console.log('in getProblemSetL')
  console.log(res.locals.problem)
  console.log("...")
  ProblemSet.findOne({_id:res.locals.problem.psetId})
    .exec()
    .then( (pset) => {
      console.log(pset)
      res.locals.problemSet = pset
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getProblemSetL: "+ error.message );
      res.send(error)
    } )

};


exports.getAnswerCountL = ( req, res, next ) => {
  console.log('in countAnswersL')
  Answer.countDocuments({problemId:res.locals.problem._id})
    .exec()
    .then( (num) => {
      console.log('answerCount='+num)
      res.locals.answerCount=num
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in countAnswersL: "+ error.message );
      res.send(error)
    } )

};

exports.getReviewCountL = ( req, res, next ) => {
  console.log('in countAnswersL')
  Review.countDocuments({problemId:res.locals.problem._id})
    .exec()
    .then( (num) => {
      console.log('reviewCount='+num)
      res.locals.reviewCount=num
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in reviewAnswersL: "+ error.message );
      res.send(error)
    } )

};
