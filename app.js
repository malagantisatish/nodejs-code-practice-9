const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

let db = null;

let initializerDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is starting at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Error at ${error.message}`);
    process.exit(1);
  }
};

initializerDatabase();

// register the user

app.post("/register", async (request, response) => {
  const { username, password, name, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    //create user in user table
    if (password.length < 5) {
      // if password less than 5 chars
      response.status(400);
      response.send("Password is too short");
    } else {
      const registerUserQuery = `INSERT INTO user
     (username,password,name,gender,location)
    VALUES ('${username}','${hashedPassword}','${name}','${gender}','${location}') ;`;
      await db.run(registerUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    // send user already registered
    response.status(400);
    response.send("User already exists");
  }
});

//user login api

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    //send response as user doesn't exit
    response.status(400);
    response.send("Invalid user");
  } else {
    //check the password is matched or not
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password); // gives true or false as result
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// change the password of the user api

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    // check the password old password
    isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatched) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user SET password='${hashedPassword}'
        WHERE username='${username}';`;
        await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
