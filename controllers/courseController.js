'use strict';
const Course = require( '../models/Course' );
const CourseMember = require( '../models/CourseMember' );
const User = require( '../models/User' );

//good
exports.createCourse = ( req, res, next ) => {

  let coursePin =  Math.floor(Math.random()*10000000)
  let newCourse = new Course(
   {
    name: req.body.courseName,
    ownerId: req.user._id,
    coursePin:coursePin,
    createdAt: new Date()
   }
  )

  newCourse.save()
    .then( (a) => {
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};


//*** MOVE to courseMemberController
//*** CHANGE NAME to getUsersRegistrations
// this gets all of the courseId's
// for courses that a student is enrolled in
exports.getRegistrations = ( req, res, next ) => {

  if (!req.user) next()

  CourseMember.find({studentId:req.user._id})
    .exec()
    .then( registrations => {
      res.locals.registeredCourses = registrations.map((x)=>x.courseId)
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getRegistrations: "+ error.message );
      res.send(error)
    } )

};


// *** CHANGE NAME to getCoursesUserIsTaking
// this finds all of the courseId's
// for courses that the user is taking
exports.getCoursesYouTake = ( req, res, next ) => {

  if (!req.user) next()

  Course.find({_id:{$in:res.locals.registeredCourses}})
    .exec()
    .then( ( courses ) => {
      res.locals.coursesTaken = courses
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getAllYourCourses: "+ error.message );
      res.send(error)
    } )

};


// this gets all courseId's
// for courses owned by the user
exports.getCoursesYouOwn = ( req, res, next ) => {

  if (!req.user) next()

  Course.find({ownerId:req.user._id})
    .exec()
    .then( ( courses ) => {
      res.locals.courses = courses
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getCoursesYouOwn: "+ error.message );
      res.send(error)
    } )

};

// This takes the courseId param
// and uses it to find the courseInfo
// which it adds to the res.locals
exports.addCourseInfo = ( req, res, next ) => {

  const id = req.params.courseId
  Course.findOne({_id:id})
    .exec()
    .then( ( courseInfo ) => {
      res.locals.courseInfo = courseInfo
      next()
    } )
    .catch( ( error ) => {
      console.log("error in addCourseInfo: "+ error.message );
      res.send(error)
    } )

};

// this uses the coursePin parameter
// to lookup the corresponding course
// and add the courseInfo to res.locals
exports.addCourseFromPin = ( req, res, next ) => {
  let coursePin = req.body.coursePin

  Course.findOne({coursePin:coursePin})
    .exec()
    .then( ( courseInfo ) => {
      res.locals.courseInfo = courseInfo
      next()
    } )
    .catch( ( error ) => {
      console.log("error in addCourseFromPin: "+ error.message );
      res.send(error)
    } )

};

// *** MOVE TO  courseMemberController
// this checks to see if the user is enrolled
// in the current course (res.locals.courseInfo)
// and adds the boolean isEnrolled to res.locals
exports.checkEnrollment = ( req, res, next ) => {
  CourseMember.find({studentId:req.user._id,courseId:res.locals.courseInfo._id})
    .exec()
    .then( memberList => {
      res.locals.isEnrolled = (memberList.length > 0)
      next()
    } )
    .catch( ( error ) => {
      console.log("error in checkEnrollment: "+ error.message );
      res.send(error)
    } )

};


// ** MOVE TO courseMemberController
// this adds the current user to the curent course
// assuming res.locals.courseInfo has been set
exports.joinCourse = ( req, res, next ) => {

  let registration =
    {
      studentId: res.locals.user._id,
      courseId: res.locals.courseInfo._id,
      createdAt: new Date(),
    }


  let newCourseMember = new CourseMember(registration)

  newCourseMember.save()
    .then( (a) => {
      next();
    } )
    .catch( error => {
      console.log("Error while saving courseMember:"+error.message)
      res.send( error );
    } );


};


exports.getStudentsInCourse = ( req, res, next ) => {
  CourseMember.find({courseId:res.locals.courseInfo._id})
    .exec()
    .then( memberList => {
      res.locals.students = memberList.map((x)=>x.studentId)
      next()
    } )
    .catch( ( error ) => {
      console.log("error in checkEnrollment: "+ error.message );
      res.send(error)
    } )

};

exports.getStudentsInfo = ( req, res, next ) => {
  User.find({_id:{$in:res.locals.students}})
    .exec()
    .then( studentsInfo => {
      //console.dir(res.locals.students)
      res.locals.studentsInfo = studentsInfo
      next()
    } )
    .catch( ( error ) => {
      console.log("error in checkEnrollment: "+ error.message );
      res.send(error)
    } )

};

exports.createGradeSheet = ( req, res, next ) => {
  const gradeSheet =
     createGradeSheet(
       res.locals.studentsInfo,
       res.locals.problems,
       res.locals.answers,
       res.locals.reviews)
  res.locals.gradeSheet = gradeSheet
  const courseId = req.params.courseId
  Course.findOneAndUpdate(
          {_id:courseId},
          {$set:{gradeSheet:gradeSheet,gradesUpdateTime:new Date()}},
          {new:true})
    .exec()
    .then((newCourse) => {
      next()
    })
    .catch( (error) => {
      console.log("error in createGradeSheet: "+ error.message );
      res.send('cgs: '+error)
    })
};

function createGradeSheet(students, problems, answers, reviews){
  let gradeSheet = {}
  let problemList = {}
  let answerList={}
  for (let s in students){
    let student = students[s]
    gradeSheet[student._id]={student:student,answers:{}}
  }
  for (let p in problems){
    let problem = problems[p]
    problemList[problem._id]=problem
  }
  for (let a in answers){
    let answer = answers[a]
    try {

      answerList[answer._id]= answer
      // it is possible that a TA will not be a student
      // so we need to create a
      gradeSheet[answer.studentId] =
          gradeSheet[answer.studentId] || {status:'non-student',student:'non-student',answers:{}}
      gradeSheet[answer.studentId]['answers'][answer._id]
        ={answer:answer, reviews:[]}
    } catch(e){
      console.log("Error in createGradeSheet: "+error.message+" "+error)
    }
  }

  for (let r in reviews) {
    let review = reviews[r]
    try {
      let z =
        gradeSheet[answerList[review.answerId].studentId]
          ['answers'][review.answerId]
      //z['reviews'] = z['reviews']||[]
      z['reviews'].push(review)
    } catch(e){
      console.log("Error in createGradeSheet-2s: "+error.message+" "+error)


    }
  }


  return {grades:gradeSheet,problems:problemList,answers:answerList}
}
