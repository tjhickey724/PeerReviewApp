'use strict';
const Class = require( '../models/Class' );
const ProblemSet = require( '../models/ProblemSet' );
const Problem = require( '../models/Problem' );

exports.saveProblemSet = ( req, res, next ) => {
  const classId = req.params.classId
  let newProblemSet = new ProblemSet(
   {
    name: req.body.name,
    classId:classId,
    createdAt: new Date()
   }
  )

  newProblemSet.save()
    .then( (a) => {
      console.log('saved a new problem set: '+req.body.name)
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};



// this displays all of the skills
exports.getProblemSets = ( req, res, next ) => {
  console.log('in getProblemSets')
  if (!req.user) next()

  ProblemSet.find({classId:res.locals.classInfo._id})
    .exec()
    .then( problemSets => {
      console.log("adding problemsets: "+problemSets.length)
      res.locals.problemSets = problemSets
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getRegistrations: "+ error.message );
      res.send(error)
    } )
    .then( () => {
      //console.log( 'skill promise complete' );
    } );
};


// this displays all of the skills
exports.getProblemSet = ( req, res, next ) => {
  console.log('in getClassInfo')
  const id = req.params.psetId
  ProblemSet.findOne({_id:id})
    .exec()
    .then( ( ps ) => {
      res.locals.problemSet = ps
      console.log(`ps=`+ps)
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getClassInfo: "+ error.message );
      res.send(error)
    } )

};

// this displays all of the skills
exports.getClassInfo = ( req, res, next ) => {
  console.log('in getClassInfo')
  Class.findOne({_id:res.locals.problemSet.classId})
    .exec()
    .then( ( classInfo ) => {
      res.locals.classInfo = classInfo
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getClassInfo: "+ error.message );
      res.send(error)
    } )

};

// this displays all of the skills
exports.getProblems = ( req, res, next ) => {
  console.log('in getProblems')
  const psetId = req.params.psetId
  console.log('psetId = '+psetId)
  Problem.find({psetId:psetId})
    .exec()
    .then( problems => {
      console.log("found problems: "+problems.length)
      console.log("problems = "+JSON.stringify(problems))
      console.log('psetId = '+psetId)
      res.locals.problems = problems
      res.locals.psetId = psetId
      res.locals.junk = 42
      res.locals.what = {a:5}
      console.log('res.locals=')
      //console.dir(res.locals)
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getProblem: "+ error.message );
      res.send(error)
    } )
    .then( ()  => console.log("in the then part"))



};


exports.saveProblem = ( req, res, next ) => {
  console.log("in saveProblem")
  const psetId = req.params.psetId
  console.log("psetId = "+psetId)
  let newProblem = new Problem(
   {
    psetId: psetId,
    description: req.body.description,
    problemText: req.body.problemText,
    points: req.body.points,
    rubric: req.body.rubric,
    createdAt: new Date()
   }
  )

  newProblem.save()
    .then( (p) => {
      console.log('saved a new problem: '+req.body.description)
      res.locals.problem = p
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};
