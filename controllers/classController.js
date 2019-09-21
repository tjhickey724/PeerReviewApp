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


// this displays all of the skills
exports.getRegistrations = ( req, res, next ) => {
  //gconsle.log('in getAllSkills')
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



// this displays all of the skills
exports.getClassesYouTake = ( req, res, next ) => {
  //gconsle.log('in getAllSkills')
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


// this displays all of the skills
exports.getClassesYouOwn = ( req, res, next ) => {
  //gconsle.log('in getAllSkills')
  if (!req.user) next()

  Class.find({ownerId:req.user._id})
    .exec()
    .then( ( classes ) => {
      res.locals.classes = classes
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getAllYourClasses: "+ error.message );
      res.send(error)
    } )

};

// this displays all of the skills
exports.addClassInfo = ( req, res, next ) => {
  //gconsle.log('in getAllSkills')
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


exports.addClassFromPin = ( req, res, next ) => {
  //console.log("in saveSkill!")
  console.log("in addClass.... req.user._id=")
  console.log(req.user._id)
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

exports.joinClass = ( req, res, next ) => {
  //console.log("in saveSkill!")
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
