var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// require the socket.io module

// Models!
const Course = require('./models/Course' );
const ProblemSet = require('./models/ProblemSet' );
const Problem = require('./models/Problem' );
const Answer = require('./models/Answer')
const Review = require('./models/Review')
const User = require('./models/User')
const CourseMember = require('./models/CourseMember')



//var apikey = require('./config/apikey');

// AUTHENTICATION MODULES
session = require("express-session"),
bodyParser = require("body-parser"),
flash = require('connect-flash')
// END OF AUTHENTICATION MODULES

const mongoose = require( 'mongoose' );

mongoose.connect( 'mongodb://localhost/pra', { useNewUrlParser: true } );
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected!!!")
});

const dbController = require('./controllers/dbController')
const courseController = require('./controllers/courseController')
const problemSetController = require('./controllers/problemSetController')
const problemController = require('./controllers/problemController')
const answerController = require('./controllers/answerController')
const reviewController = require('./controllers/reviewController')

// Authentication
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
// here we set up authentication with passport
const passport = require('passport')
const configPassport = require('./config/passport')
configPassport(passport)


var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



/*************************************************************************
     HERE ARE THE AUTHENTICATION ROUTES
**************************************************************************/

app.use(session(
  { secret: 'zzbbyanana',
    resave: false,
    saveUninitialized: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));



const approvedLogins = ["tjhickey724@gmail.com","csjbs2018@gmail.com"];

// here is where we check on their logged in status
app.use((req,res,next) => {
  res.locals.title="Peer Review App"
  res.locals.loggedIn = false
  if (req.isAuthenticated()){
      res.locals.user = req.user
      res.locals.loggedIn = true
    }
  else {
    res.locals.loggedIn = false
  }
  next()
})



// here are the authentication routes

app.get('/loginerror', function(req,res){
  res.render('loginerror',{})
})

app.get('/login', function(req,res){
  res.render('login',{})
})



// route for logging out
app.get('/logout', function(req, res) {
        req.session.destroy((error)=>{console.log("Error in destroying session: "+error)});
        req.logout();
        res.redirect('/');
    });


// =====================================
// GOOGLE ROUTES =======================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));


app.get('/login/authorized',
        passport.authenticate('google', {
                successRedirect : '/',
                failureRedirect : '/loginerror'
        })
      );


// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    res.locals.loggedIn = false
    if (req.isAuthenticated()){
      res.locals.loggedIn = true
      return next();
    } else {
      res.redirect('/login');
    }
}


app.get('/',
    async ( req, res, next ) => {
      console.log("in new app.get(/)")

      if (!req.user) next()

      let coursesOwned = await Course.find({ownerId:req.user._id})
      res.locals.coursesOwned = coursesOwned
      res.locals.coursesTAing = []

      let registrations = await  CourseMember.find({studentId:req.user._id})
      res.locals.registeredCourses = registrations.map((x)=>x.courseId)

      let coursesTaken = await Course.find({_id:{$in:res.locals.registeredCourses}})
      res.locals.coursesTaken = coursesTaken

      res.locals.title = "PRA"
      res.render('index');
    }

)

app.use(isLoggedIn)

app.get('/createCourse',
      (req,res) => res.render('createCourse'))

// rename this to /createCourse and update the ejs form
app.post('/createNewCourse',
  async ( req, res, next ) => {
    try {
      let coursePin =  await getCoursePin()
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
          res.redirect('/');
        } )
        .catch( error => {
          res.send( error );
        } );
      }
    catch(e){
      next(e)
    }
  }
)

async function getCoursePin(){
  // this only works if there are many fewer than 10000000 courses
  // but that won't be an issue with this alpha version!
  let coursePin =  Math.floor(Math.random()*10000000)
  let lookupPin = await Course.find({coursePin:coursePin})
  console.log("picking coursePin="+coursePin+" duplicates? "+lookupPin.length)
  while (lookupPin.length>0) {
    coursePin =  Math.floor(Math.random()*10000000)
    lookupPin = await Course.find({coursePin:coursePin})
  }
  return coursePin
}



app.get('/showCourse/:courseId',
  async ( req, res, next ) => {
    try {
      const id = req.params.courseId
      res.locals.courseInfo = await Course.findOne({_id:id})

      const memberList = await CourseMember.find({studentId:req.user._id,courseId:res.locals.courseInfo._id})
      res.locals.isEnrolled = (memberList.length > 0)

      res.locals.problemSets = await ProblemSet.find({courseId:res.locals.courseInfo._id})

      res.render('showCourse')
    }
    catch(e){
      next(e)
    }
  }
)



app.post('/joinCourse0',
      courseController.addCourseFromPin,
      courseController.checkEnrollment,
      problemSetController.getProblemSets,
      courseController.joinCourse,
      (req,res) => res.render("showCourse")
    )

