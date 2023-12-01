const chai = require("chai");
const assert = chai.assert;

const { findUserFromEmail } = require("../helpers.js");

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "a@a.com",
    password: "1234"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "b@b.com",
    password: "5678"
  }
};

describe("findUserFromEmail", function() {

  it("should return a user with a valid email", function() {
    const user = findUserFromEmail("a@a.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it("should return undefined if email is not in the database", () => {
    const user = findUserFromEmail("bob@b.com", testUsers);
    assert.equal(user, undefined);
  });

  it("should return an object", () => {
    const userObject = findUserFromEmail("a@a.com", testUsers);
    const type = typeof(userObject);
    assert.equal(type, "object");
  });
  
});