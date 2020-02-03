// Dependencies
/*var express = require("express");
var mongojs = require("mongojs");
var logger = require("morgan");
const mongoose = require("mongoose")
// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");
const db = require("./models")

// Initialize Express
var app = express();

// Database configuration
const url = 'mongodb://localhost:27017/mongo_scraper_with_link';
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});*/

var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var mongojs = require("mongojs");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// Main route (simple Hello World Message)
/*app.get("/", function (req, res) {
    res.send("Hello world");
});*/

// Retrieve data from the db
app.get("/all", function (req, res) {
    // Find all results from the scrapedData collection in the db
    db.scrapedData.find({}, function (error, found) {
        // Throw any errors to the console
        if (error) {
            console.log(error);
        }
        // If there are no errors, send the data to the browser as json
        else {
            res.json(found);
        }
    });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function (req, res) {
    // Make a request via axios for the news section of `oldreedit`
    let results = [];
    axios.get("https://old.reddit.com/top/").then(function (response) {
        const data = response.data;
        const $ = cheerio.load(data)
        $("a.title").each((i, element) => {
            // Save the text and href of each link enclosed in the current element
            let title = element.children[0].data;
            let link = "https://old.reddit.com" + element.attribs.href
            results.push({
                title: title,
                link: link
            });
        });
        res.json(results)
        // Create a new Article using the `result` object built from scraping
        db.Articles.create(results)
            .then(function (dbArticle) {
                // View the added result in the console
            })
            .catch(function (err) {
                // If an error occurred, log it
                console.log(err);
            });
    });
    // Send a message to the client
    res.send("Scrape Completed!");

});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // TODO: Finish the route so it grabs all of the articles
    // Find all results from the scrapedData collection in the db
    db.Articles.find()
        // Throw any errors to the console
        .then(function (dbPopulate) {
            // If any Libraries are found, send them to the client with any associated articles
            res.json(dbPopulate);
        })
        .catch(function (err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // TODO
    // ====
    // Finish the route so it finds one article using the req.params.id,
    // and run the populate method with "note",
    // then responds with the article with the note included
    db.Articles.findById(req.params.id)
        .populate("note")
        .then(function (dbPopulate) {
            // If any Libraries are found, send them to the client with any associated Books
            res.json(dbPopulate);
        })
        .catch(function (err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // TODO
    // ====
    // save the new note that gets posted to the Notes collection
    // then find an article from the req.params.id
    // and update it's "note" property with the _id of the new note
    db.Note.create(req.body)
        .then(function (dbPopulate) {

            return db.Articles.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbPopulate._id } }, { new: true });
        })
        .then(function (dbPopulate) {
            // If the Library was updated successfully, send it back to the client
            res.json(dbPopulate);
        })
        .catch(function (err) {
            // If an error occurs, send it back to the client
            res.json(err);
        });
});



// Listen on port 3000
app.listen(PORT, function () {
    console.log("App running on port" + PORT + "!");
});
