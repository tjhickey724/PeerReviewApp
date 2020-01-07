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

mongoose.connect( 'mongodb://localhost/pra_V2_0', { useNewUrlParser: true } );
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected!!!")
});


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

      let coursesOwned =
          await Course.find({ownerId:req.user._id},'name')
      res.locals.coursesOwned = coursesOwned
      res.locals.coursesTAing = []

      let registrations =
          await  CourseMember.find({studentId:req.user._id},'courseId')
      res.locals.registeredCourses = registrations.map((x)=>x.courseId)

      let coursesTaken =
          await Course.find({_id:{$in:res.locals.registeredCourses}},'name')
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
  let lookupPin = await Course.find({coursePin:coursePin},'coursePin')
  console.log("picking coursePin="+coursePin+" duplicates? "+lookupPin.length)
  while (lookupPin.length>0) {
    coursePin =  Math.floor(Math.random()*10000000)
    lookupPin = await Course.find({coursePin:coursePin},'coursePin')
  }
  return coursePin
}



app.get('/showCourse/:courseId',
  async ( req, res, next ) => {
    try {
      const id = req.params.courseId
      res.locals.courseInfo = await Course.findOne({_id:id},'name coursePin ownerId')

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




app.post('/joinCourse',
  async (req, res, next ) => {
    try {
      let coursePin = req.body.coursePin
      console.log(`coursePin=${coursePin}`)

      res.locals.courseInfo =
          await Course.findOne({coursePin:coursePin},'name coursePin ownerId')

      const memberList =
          await CourseMember.find({studentId:req.user._id,courseId:res.locals.courseInfo._id})
      res.locals.isEnrolled = (memberList.length > 0)

      res.locals.problemSets =
          await ProblemSet.find({courseId:res.locals.courseInfo._id})

      let registration =
        {
          studentId: res.locals.user._id,
          courseId: res.locals.courseInfo._id,
          createdAt: new Date(),
        }

      let newCourseMember = new CourseMember(registration)

      await newCourseMember.save()

      res.render("showCourse")

    }
    catch(e){
      next(e)
    }
  }
)




app.get('/addProblemSet/:courseId',
  async ( req, res, next ) => {
      const id = req.params.courseId
      const courseInfo =
          await Course.findOne({_id:id},'name ownerId')
      res.render("addProblemSet",
                  {name:courseInfo.name,
                   ownerId:courseInfo.ownerId,
                   courseId:courseInfo._id})
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

      res.locals.courseInfo =
          await Course.findOne({_id:id},'name coursePin ownerId')
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
    res.locals.problemSet =
        await ProblemSet.findOne({_id:psetId})
    res.locals.problems =
        await Problem.find({psetId:psetId})
    res.locals.courseInfo =
        await Course.findOne({_id:res.locals.problemSet.courseId},
                              'ownerId')
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
            pendingReviews: [],
            createdAt: new Date()
           }
          )

        await newProblem.save()
            .then( (p) => {
              res.locals.problem = p
            } )

        res.locals.problems = await Problem.find({psetId:psetId})
        res.locals.courseInfo =
            await Course.findOne({_id:res.locals.problemSet.courseId},
                                  'ownerId')
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
      const problem =
          await Problem.findOne({_id:req.params.probId})

      problem.description= req.body.description
      problem.problemText= req.body.problemText
      problem.points= req.body.points
      problem.rubric= req.body.rubric
      problem.createdAt =  new Date()

      await problem.save()

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
          res.locals.course =
              await Course.findOne({_id:res.locals.problem.courseId},
                                    'ownerId')
          res.locals.answerCount = await Answer.countDocuments({problemId:probId})
          const reviews = await Review.find({problemId:probId})
          res.locals.reviewCount = reviews.length
          res.locals.averageReview=
              reviews.reduce((t,x)=>t+x.points,0)/reviews.length
          res.locals.answers = await Answer.find({problemId:probId,studentId:res.locals.user._id})

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
    res.locals.course =
        await Course.findOne({_id:res.locals.problem.courseId},'ownerId')
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
          reviewers: [],
          numReviews: 0,
          pendingReviewers: [],
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
    console.log("reviewAnswers-A")
    const probId = req.params.probId
    let problem = await Problem.findOne({_id:probId})

    //first we remove all pendingReviews that have exceeded
    // the time limit of 60 secs = 60,000 ms
    // 60 is a magic number and should be moved up somewhere...
    const tooOld = (new Date).getTime() - 60*1000;
    let expiredReviews = []
    let pendingReviews =
        problem.pendingReviews.filter((x)=>{
          console.log(`${x.timeSent}<?${tooOld}`)
          if (x.timeSent<tooOld) {
            expiredReviews.push(x)
            console.log('removed expired review')
            return false
          }
        })
    problem.pendingReviews = pendingReviews
    problem.markModified('pendingReviews')
    await problem.save()


    console.log("reviewAnswers-B")
    expiredReviews.forEach(async function(x){
      // remove the reviewerId from the list of pendingReviewers
      // and decrement the optimistic numReview field
      // pendingReviews has form x = {answerId,reviewerId,timeSent}
      let tempAnswer = await Answer.findOne({_id:x.answerId})
      tempAnswer.pendingReviewers =
          tempAnswer.pendingReviewers.filter((r)=>{
            if (r.equals(x.reviewerId)) {
              tempAnswer.newReviews -= 1
              return false
            } else {
              return true
            }
          }
        )
      //tempAnswer.markModified('pendingReviewers')
      await tempAnswer.save()

    })

    console.log("reviewAnswers-C")
    // next, we find all answers to this Problem, sorted by numReviews
    let answers =
        await Answer.find({problemId:probId})
                    .sort({numReviews:'asc'})

    // find first answer not already reviewed or being reviewed by user
    let i=0
    let answer = null
    while (i<answers.length){
      answer = answers[i]
      if (!answer.reviewers.find((x)=>(x.equals(req.user._id)))
          &&
          !answer.pendingReviewers.find((x)=>(x.equals(req.user._id)))
        ){
          console.log("reviewAnswers-D1")
          // we found an answer the user hasn't reviewed!
          answer.numReviews += 1 // we optimistically add 1 to numReviews
          answer.pendingReviewers.push(req.user._id)
          console.log("reviewAnswers-D1a")
          await answer.save()
          console.log("reviewAnswers-D1b")
          // {answerId,reviewerId,timeSent}
          problem.pendingReviews.push(
            {answerId:answer._id,
             reviewerId:req.user._id,
             timeSent:(new Date()).getTime()})

          problem.markModified('pendingReviews')
          console.log("reviewAnswers-D2")
          await problem.save()
          break
        }
      else {
        answer=null
      }
      i++
    }


    console.log("reviewAnswers-E")
    // and we need to add it to the problem.pendingReviews
    res.locals.answer = answer
    res.locals.problem = problem
    res.locals.numReviewsByMe =
        await Review.find({problemId:problem._id,
                           reviewerId:req.user._id}).length

    console.log("reviewAnswers-F")
    res.render("reviewAnswer")
  }
  catch(e){
    next(e)
  }
 }
)
/*
  This one works, sort of, but it will be slow with a large class.
  and it doesn't take account of reviews sent but not received..

*/
app.get('/reviewAnswers0/:probId',
    async (req,res,next) => {
      try{
          // this selects the problem with the fewest reviews
          // which hasn't been reviewed by this user.
          // First though it finds answers that haven't been reviewed at all...
          // If the user has reviewed all of the answers, it returns ...
          const probId = req.params.probId
          // first find the problem and course for this problemId
          res.locals.problem = await Problem.findOne({_id:probId})


          // next, get the answers for this problem that I have reviewed
          const myReviews = await Review.find({reviewerId:req.user._id,problemId:probId})
          const myReviewedAnswerIds =
              myReviews.map((x)=>x.answerId)
          res.locals.numReviewsByMe = myReviews.length
          // find all answers I haven't reviewed, sorted by number of reviews
          console.log("reviewAnswer")
          console.dir(myReviewedAnswerIds)
          myReviews.forEach(x => {console.log(x)})
          console.log(`probId=${probId}`)

          console.log("*********")
          const reviewedAnswersToProblem =
             await Review
                    .find({problemId:res.locals.problem._id})
                    .distinct('answerId')
          reviewedAnswersToProblem.forEach(x=>console.log(x))
          console.log("*********")

          const unreviewedAnswers =
              await Answer.find({problemId:res.locals.problem._id,
                                 _id:{$nin:reviewedAnswersToProblem}})
          console.log(unreviewedAnswers)
          unreviewedAnswers.forEach(x=>{console.log(x)})

          if (unreviewedAnswers.length > 0){
              const randPos =
                 Math.floor(Math.random() * unreviewedAnswers.length)
              res.locals.answer = unreviewedAnswers[randPos]
              res.locals.answerId = res.locals.answer._id
          } else {
              const answersToReview =
                 await Review.aggregate(
                   [{$match:{problemId:res.locals.problem._id,
                             answerId:{$nin:myReviewedAnswerIds}}},
                    {$sortByCount:"$answerId"}])

              console.dir(answersToReview)


              if (answersToReview.length==0) {
                res.locals.answer = false
              } else {
                // even better would be to find all answers with the minimum
                // number of reviews and randomly select one
                res.locals.answerId = answersToReview[answersToReview.length-1]
                res.locals.answer = await Answer.findOne({_id:res.locals.answerId})
              }
          }

          res.render("reviewAnswer")
      }catch(error){
          console.log("error in getAnswerToReview: "+error)
          res.send("error in getAnswerToReview: "+error)
      }
    }
  )


  /*  saveReview
    when we save a review we need to create a new review document
    but also update the corresponding answer and problem documents
    to store the new information about number of reviews and pending reviews
    This is used when we generate an answer for a user to review
  */
