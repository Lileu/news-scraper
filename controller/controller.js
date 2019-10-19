var express = require ("express");
var router = express.Router();
var path = require("path");

var request = require("request");
var cheerio = require("cheerio");

// import our models
var Comment = require("../models/Comment.js");
var Article = require("../models/Article.js");

// index route to all articles
router.get("/", function(req, res) {
    res.redirect("/articles");
  });


// Route for getting all articles from the db, to populate the DOM
router.get("/articles", function(req, res) {
    Article.find().sort({_id: -1})
    .exec(function(err, doc) {
        if(err){
            console.log(err);
        } else{
            var artcl = {article: doc};
            res.render('index', artcl);
        }
    });
});

// GET route to scrape the website 
router.get('/scrape', function(req, res) {
    // pass in the html document
    request('https://www.betootaadvocate.com/', function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        var titlesArray = [];
        // Now, we grab every article
        $('.td-module-title').each(function(i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children('a').text();
            result.link = $(this).children('a').attr('href');

            // ensures that no empty title or links are sent to mongodb
            if(result.title !== "" && result.link !== ""){
              // check for duplicates
              if(titlesArray.indexOf(result.title) == -1){

                // push the saved title to the titles array 
                titlesArray.push(result.title);

                // only add the article if is not already there
                Article.count({ title: result.title}, function (err, test){
                    //if the test is 0, the entry is unique and good to save
                  if(test == 0){

                    // using Article model, create new object
                    var entry = new Article (result);

                    // save entry to mongodb
                    entry.save(function(err, doc) {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log(doc);
                      }
                    });

                  }
            });
        }
          // Log to indicate that the scrape worked but the article already exists in the db
          else{
          console.log('Article already exists.')
        }

          }
          // Log to indicate that the scrape worked but there was incomplete data
          else{
            console.log('Not saved to database, missing data')
          }
        });
        // after scrape, redirects to index
        res.redirect('/');
    });
});



// Route to retrieve the articles we scraped in JSON format
router.get('/articles-json', function(req, res) {
    Article.find({}, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});

// Route to clear all articles
router.get("/clearAll", function(req, res) {
    Article.remove({}, function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        console.log("removed all articles");
      }
    });
    res.redirect("/articles-json");
  });

// Route for grabbing a specific Article by id, populate it with its content
router.get('/readArticle/:id', function(req, res){
    var articleId = req.params.id;
    var hbsObj = {
      article: [],
      body: []
    };


// Route for populating an Article's comment by the articleId
Article.findOne({ _id: articleId })
    .populate("comment")
    .exec(function(err, doc) {
      if (err) {
        console.log("Error: " + err);
      } else {
        hbsObj.article = doc;
        var link = doc.link;
        request(link, function(error, response, html) {
          var $ = cheerio.load(html);

          $(".l-col__main").each(function(i, element) {
            hbsObj.body = $(this)
              .children(".c-entry-content")
              .children("p")
              .text();

            res.render("article", hbsObj);
            return false;
          });
        });
      }
    });
});

// Route to post a comment to an Article 
router.post("/comment/:id", function(req, res) {
    var user = req.body.name;
    var content = req.body.comment;
    var articleId = req.params.id;
  
    var commentObj = {
      name: user,
      body: content
    };

    var newComment = new Comment(commentObj);

    newComment.save(function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        console.log(doc._id);
        console.log(articleId);
  
        Article.findOneAndUpdate(
          { _id: req.params.id },
          { $push: { comment: doc._id } },
          { new: true }
        ).exec(function(err, doc) {
          if (err) {
            console.log(err);
          } else {
            res.redirect("/readArticle/" + articleId);
          }
        });
      }
    });
  });
  

module.exports = router;