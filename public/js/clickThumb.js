console.log("Loading function clickThumb")
    // code to handle clicking on the ThumbsUp/Down for a review
function clickThumb(i,reviewId,userId,direction){

  const urlPath=reviewId+"/"+userId
  const reviewU = document.getElementById("reviewU"+i)
  const reviewD = document.getElementById("reviewD"+i)
  const review = document.getElementById("review"+direction+i)
  const likeSpan = document.getElementById("likes"+i)
  let numLikes = parseInt(likeSpan.innerHTML)
  const c = review.getAttribute("class")
  const cU = reviewU.getAttribute("class")
  const cD = reviewD.getAttribute("class")
  const isU = reviewU.getAttribute("class").startsWith('fas')
  const isD = reviewD.getAttribute("class").startsWith('fas')
  const otherDirection = (direction=='U')?'D':'U'
  let mode = ""
  if (!isU && !isD){
    if (direction=='U'){
      mode='up/select'
    } else {
      mode = 'down/select'
    }
  }else if (isU){
    mode = 'up/deselect'
  }else {
    mode='down/deselect'
  }
  switch (mode){
    case 'up/select':
      console.log("in up/select")
      reviewU.setAttribute("class","fas"+cU.substring(3))
      likeSpan.innerHTML = numLikes+1
      fetch('/thumbsU'+'/select/'+urlPath)
        .then(function(response) {
            response.text()
               .then(function(text) {
                   // don't need the response yet
               });
        });
      break
    case 'down/select':
      console.log("in down/select")
      reviewD.setAttribute("class","fas"+cD.substring(3))
      likeSpan.innerHTML = numLikes-1
      fetch('/thumbsD'+'/select/'+urlPath)
        .then(function(response) {});
      break
    case 'up/deselect':
      console.log("in up/deselect")
      reviewU.setAttribute("class","far"+cU.substring(3))
      likeSpan.innerHTML = numLikes-1
      fetch('/thumbsU'+'/deselect/'+urlPath)
        .then(function(response) {});
      break
    case 'down/deselect':
      console.log("in down/deselect")
      reviewD.setAttribute("class","far"+cD.substring(3))
      likeSpan.innerHTML = numLikes+1
      fetch('/thumbsD'+'/deselect/'+urlPath)
        .then(function(response) {});
      break
  }

}

function clickGoodAnswer(i,answerId,problemId,points){
  console.log(answerId+"/"+problemId+" "+i+" "+points)
  /*
    This should send a message to the server to have it
    create a positive review for this person.
    I should do a post command sending the
    userId, answerId, review, and points
  */
  let thumbs=document.getElementsByClassName("grader_"+i)
  for (let x of thumbs){ x.style.visibility="hidden"}

  let urlPath = problemId+"/"+answerId
  let review = "Good"
  if (points==0) {review = "No, please see a TA to see why this is wrong..."}
  fetch('/giveGoodGrade/'+urlPath,
      {
       headers:{
         "Content-Type":"application/json"
        },
       body:JSON.stringify({review:review,points:points}),
       method:"POST",
     })
    .then(function(response) {console.log(response)});
}
