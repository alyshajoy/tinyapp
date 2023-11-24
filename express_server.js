const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); // set ejs as the template engine

const urlDatabase = { // database for our app, shortURL: longURL
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// function that creates a 6 character long random string
function generateRandomString() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// set up middleware to parse URL encoded data
app.use(express.urlencoded({ extended: true}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

// when client requests "/urls", render the "urls_index" template with urlDatabase
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// create endpoint that renders a webpage that allows users to submit their longURL to get a short one
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// endpoint to create new shortURL
app.post("/urls", (req, res) => {
  // create short URL to give to client
  const shortURL = generateRandomString();
  // save shortURL and longURL to database
  urlDatabase[shortURL] = req.body.longURL;
  // redirect client to "/urls/:id", with their shortURL as the URL parameter
  res.redirect(`/urls/${shortURL}`);
});

// endpoint to delete URL from database
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// endpoint to update longURL
app.post("/urls/:id/update", (req, res) => {
  const shortUrl = req.params.id;
  const longUrl = req.body.longURL;
  urlDatabase[shortUrl] = longUrl;
  res.redirect("/urls");
});

// login endpoint
app.post("/urls/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username); // creates a cookie, username: login form input
  res.redirect("/urls");
});

// create endpoint that takes in URL parameters
app.get("/urls/:id", (req, res) => {
  // templateVars = { id: URL parameter(shortURL), longURL: longURL that matches the shortURL in our database}
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  // render html from "urls_show"
  res.render("urls_show", templateVars);
});

// endpoint that redirects client to the website the shortURL given matches up to in URLdatabase
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  res.redirect(`${urlDatabase[shortURL]}`);
});

// endpoint that gives client json data for /urls
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// send basic html to client when /hello is requested
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// start server, and log message to confirm it is running
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});