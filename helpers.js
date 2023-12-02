// find a user in the users object from its email
const findUserFromEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    };
  };
  return null;
};

// create a 6 character long random string
const generateRandomString = function() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// create object that contains the urlDatabase info specific to the logged in user
const urlsForUser = function(id) {
  const userURLS = {};
  for (let databaseID in urlDatabase) {
    if (urlDatabase[databaseID].userID === id) {
      userURLS[databaseID] = {longURL: urlDatabase[databaseID].longURL, userID: id};
    }
  }
  return userURLS;
};

module.exports = { findUserFromEmail, generateRandomString, urlsForUser };