app.post('/joinCourse',
  async (req, res, next ) => {
    try {
      let coursePin = req.body.coursePin
      console.log(`coursePin=${coursePin}`)

      res.locals.courseInfo = await Course.findOne({coursePin:coursePin})

      const memberList = await CourseMember.find({studentId:req.user._id,courseId:res.locals.courseInfo._id})
      res.locals.isEnrolled = (memberList.length > 0)

      res.locals.problemSets = await ProblemSet.find({courseId:res.locals.courseInfo._id})

      let registration =
        {
          studentId: res.locals.user._id,
          courseId: res.locals.courseInfo._id,
          createdAt: new Date(),
        }

      let newCourseMember = new CourseMember(registration)

      await newCourseMember.save()
        .then( (a) => {
          res.render("showCourse")
        } )
        .catch( error => {
          console.log("Error while saving courseMember:"+error.message)
          res.send( error );
        } );

    }
    catch(e){
      next(e)
    }
  }
)




app.get('/addProblemSet/:courseId',
  async ( req, res, next ) => {
      const id = req.params.courseId
      res.locals.courseInfo = await Course.findOne({_id:id})
      res.render("addProblemSet")
    }
)


app.post('/saveProblemSet/:courseId',
  async ( req, res, next ) => {
    try {
      const id = req.params.courseId
      let newProblemSet = new ProblemSet(
         {
          name: req.body.name,
          courseId:id,
          createdAt: new Date()
         }
      )
      console.log(JSON.stringify(newProblemSet))
      await newProblemSet.save()

      res.locals.courseInfo = await Course.findOne({_id:id})
      console.log("got course info")
      res.locals.problemSets =
        await ProblemSet.find({courseId:res.locals.courseInfo._id})
      console.log("got problemsets")
      res.render("showCourse")
    }
    catch(e){
      next(e)
    }
  }
)

app.get('/showProblemSet/:psetId',
  async ( req, res, next ) => {
    const psetId = req.params.psetId
    res.locals.psetId = psetId
    res.locals.problemSet = await ProblemSet.findOne({_id:psetId})
    res.locals.problems = await Problem.find({psetId:psetId})
    res.locals.courseInfo = await Course.findOne({_id:res.locals.problemSet.courseId})
    res.render('showProblemSet')
  }
)

app.get('/addProblem/:psetId',
      (req,res) => res.render("addProblem",{psetId:req.params.psetId})
    )


app.post('/saveProblem/:psetId',
  async ( req, res, next ) => {
    try{
        const psetId = req.params.psetId
        res.locals.psetId = psetId
        res.locals.problemSet = await ProblemSet.findOne({_id:psetId})
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

        await newProblem.save()
            .then( (p) => {
              res.locals.problem = p
            } )

        res.locals.problems = await Problem.find({psetId:psetId})
        res.locals.courseInfo = await Course.findOne({_id:res.locals.problemSet.courseId})
        res.render("showProblemSet")
      }
    catch(e){
      next(e)
    }
  }
)

app.post('/updateProblem/:probId',
  async ( req, res, next ) => {
    try {
      const id = req.params.probId
      res.locals.problem = await Problem.findOne({_id:id})
      res.locals.course = await Course.findOne({_id:res.locals.problem.courseId})
      let answers = await Answer.find({problemId:id,studentId:res.locals.user._id})
      if (answers.length==0){
        res.locals.answered = false
        res.locals.answer=""
      } else {
        res.locals.answered = true
        res.locals.answer = answers[0]
      }
      let problem = res.locals.problem
      problem.description= req.body.description
      problem.problemText= req.body.problemText
      problem.points= req.body.points
      problem.rubric= req.body.rubric
      problem.createdAt =  new Date()

      problem.save()
        .then( (p) => {
          res.locals.problem = p
        } )

      res.redirect("/showProblem/"+req.params.probId)
    }
    catch(e){
      next(e)
    }
  }
)


app.get('/showProblem/:probId',
      async (req, res, next) => {
        try {
          const probId = req.params.probId
          res.locals.probId = probId
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
          res.render("showProblem")
        } catch (e) {
              console.log("Error in showProblem: "+e)
              next(e)
        }
      }
)



app.get('/showAllAnswers/:probId',
    async (req, res, next ) => {
      try {
          const id = req.params.probId
          res.locals.problem = await Problem.findOne({_id:id})
          res.locals.answers = await Answer.find({problemId:id})
            .collation({locale:'en',strength: 2})
            .sort({answer:1})
          res.locals.reviews = await Review.find({problemId:id})
          res.render('showAllAnswers')
      }
    catch(e){
      next(e)
    }
  }
)

app.get('/editProblem/:probId',
  async ( req, res, next ) => {
    const id = req.params.probId
    res.locals.probId = id
    res.locals.problem = await Problem.findOne({_id:id})
    res.locals.course = await Course.findOne({_id:res.locals.problem.courseId})
    res.render("editProblem")
  }
)

