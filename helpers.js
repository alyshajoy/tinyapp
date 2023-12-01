// find a user in the users object from its email
const findUserFromEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    };
  };
  return null;
};

module.exports = { findUserFromEmail };