const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs"); // set ejs as the template engine


/////////////DATA///////////////

const urlDatabase = { // database for our app, shortURL: longURL
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  }
};

////////////FUNCTIONS//////////////////

// create a 6 character long random string
function generateRandomString() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// find a user in the users object from its email
const findUserFromEmail = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    };
  };
  return null;
};
///////////MIDDLEWARE//////////////

// parse URL encoded data
app.use(express.urlencoded({ extended: true}));

app.use(cookieParser());

/////////////ENDPOINTS/////////////////

app.get("/", (req, res) => {
  res.send("Hello!");
});

// when client requests "/urls", render the "urls_index" template with urlDatabase
app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    users,
    req
   };
  res.render("urls_index", templateVars);
});

// create endpoint that renders a webpage that allows users to submit their longURL to get a short one
app.get("/urls/new", (req, res) => {
  const templateVars = { users, req };
  if (!req.cookies.user_id) {   // if user isn't logged in, redirect them to login page
    res.redirect("/login");
    return;
  }
  res.render("urls_new", templateVars);
});

// endpoint to create new shortURL
app.post("/urls", (req, res) => {
  
  if (!req.cookies.user_id) {   // check if user is logged in - if not, send them a message telling them to log in
    res.send('You need to log in to access this service. <a href="/login">Login</a>');
    return;
  }

  const shortURL = generateRandomString();  // create short URL to give to client
  urlDatabase[shortURL] = req.body.longURL;  // save shortURL and longURL to database
  
  res.redirect(`/urls/${shortURL}`);  // redirect client to "/urls/:id", with their shortURL as the URL parameter
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

// render login page
app.get("/login", (req, res) => {
  const templateVars = { users, req };
  if (req.cookies.user_id) {
    res.redirect("/urls");
  }
  res.render("login", templateVars);
});

// login form endpoint
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const userFromEmail = findUserFromEmail(email);

  if (!userFromEmail) { // check if email has been registered
    res.status(403).send('You have not yet registered this email. <a href="/register">Register</a>');
    return;
  };

  if (userFromEmail.password !== password) { // check if password matches email
    res.status(403).send('Email and password do not match. <a href="/login">Try again</a>');
    return;
  };

  const id = userFromEmail.id;
  res.cookie("user_id", users[id].id); // creates a cookie with user object
  res.redirect("/urls");
});

// logout form endpoint
app.post("/urls/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// render registration page
app.get("/register", (req, res) => {
  const templateVars = { users, req };
  if (req.cookies.user_id) {
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

  if (email.length < 1 || password.length < 1) { // check to make sure both email and password fields are filled
    res.status(400).send("Missing email or password");
    return;
  };

  const emailExists = findUserFromEmail(email); // check to see if email is already in database
  if (emailExists) {
    res.status(400).send("Email already exists");
    return;
  };

  users[id] = { id, email, password }; // add new user to users object
  res.cookie("user_id", users[id].id); // create cookie that allows user to remain logged in
  res.redirect("/urls");
});

// create endpoint that takes in URL parameters
app.get("/urls/:id", (req, res) => {
  // templateVars = { id: URL parameter(shortURL), longURL: longURL that matches the shortURL in our database}
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    users,
    req
  };
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


//////////////////START SERVER///////////////////

// start server, and log message to confirm it is running
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});