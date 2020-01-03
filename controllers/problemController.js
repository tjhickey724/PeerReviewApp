'use strict';
const Course = require( '../models/Course' );
const ProblemSet = require( '../models/ProblemSet' );
const Problem = require( '../models/Problem' );
const Answer = require('../models/Answer')
const Review = require('../models/Review')

exports.saveAnswer = ( req, res, next ) => {
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
      res.locals.answered = true
      res.locals.answer = a
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};



exports.getMyAnswerP = ( req, res, next ) => {
  const id = req.params.probId
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
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getCourseInfo: "+ error.message );
      res.send(error)
    } )

};



exports.getProblemP = ( req, res, next ) => {
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


exports.getMyReviewsP = ( req, res, next ) => {
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
  const id = req.params.probId

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
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getCourseInfo: "+ error.message );
      res.send(error)
    } )

};

exports.getCourseL = ( req, res, next ) => {
  Course.findOne({_id:res.locals.problem.courseId})
    .exec()
    .then( (course) => {
      res.locals.course = course
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getCourseL: "+ error.message );
      res.send(error)
    } )

};

exports.updateProblemLB = ( req, res, next ) => {
  let problem = res.locals.problem
  problem.description= req.body.description
  problem.problemText= req.body.problemText
  problem.points= req.body.points
  problem.rubric= req.body.rubric
  problem.createdAt =  new Date()

  problem.save()
    .then( (p) => {
      res.locals.problem = p
      next();
    } )
    .catch( error => {
      res.send( error );
    } );


};

exports.getProblemSetL = ( req, res, next ) => {
  ProblemSet.findOne({_id:res.locals.problem.psetId})
    .exec()
    .then( (pset) => {
      res.locals.problemSet = pset
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getProblemSetL: "+ error.message );
      res.send(error)
    } )

};


exports.getAnswerCountL = ( req, res, next ) => {
  Answer.countDocuments({problemId:res.locals.problem._id})
    .exec()
    .then( (num) => {
      res.locals.answerCount=num
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in countAnswersL: "+ error.message );
      res.send(error)
    } )

};

exports.getReviewCountL = ( req, res, next ) => {
  Review.countDocuments({problemId:res.locals.problem._id})
    .exec()
    .then( (num) => {
      res.locals.reviewCount=num
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in reviewAnswersL: "+ error.message );
      res.send(error)
    } )

};

exports.getAverageReviewL = ( req, res, next ) => {

  Review.find({problemId:res.locals.problem._id})
    .exec()
    .then( reviews => {
      let sum = reviews.reduce((t,x)=>t+x.points,0)
      res.locals.averageReview=sum/reviews.length
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getAverageReviewL: "+ error.message );
      res.send(error)
    } )

};

exports.getAnswers = ( req, res, next ) => {
  const id = req.params.probId

  Answer.find({problemId:id})
    .collation({locale:'en',strength: 2})
    .sort({answer:1})
    .exec()
    .then( answers => {
      res.locals.answers = answers
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getAnswers: "+ error.message );
      res.send(error)
    } )

};

exports.getReviews = ( req, res, next ) => {
  const id = req.params.probId

  Review.find({problemId:id})
    .exec()
    .then( reviews => {
      res.locals.reviews = reviews
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getAnswers: "+ error.message );
      res.send(error)
    } )

};

exports.getAllProblemsForCourse = ( req, res, next ) => {

  const courseId = res.locals.courseInfo._id
  Problem.find({courseId:courseId})
    .exec()
    .then( problems => {
      res.locals.problems = problems
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getAllProblemsForCourse: "+ error.message );
      res.send('gAPFC: '+error)
    } )

};

exports.getProblemInfo = async (req, res, next) => {
  try {
    const probId = req.params.probId
    res.locals.problem = await Problem.findOne({_id:probId})
    res.locals.course = await Course.findOne({_id:res.locals.problem.courseId})
    res.locals.course.gradeSheet = {}
    res.locals.answerCount = await Answer.countDocuments({problemId:probId})
    const reviews = await Review.find({problemId:probId})
    res.locals.reviewCount = reviews.length
    res.locals.averageReview=
        reviews.reduce((t,x)=>t+x.points,0)/reviews.length
    res.locals.answers = await Answer.find({problemId:probId,studentId:res.locals.user._id})
    console.log('res.locals=')
    console.log(JSON.stringify(res.locals,null,5))
    next()
  } catch (e) {
        console.log("Error in showProblem: "+e)
        //res.send("Error in showProblem: "+e)
        next(e)
  }


}
/* answerController.getAnswer,
dbController.getProblem,
problemController.getAnswerCountL,
problemController.getReviewCountL,
problemController.getAverageReviewL,
problemController.getCourseL, */
