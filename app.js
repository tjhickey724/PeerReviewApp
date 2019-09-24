var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// require the socket.io module


//var apikey = require('./config/apikey');

// AUTHENTICATION MODULES
session = require("express-session"),
bodyParser = require("body-parser"),
User = require( './models/User' ),
flash = require('connect-flash')
// END OF AUTHENTICATION MODULES

const mongoose = require( 'mongoose' );

mongoose.connect( 'mongodb://localhost/pra', { useNewUrlParser: true } );
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we are connected!!!")
});

const classController = require('./controllers/classController')
const problemSetController = require('./controllers/problemSetController')
const problemController = require('./controllers/problemController')
const answerController = require('./controllers/answerController')

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
      console.log("user has been Authenticated")
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
        console.log("session has been destroyed")
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
    console.log("checking to see if they are authenticated!")
    // if user is authenticated in the session, carry on
    res.locals.loggedIn = false
    if (req.isAuthenticated()){
      console.log("user has been Authenticated")
      res.locals.loggedIn = true
      return next();
    } else {
      console.log("user has not been authenticated...")
      res.redirect('/login');
    }
}


app.get('/',
  classController.getClassesYouOwn,
  classController.getRegistrations,
  classController.getClassesYouTake,
  function(req, res, next) {
      res.render('index',{title:"PRA"});
});

app.use(isLoggedIn)

app.get('/createClass',
      (req,res) => res.render('createClass'))

app.post('/createNewClass',
      classController.createClass,
      (req,res) => res.redirect('/'))

app.get('/showClass/:classId',
      classController.addClassInfo,
      classController.checkEnrollment,
      problemSetController.getProblemSets,
      (req,res) => res.render('showClass'))

app.post('/joinClass',
      classController.addClassFromPin,
      classController.checkEnrollment,
      problemSetController.getProblemSets,
      classController.joinClass,
      (req,res) => res.render("showClass")
    )

app.get('/addProblemSet/:classId',
      classController.addClassInfo,
      (req,res) => res.render("addProblemSet")
    )

app.post('/saveProblemSet/:classId',
      classController.addClassInfo,
      problemSetController.saveProblemSet,
      problemSetController.getProblemSets,
      (req,res) => res.render("showClass")
    )

app.get('/showProblemSet/:psetId',
      problemSetController.getProblemSet,
      problemSetController.getProblems,
      problemSetController.getClassInfo,
      (req,res) => res.render('showProblemSet'))

app.get('/addProblem/:psetId',
      (req,res) => res.render("addProblem",{psetId:req.params.psetId})
    )

app.post('/saveProblem/:psetId',
      problemSetController.getProblemSet,
      problemSetController.getClassInfo,
      problemSetController.saveProblem,
      problemSetController.getProblems,
      (req,res) => res.render("showProblemSet")
    )
app.post('/updateProblem/:probId',
    problemController.getProblemP,
    problemController.getCourseL,
    answerController.getAnswer,
    problemController.updateProblemLB,
    answerController.getProblem,
    //problemController.getProblemSetL,
    //problemSetController.getProblems,
    (req,res) => res.render("showProblem",{probId:req.params.probId})
  )
app.get('/showProblem/:probId',
      answerController.getAnswer,
      answerController.getProblem,
      problemController.getAnswerCountL,
      problemController.getReviewCountL,
      problemController.getCourseL,
      (req,res) => res.render("showProblem",{probId:req.params.probId})
    )

app.get('/editProblem/:probId',
    problemController.getProblemP,
    problemController.getCourseL,
    (req,res) => res.render("editProblem",{probId:req.params.probId})
  )


app.post('/saveAnswer/:probId',
      answerController.getProblem,
      answerController.saveAnswer,
      answerController.getAnswer,
      (req,res) => res.render("showProblem" ,{probId:req.params.probId})
    )

app.get('/reviewAnswers/:probId',
      answerController.getProblem,
      answerController.getMyReviews,
      answerController.getNextAnswer,
      (req,res) => res.render("reviewAnswer")
    )

app.post('/saveReview/:probId/:answerId',
    answerController.getProblem,
    answerController.saveReview,
    answerController.getMyReviews,
    answerController.getNextAnswer,
    (req,res) =>
      res.render("reviewAnswer")
  )

app.get('/showStudentInfo/:classId',
  classController.addClassInfo,
  //classController.getStudents,
  (req,res) => res.render("showStudentInfo")
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
