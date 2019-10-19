var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");

// Initialize Express
var express = require("express");
var app = express();

// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
// Make public a static folder
app.use(express.static("public"));

// Setup handlebars engine
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost/scraped_news";
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true
});

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Connected to Mongoose!");
});

var routes = require("./controller/controller.js");
app.use("/", routes);

var port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Listening on PORT " + port);
});