app.post('/saveReview/:probId/:answerId',

  async ( req, res, next ) => {
    try {
      console.log('saveReview-A')
      const problem =
          await Problem.findOne({_id:req.params.probId})

      const answer =
          await Answer.findOne({_id:req.params.answerId})

      const newReview = new Review(
       {
        reviewerId:req.user._id,
        courseId:problem.courseId,
        psetId:problem.psetId,
        problemId:problem._id,
        answerId:req.params.answerId,
        review:req.body.review,
        points:req.body.points,
        upvoters: [],
        downvoters: [],
        createdAt: new Date()
       }
      )
      console.log('saveReview-A2')
      await newReview.save()
      console.log('saveReview-B')
      // next we update the reviewers info in the answer object
      answer.reviewers.push(req.user._id)
      answer.numReviews += 1

      let pendingReviewers = []
      console.log(`userID=${req.user._id}`)
      for (let i=0; i<answer.pendingReviewers.length; i++){
        const reviewer = answer.pendingReviewers[i]
        console.log(`${i} -- ${reviewer}`)
        if (reviewer.equals(req.user._id)){
          answer.numReviews -= 1
          console.log(`removed ${reviewer} from answer.pendingReviewers`)
          // because we incremented it when we sent the review to user
        } else {
          pendingReviewers.push(reviewer)
        }
      }
      answer.pendingReviewers = pendingReviewers
      answer.markModified('pendingReviewers')
      console.log('saveReview-B2')
      await answer.save()
      console.log('saveReview-C')
      // finally we update the pendingReviews field of the problem
      // to remove this reviewer, if necessary
      let pendingReviews=[]
      for (let i=0; i<problem.pendingReviews.length; i++){
        reviewInfo = problem.pendingReviews[i]
        console.log(`${i} -- ${reviewInfo.reviewerId}`)
        console.dir(reviewInfo.reviewerId)
        if (reviewInfo.reviewerId.equals(req.user._id)){
          console.log(`removed ${req.user._id} from problem ${problem._id}`)
        } else {
          pendingReviews.push(reviewInfo)
        }
      }
      console.log('saveReview-C2')
      problem.pendingReviews = pendingReviews
      console.log('saveReview-C3')
      problem.markModified('pendingReviews')
      console.log('saveReview-C4')
      //console.dir(problem)
      await problem.save()
      console.log('saveReview-D')

      // we can now redirect them to review more answers
      res.redirect('/reviewAnswers/'+req.params.probId)
    }
    catch(e){
      next(e)
    }
  }
)

