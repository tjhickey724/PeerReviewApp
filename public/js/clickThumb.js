console.log("Loading function clickThumb")
    // code to handle clicking on the ThumbsUp for a review
function clickThumb(i){
  let review = document.getElementById("review"+i)
  let c = review.getAttribute("class")
  if (c.startsWith("far")){
      review.setAttribute("class","fas"+c.substring(3))
  }else {
      review.setAttribute("class","far"+c.substring(3))
  }
}
