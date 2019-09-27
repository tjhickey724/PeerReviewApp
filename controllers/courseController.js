'use strict';
const Course = require( '../models/Course' );
const CourseMember = require( '../models/CourseMember' );


exports.createCourse = ( req, res, next ) => {
  //console.log("in saveSkill!")
  console.log("in createCourse.... req.user=")
  console.dir(req.user)
  let coursePin =  Math.floor(Math.random()*10000000)
  let newCourse = new Course(
   {
    name: req.body.courseName,
    ownerId: req.user._id,
    coursePin:coursePin,
    createdAt: new Date()
   }
  )

  //console.log("skill = "+newSkill)

  newCourse.save()
    .then( (a) => {
      console.log('saved a new course: '+req.body.courseName)
      console.dir(a)
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};


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
  console.log('the id is '+id)
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
      console.log("courseInfo = "+courseInfo)
      res.locals.courseInfo = courseInfo
      next()
    } )
    .catch( ( error ) => {
      console.log("error in addCourseFromPin: "+ error.message );
      res.send(error)
    } )

};

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
      console.log('joined course: ')
      console.dir(registration)
      next();
    } )
    .catch( error => {
      console.log("Error while saving courseMember:"+error.message)
      res.send( error );
    } );


};