app.get('/showReviewsOfAnswer/:answerId',
  async ( req, res, next ) => {
    try {
      const id = req.params.answerId
      res.locals.answer = await Answer.findOne({_id:id})
      res.locals.reviews = await Review.find({answerId:id})
      res.render("showReviewsOfAnswer")
      }
    catch(e){
        next(e)
      }
    }
)


app.get('/showReviewsByUser/:probId',
  async ( req, res, next ) => {
      const id = req.params.probId
      res.locals.problem = await Problem.findOne({_id:id})
      res.locals.usersReviews =
          await Review.find(
                            {reviewerId:req.user._id,
                             problemId:res.locals.problem._id}
                           )
      const answerIds = res.locals.usersReviews.map((r)=>r.answerId)
      res.locals.usersReviewedAnswers = await Answer.find(
         {_id:{$in:answerIds}}
        )

      res.render("showReviewsByUser")
    }
)

app.get('/showReview/:reviewId',
  (req,res) => res.send("Under Construction")
)


app.get('/showAllStudentInfo/:courseId',
  (req,res) => {
    res.redirect('/showTheStudentInfo/all/'+req.params.courseId)
  }
)

app.get('/showStudentInfo/:courseId',
  (req,res) => {
    res.redirect('/showTheStudentInfo/summary/'+req.params.courseId)
  }
)

