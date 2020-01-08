console.log("Loading function clickThumb")
    // code to handle clicking on the ThumbsUp for a review
function clickThumb(i,reviewId,userId){

  let urlPath=reviewId+"/"+userId
  let review = document.getElementById("review"+i)
  let likeSpan = document.getElementById("likes"+i)
  let numLikes = parseInt(likeSpan.innerHTML)
  let c = review.getAttribute("class")
  if (c.startsWith("far")){

      review.setAttribute("class","fas"+c.substring(3))
      likeSpan.innerHTML = numLikes+1

      fetch('/thumbsUp/'+urlPath)
        .then(function(response) {
            response.text()
               .then(function(text) {
                   // don't need the response yet
               });
        });

  }else {

      review.setAttribute("class","far"+c.substring(3))
      likeSpan.innerHTML = numLikes-1

      fetch('/thumbsDown/'+urlPath)
        .then(function(response) {
            response.text()
               .then(function(text) {
                   // don't need the response yet
               });
        });
  }
}