app.post('/saveAnswer/:probId',
  async ( req, res, next ) => {
    const id = req.params.probId
    res.locals.problem = await Problem.findOne({_id:id})
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
      }
    )

    res.redirect("/showProblem/"+id)
  }
)

app.get('/reviewAnswers0/:probId',
      dbController.getProblem,
      answerController.getMyReviews,
      answerController.getReviews,
      answerController.getNextAnswer0,
      answerController.getNextAnswer,
      answerController.getReviewsOfAnswer,
      (req,res) => {
          res.render("reviewAnswer")
        }
    )

app.get('/reviewAnswers1/:probId',
      async ( req, res, next ) => {
        const id = req.params.probId
        res.locals.problem = await Problem.findOne({_id:id})

        // use mongoose selection feature to only pull selected fields
        let reviews = await Review.find({reviewerId:req.user._id,problemId:id})
        res.locals.reviewedAnswers = reviews.map((r)=>r.answerId)

        let answers = Answer.find({problemId:id,
               _id:{$not:{$in:res.locals.allReviewedAnswers},
                    $not:{$in:res.locals.reviewedAnswers}   }
                  })
            .exec()
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

        res.render("reviewAnswer")
      }
)



app.get('/reviewAnswers/:probId',
    async (req,res,next) => {
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
        if (answersToReview.length==0) {
          res.locals.answer = false
        } else {
          // even better would be to find all answers with the minimum
          // number of reviews and randomly select one
          res.locals.answerId = answersToReview[answersToReview.length-1]
          res.locals.answer = await Answer.findOne({_id:res.locals.answerId})
        }

        console.log("allAnswers and answers to Review and answers I reviewed")
        console.dir(allAnswers.map(a => a._id))
        console.dir(answersToReview)
        console.dir(myReviewedAnswerIds)
/*
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
        */
        if (res.locals.answer){
          console.log("case 1:"+res.locals.answer)
        } else if (answersToReview.length == 0){
          res.locals.answer=false
          console.log("case 2:"+res.locals.answer)
        } else {
          res.locals.answer = answersToReview[answersToReview.length-1]
          console.log("case 3:"+res.locals.answer)
        }
        res.render("reviewAnswer")
      }catch(error){
          console.log("error in getAnswerToReview: "+error)
          res.send("error in getAnswerToReview: "+error)
      }
    }
  )


app.post('/saveReview0/:probId/:answerId',
    dbController.getProblem,
    answerController.saveReview,
    answerController.getMyReviews,
    answerController.getNextAnswer0,
    answerController.getNextAnswer,
    answerController.getReviewsOfAnswer,
    (req,res) =>
      res.render("reviewAnswer")
  )


  app.post('/saveReview/:probId/:answerId',
      dbController.getProblem,
      answerController.saveReview,
      (req,res) => {
        res.redirect('/reviewAnswers/'+req.params.probId)}
    )




app.get('/showAllStudentInfo/:courseId',
  courseController.addCourseInfo,
  courseController.getStudentsInCourse,
  courseController.getStudentsInfo,
  answerController.getAllAnswersForCourse,
  problemController.getAllProblemsForCourse,
  reviewController.getAllReviewsForCourse,
  courseController.createGradeSheet,
  (req,res) => //res.json(res.locals.gradeSheet) //
        res.render("showAllStudentInfo")
)

app.get('/showOneStudentInfo/:courseId/:studentId',
  courseController.addCourseInfo,
  dbController.getStudentInfo,
  //courseController.getStudentsInCourse,
  //courseController.getStudentsInfo,
  //answerController.getAllAnswersForCourse,
  //problemController.getAllProblemsForCourse,
  //reviewController.getAllReviewsForCourse,
  //courseController.createGradeSheet,
  (req,res) => //res.json(res.locals.gradeSheet) //
        //res.json(res.locals.courseInfo.gradeSheet)
        res.render("showOneStudentInfo")
)

app.get('/showStudentInfo/:courseId',
  courseController.addCourseInfo,
  courseController.getStudentsInCourse,
  courseController.getStudentsInfo,
  answerController.getAllAnswersForCourse,
  problemController.getAllProblemsForCourse,
  reviewController.getAllReviewsForCourse,
  courseController.createGradeSheet,
  (req,res) => //res.json(res.locals.gradeSheet) //
        res.render("showStudentInfo")
)

app.get('/showReviewsOfAnswer/:answerId',
  dbController.getAnswer,
  dbController.getReviews,
  (req,res) => res.render("showReviewsOfAnswer")
)

app.get('/showReviewsByUser/:probId',
  dbController.getProblem,
  dbController.getUsersReviews,
  dbController.getUsersReviewedAnswers,
  (req,res) => res.render("showReviewsByUser")
)

app.get('/showReview/:reviewId',
  (req,res) => res.send("Under Construction")
)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
