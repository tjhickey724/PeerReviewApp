'use strict';
const Course = require( '../models/Course' );
const ProblemSet = require( '../models/ProblemSet' );
const Problem = require( '../models/Problem' );

exports.saveProblemSet = ( req, res, next ) => {
  const courseId = req.params.courseId
  let newProblemSet = new ProblemSet(
   {
    name: req.body.name,
    courseId:courseId,
    createdAt: new Date()
   }
  )

  newProblemSet.save()
    .then( (a) => {
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};



// this displays all of the skills
exports.getProblemSets = ( req, res, next ) => {
  if (!req.user) next()

  ProblemSet.find({courseId:res.locals.courseInfo._id})
    .exec()
    .then( problemSets => {
      res.locals.problemSets = problemSets
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getRegistrations: "+ error.message );
      res.send(error)
    } )

};


// this displays all of the skills
exports.getProblemSet = ( req, res, next ) => {
  const id = req.params.psetId
  ProblemSet.findOne({_id:id})
    .exec()
    .then( ( ps ) => {
      res.locals.problemSet = ps
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getCourseInfo: "+ error.message );
      res.send(error)
    } )

};

// this displays all of the skills
exports.getCourseInfo = ( req, res, next ) => {
  Course.findOne({_id:res.locals.problemSet.courseId})
    .exec()
    .then( ( courseInfo ) => {
      res.locals.courseInfo = courseInfo
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getCourseInfo: "+ error.message );
      res.send(error)
    } )

};

// this displays all of the skills
exports.getProblems = ( req, res, next ) => {
  const psetId = req.params.psetId
  Problem.find({psetId:psetId})
    .exec()
    .then( problems => {
      res.locals.problems = problems
      res.locals.psetId = psetId
      res.locals.junk = 42
      res.locals.what = {a:5}
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getProblem: "+ error.message );
      res.send(error)
    } )



};


exports.saveProblem = ( req, res, next ) => {
  const psetId = req.params.psetId
  let newProblem = new Problem(
   {
    courseId: res.locals.problemSet.courseId,
    psetId: res.locals.problemSet._id,
    description: req.body.description,
    problemText: req.body.problemText,
    points: req.body.points,
    rubric: req.body.rubric,
    createdAt: new Date()
   }
  )

  newProblem.save()
    .then( (p) => {
      res.locals.problem = p
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};
