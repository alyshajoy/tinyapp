const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { findUserFromEmail, generateRandomString, urlsForUser } = require("./helpers.js");

app.set("view engine", "ejs"); // set ejs as the template engine


/////////////DATA///////////////

const urlDatabase = { // database for our app, shortURL: longURL
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  }
};

////////////FUNCTIONS//////////////////

// // create a 6 character long random string
// const generateRandomString = function() {
//   const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//   let result = "";
//   for (let i = 0; i < 6; i++) {
//     result += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return result;
// };

// // create object that contains the urlDatabase info specific to the logged in user
// const urlsForUser = function(id) {
//   const userURLS = {};
//   for (let databaseID in urlDatabase) {
//     if (urlDatabase[databaseID].userID === id) {
//       userURLS[databaseID] = {longURL: urlDatabase[databaseID].longURL, userID: id};
//     }
//   }
//   return userURLS;
// };


///////////MIDDLEWARE//////////////

// parse URL encoded data
app.use(express.urlencoded({ extended: true}));

const key1 = generateRandomString();
const key2 = generateRandomString();

app.use(cookieSession({
  name: "session",
  keys: [key1, key2],
  maxAge: 24 * 60 * 60 * 1000
}));

/////////////ENDPOINTS/////////////////


// when client requests "/urls", render the "urls_index" template with urlDatabase
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send('You need to be logged in to see this content. <a href="/login">Login</a>');
    return;
  }

  const id = req.session.user_id;
  const userURLS = urlsForUser(id);

  const templateVars = {
    urls: userURLS,
    users,
    req
  };
  res.render("urls_index", templateVars);
});

// create endpoint that renders a webpage that allows users to submit their longURL to get a short one
app.get("/urls/new", (req, res) => {
  const templateVars = { users, req };
  if (!req.session.user_id) {   // if user isn't logged in, redirect them to login page
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

// endpoint to create new shortURL
app.post("/urls", (req, res) => {
  
  if (!req.session.user_id) {   // check if user is logged in - if not, send them a message telling them to log in
    res.send('You need to log in to access this service. <a href="/login">Login</a>');
    return;
  }

  const shortURL = generateRandomString();  // create short URL to give to client

  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.user_id};  // save shortURL, longURL, and userID to database
  
  res.redirect(`/urls/${shortURL}`);  // redirect client to "/urls/:id", with their shortURL as the URL parameter
});

// endpoint to delete URL from database
app.post("/urls/:id/delete", (req, res) => {

  const id = req.session.user_id;
  const shortURL = req.params.id;

  if (!id) { // ensure user is logged in before they delete a URL
    res.send('You need to log in to delete URLS. <a href="/login">Log In</a>');
    return;
  }

  if (!urlDatabase[shortURL]) { // ensure the URL that user is requesting to delete exists
    res.send('The URL you are trying to delete does not exist. Create a new shortURL here: <a href="/urls/new">New URL</a>');
    return;
  }

  if (urlDatabase[shortURL].userID !== id) { // check if url they want to delete belongs to user
    res.send('You cannot delete the urls of other users. Log in to your own account here: <a href="/login">Log In</a>');
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// endpoint to update longURL
app.post("/urls/:id/update", (req, res) => {
  const id = req.session.user_id;
  const shortUrl = req.params.id;
  const longUrl = req.body.longURL;

  if (urlDatabase[shortUrl].userID !== id) { // check if url they want to update belongs to user
    res.send('You cannot edit the urls of other users. Log in to your own account here: <a href="/login">Log In</a>');
    return;
  }

  urlDatabase[shortUrl].longURL = longUrl; // change database to have new longURL
  res.redirect("/urls");
});

// endpoint that directs users to the update page when they click the edit button
app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  res.redirect(`/urls/${shortURL}`);
});

// render login page
app.get("/login", (req, res) => {
  const templateVars = { users, req };
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("login", templateVars);
});

// login form endpoint
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const userFromEmail = findUserFromEmail(email, users);

  if (!userFromEmail) { // check if email has been registered
    res.status(403).send('You have not yet registered this email. <a href="/register">Register</a>');
    return;
  }

  const passwordCheck = bcrypt.compareSync(password, userFromEmail.hashedPassword); // check if passwords are a match
  if (!passwordCheck) {
    res.status(403).send('Email and password do not match. <a href="/login">Try again</a>');
    return;
  }

  const id = userFromEmail.id;
  req.session.user_id = users[id].id; // used to be res.cookie("user_id", users[id].id) // creates a cookie with user object
  res.redirect("/urls");
});

// logout form endpoint
app.post("/urls/logout", (req, res) => {
  req.session = null; // used to be res.clearCookie("user_id") -> clears cookie(s)
  res.redirect("/login");
});

// render registration page
app.get("/register", (req, res) => {
  const templateVars = { users, req };
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.render("register", templateVars);
});

// registration form endpoint
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email.length < 1 || password.length < 1) { // check to make sure both email and password fields are filled
    res.status(400).send('Missing email or password. <a href="/login">Try Again</a>');
    return;
  }

  const emailExists = findUserFromEmail(email, users); // check to see if email is already in database
  if (emailExists) {
    res.status(400).send('Email already exists. <a href="/login">Try Again</a>');
    return;
  }

  users[id] = { id, email, hashedPassword }; // add new user to users object
  req.session.user_id = users[id].id; // create cookie that allows user to remain logged in
  res.redirect("/urls");
});

// create endpoint that takes in URL parameters (urls_show)
app.get("/urls/:id", (req, res) => {

  if (!req.session.user_id) {  // if user isn't logged in, send them message telling them to log in
    res.send('You must be logged in to access this page. <a href="/login">Login</a>');
    return;
  }

  const urlParameters = req.params.id;

  if (!urlDatabase[urlParameters]) {  // if shortURL given isn't in database, send user an error message
    res.send('ShortURL does not yet exist. Create a new shortURL here: <a href="/urls/new">Create ShortURL</a>');
    return;
  }

  const userURLS = urlsForUser(req.session.user_id);
  if (!userURLS[urlParameters]) {
    res.send('This shortURL belongs to someone else! Create your own shortURL here: <a href="/urls/new">Create ShortURL</a>');
    return;
  }

  const templateVars = {
    id: urlParameters,
    longURL: urlDatabase[req.params.id].longURL,
    users,
    req
  };
  res.render("urls_show", templateVars);
});

// endpoint that redirects client to the website the shortURL given matches up to in URLdatabase
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  res.redirect(`https://${urlDatabase[shortURL].longURL}`);
});

// endpoint that gives client json data for /urls
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// send basic html to client when /hello is requested
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// when / is requested, logged in is redirected to /urls, not logged in is redirected to login page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});


//////////////////START SERVER///////////////////

// start server, and log message to confirm it is running
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});