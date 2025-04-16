const bcrypt = require("bcryptjs");

bcrypt.hash("admin12345", 10).then(hash => {
  console.log("Hashed Password:", hash);
});