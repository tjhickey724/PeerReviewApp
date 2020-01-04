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
      res.locals.answered = true
      res.locals.answer = a
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};



exports.getAnswer = ( req, res, next ) => {

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


// REMOVE!!
exports.getProblem = ( req, res, next ) => {
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
      res.locals.review = r
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};


// *** MOVE TO reviewController
exports.getMyReviews = ( req, res, next ) => {
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

exports.getReviews = ( req, res, next ) => {
  const probId = req.params.probId
  Review.find({problemId:probId})
    .exec()
    .then( reviews => {
      res.locals.allReviewedAnswers
        = reviews.map((r)=>r.answerId)
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getReviews: "+ error.message );
      res.send(error)
    } )

};

exports.getReviewsOfAnswer = ( req, res, next ) => {
  Review.find({answerId:res.locals.answer._id})
    .exec()
    .then( reviews => {
      res.locals.isThisWORKING = true
      res.locals.allReviews = reviews
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getReviewsOfAnswer: "+ error.message );
      res.send("Reviews of Answers error: "+error)
    } )

};


// this gets the next answer which has no reviews, if any
// and otherwise sets res.locals.answered=false
// getNextAnswer checks to see if res.locals.answered=true
// this is a little confusing and should be refactored...

exports.getNextAnswer0 = ( req, res, next ) => {
  const id = req.params.probId

  /*
    Here we find a random answer for that problem which
    we have not already reviewed...
    and for which there are no reviews
    We should modify add another one which first finds a problem
    which has not been reviewed, and if all have been reviewed then
    it picks randomly... Or maybe looks for ones with <2 reviews,
    then <3, etc. before picking randomly.... Once it finds a review
    it can quickly exit the middleware so this would not be too expensive.
    We could also sort on the number of reviews, but that might take
    longer...
  */
  Answer.find({problemId:id,
       _id:{$not:{$in:res.locals.allReviewedAnswers},
            $not:{$in:res.locals.reviewedAnswers}   }
          })
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



exports.getNextAnswer = ( req, res, next ) => {

  const id = req.params.probId

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
      if (res.locals.answered){
        next()
      } else {
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
      }
    } )
    .catch( ( error ) => {
      console.log("Error in getCourseInfo: "+ error.message );
      res.send(error)
    } )

};

exports.getAllAnswersForCourse = ( req, res, next ) => {

  const courseId = res.locals.courseInfo._id
  Answer.find({courseId:courseId})
    .exec()
    .then( answers => {
      res.locals.answers = answers
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getAllAnswersForCourse: "+ error.message );
      res.send('gAAFC: '+error)
    } )

};

exports.getAnswerToReview = async (req,res,next) => {
 try{
  // this selects the problem with the fewest reviews
  // which hasn't been reviewed by this user.
  // First though it finds answers that haven't been reviewed at all...
  // If the user has reviewed all of the answers, it returns ...
  const probId = req.params.probId
  // first find the problem and course for this problemId
  res.locals.problem = await Problem.findOne({_id:probId})
  res.locals.course = await Course.findOne({_id:res.locals.problem.courseId})
  res.locals.course.gradeSheet = {}

  // next, get the answers for this problem that I have reviewed
  const myReviews = await Review.find({reviewerId:req.user._id,problemId:probId})
  const myReviewedAnswerIds = myReviews.map((x)=>x.answerId)
  res.locals.numReviewsByMe = myReviews.length
  // find all answers I haven't reviewed, sorted by number of reviews

  // next, get the all the answers to the problem
  const allAnswers =
      await Answer.find({problemId:probId})

  const answersToReview =
     await Review.aggregate(
       [{$match:{problemId:res.locals.problem._id,
                 answerId:{$nin:myReviewedAnswerIds}}},
        {$sortByCount:"$answerId"}])

  console.log("inside reviewAnswers:")
  console.dir("atr.len="+answersToReview.length)

  for(let j=0; j<answersToReview.length; j++){
    console.log(j)
    console.dir(answersToReview[j])
  }

  res.locals.answer = false
  console.log("allAnswers and answers to Review and answers I reviewed")
  console.dir(allAnswers.map(a => a._id))
  console.dir(answersToReview)
  console.dir(myReviewedAnswerIds)

  for (let i = 0; i<allAnswers.length; i++){
    let a = allAnswers[i]._id
    console.log(i+" "+a)
    if ( !(a in answersToReview)
           &&
         !(a in myReviewedAnswerIds)
       ) {
         console.log("found an answer: "+a)
          res.locals.answer = allAnswers[i]
          break
         }
  }
  if (res.locals.answer){
    console.log("case 1:"+res.locals.answer)
    next()
  } else if (answersToReview.length == 0){
    res.locals.answer=false
    console.log("case 2:"+res.locals.answer)
    next()
  } else {
    res.locals.answer = answersToReview[answersToReview.length-1]
    console.log("case 3:"+res.locals.answer)
    next()
  }
 } catch(error){
  console.log("error in getAnswerToReview: "+error)
  res.send("error in getAnswerToReview: "+error)
 }
}
/* dbController.getProblem,
answerController.getMyReviews,
answerController.getReviews,
answerController.getNextAnswer0,
answerController.getNextAnswer,
answerController.getReviewsOfAnswer,*/
