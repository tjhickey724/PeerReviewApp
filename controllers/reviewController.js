const Review = require('../models/Review')

exports.getAllReviewsForCourse = ( req, res, next ) => {

  const courseId = res.locals.courseInfo._id
  Review.find({courseId:courseId})
    .exec()
    .then( reviews => {
      res.locals.reviews = reviews
      next()
    } )
    .catch( ( error ) => {
      console.log("Error in getAllReviewsForCourse: "+ error.message );
      res.send('gARFC: '+error)
    } )

};
