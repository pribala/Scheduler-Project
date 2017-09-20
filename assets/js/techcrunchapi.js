var queryURL = "https://newsapi.org/v1/articles?source=techcrunch&sortBy=latest&apiKey=81a7b472a5534b598d2558ce3e1004e4";
 $.ajax({
 url: queryURL,
 method: 'GET'
 }).done(function (response) {
 console.log(response);
 console.log(response.articles[0].title);
 console.log(response.articles[0].description);
 console.log(response.articles[0].url);
 for (var i = 0; i < 5; i++) {
 var title = $("<p>");
 title.text(response.articles[i].description);
 title.css("text-align", "justify");
 /* title.css("font-weight","bold");*/
 var l = $("<a>");
 l.attr("href", response.articles[i].url);
 l.text("Read More");
 l.attr("target", "_blank");
 $("#news").append(title);
 $("#news").append(l);
 $("#news").append($("<hr>"));
 }
 });