app.get('/showTheStudentInfo/:option/:courseId',
  async ( req, res, next ) => {
    try {
        const id = req.params.courseId
        // get the courseInfo
        res.locals.courseInfo =
            await Course.findOne({_id:id},'name')

        // get the list of ids of students in the course
        const memberList =
            await CourseMember.find({courseId:res.locals.courseInfo._id})
        res.locals.students = memberList.map((x)=>x.studentId)

        res.locals.studentsInfo =
            await User.find({_id:{$in:res.locals.students}})

        const courseId = res.locals.courseInfo._id
        res.locals.answers =
            await Answer.find({courseId:courseId})

        res.locals.problems =
            await Problem.find({courseId:courseId})

        res.locals.reviews =
            await Review.find({courseId:courseId})

        const gradeSheet =
           createGradeSheet(
             res.locals.studentsInfo,
             res.locals.problems,
             res.locals.answers,
             res.locals.reviews)
        //console.log("creating Gradesheet")
        //console.dir(gradeSheet)

        res.locals.gradeSheet = gradeSheet

        await Course.findOneAndUpdate(
                {_id:courseId},
                {$set:{gradeSheet:gradeSheet,gradesUpdateTime:new Date()}},
                {new:true})

        console.log(`option = ${req.params.option}`)

        if (req.params.option == 'all'){
          res.render("showAllStudentInfo")
        } else {
          res.render("showStudentInfo")
        }
      }
    catch(e){
        next(e)
      }
    }
)



app.get('/showOneStudentInfo/:courseId/:studentId',
  async (req, res, next) => {
    try {
      res.locals.courseInfo =
          await Course.findOne({_id:req.params.courseId},'name gradeSheet')
      res.locals.studentInfo =
          await User.findOne({_id:req.params.studentId})
      res.render("showOneStudentInfo")
    }
    catch(e){
      next(e)
    }
  }
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

module.exports = app;
