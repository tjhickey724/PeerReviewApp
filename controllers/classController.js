'use strict';
const Class = require( '../models/Class' );
const ClassMember = require( '../models/ClassMember' );


exports.createClass = ( req, res, next ) => {
  //console.log("in saveSkill!")
  console.log("in createClass.... req.user=")
  console.dir(req.user)
  let classPin =  Math.floor(Math.random()*10000000)
  let newClass = new Class(
   {
    name: req.body.className,
    ownerId: req.user._id,
    classPin:classPin,
    createdAt: new Date()
   }
  )

  //console.log("skill = "+newSkill)

  newClass.save()
    .then( (a) => {
      console.log('saved a new class: '+req.body.className)
      console.dir(a)
      next();
    } )
    .catch( error => {
      res.send( error );
    } );
};


// this gets all of the classId's
// for classes that a student is enrolled in
exports.getRegistrations = ( req, res, next ) => {

  if (!req.user) next()

  ClassMember.find({studentId:req.user._id})
    .exec()
    .then( registrations => {
      res.locals.registeredClasses = registrations.map((x)=>x.classId)
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getRegistrations: "+ error.message );
      res.send(error)
    } )

};



// this finds all of the classId's
// for classes that the user is taking
exports.getClassesYouTake = ( req, res, next ) => {

  if (!req.user) next()

  Class.find({_id:{$in:res.locals.registeredClasses}})
    .exec()
    .then( ( classes ) => {
      res.locals.classesTaken = classes
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getAllYourClasses: "+ error.message );
      res.send(error)
    } )

};


// this gets all classId's
// for classes owned by the user
exports.getClassesYouOwn = ( req, res, next ) => {

  if (!req.user) next()

  Class.find({ownerId:req.user._id})
    .exec()
    .then( ( classes ) => {
      res.locals.classes = classes
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getClassesYouOwn: "+ error.message );
      res.send(error)
    } )

};

// This takes the classId param
// and uses it to find the classInfo
// which it adds to the res.locals
exports.addClassInfo = ( req, res, next ) => {

  const id = req.params.classId
  console.log('the id is '+id)
  Class.findOne({_id:id})
    .exec()
    .then( ( classInfo ) => {
      res.locals.classInfo = classInfo
      next()
    } )
    .catch( ( error ) => {
      console.log("error in addClassInfo: "+ error.message );
      res.send(error)
    } )

};

// this uses the classPin parameter
// to lookup the corresponding class
// and add the classInfo to res.locals
exports.addClassFromPin = ( req, res, next ) => {
  let classPin = req.body.classPin

  Class.findOne({classPin:classPin})
    .exec()
    .then( ( classInfo ) => {
      console.log("classInfo = "+classInfo)
      res.locals.classInfo = classInfo
      next()
    } )
    .catch( ( error ) => {
      console.log("error in addClassFromPin: "+ error.message );
      res.send(error)
    } )

};

// this checks to see if the user is enrolled
// in the current class (res.locals.classInfo)
// and adds the boolean isEnrolled to res.locals
exports.checkEnrollment = ( req, res, next ) => {
  ClassMember.find({studentId:req.user._id,classId:res.locals.classInfo._id})
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

// this adds the current user to the curent class
// assuming res.locals.classInfo has been set
exports.joinClass = ( req, res, next ) => {

  let registration =
    {
      studentId: res.locals.user._id,
      classId: res.locals.classInfo._id,
      createdAt: new Date(),
    }


  let newClassMember = new ClassMember(registration)

  newClassMember.save()
    .then( (a) => {
      console.log('joined class: ')
      console.dir(registration)
      next();
    } )
    .catch( error => {
      console.log("Error while saving classMember:"+error.message)
      res.send( error );
    } );


};
