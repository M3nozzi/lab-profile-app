const express = require("express");
const authRoutes = express.Router();

const passport = require("passport");
const bcrypt = require("bcryptjs");

// require the user model !!!!
const User = require("../models/User");

const multer = require('multer');
const upload = multer({ dest: './images/' });

authRoutes.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const campus = req.body.campus;
  const course = req.body.course;
  const imagePath = req.body.imagePath;

  if (!username || !password) {
    res.status(400).json({ message: "Provide username and password" });
    return;
  }

  if (password.length < 3) {
    res.status(400).json({
      message:
        "Please make your password at least 4 characters long for security purposes.",
    });
    return;
  }

  User.findOne({ username }, (err, foundUser) => {
    if (err) {
      res.status(500).json({ message: "Username check went bad." });
      return;
    }

    if (foundUser) {
      res.status(400).json({ message: "Username taken. Choose another one." });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashPass = bcrypt.hashSync(password, salt);

    const aNewUser = new User({
      username: username,
      password: hashPass,
      campus: campus,
      course: course,
      imagePath: imagePath
    });

    aNewUser.save((err) => {
      if (err) {
        res
          .status(500)
          .json({ message: "Saving user to database went wrong." });
        return;
      }

      // Automatically log in user after sign up
      // .login() here is actually predefined passport method
      req.login(aNewUser, (err) => {
        if (err) {
          res.status(500).json({ message: "Login after signup went bad." });
          return;
        }

        // Send the user's information to the frontend
        // We can use also: res.status(200).json(req.user);
        res.status(200).json(aNewUser);
      });
    });
  });
});

authRoutes.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, theUser, failureDetails) => {
    if (err) {
      res
        .status(500)
        .json({ message: "Something went wrong authenticating user" });
      return;
    }

    if (!theUser) {
      // "failureDetails" contains the error messages
      // from our logic in "LocalStrategy" { message: '...' }.
      res.status(401).json(failureDetails);
      return;
    }

    // save user in session
    req.login(theUser, (err) => {
      if (err) {
        res.status(500).json({ message: "Session save went bad." });
        return;
      }

      // We are now logged in (that's why we can also send req.user)
      res.status(200).json(theUser);
    });
  })(req, res, next);
});

authRoutes.get("/logout", (req, res, next) => {
  // req.logout() is defined by passport
  req.logout();
  res.status(200).json({ message: "Log out success!" });
});

authRoutes.get("/loggedin", (req, res, next) => {
  // req.isAuthenticated() is defined by passport
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
    return;
  }
  res.status(403).json({ message: "Unauthorized" });
});

authRoutes.put('/edit', (req, res, next) => {

    const {username, campus, course } = req.body;
    // const loggedUser = req.user;
    // loggedUser.username = username;
    // loggedUser.campus = campus;
    // loggedUser.course = course;
        // loggerdUser.save()

    const id = req.user._id;

    User.findByIdAndUpdate( id, {
        username: username,
        campus: campus,
        course: course
    }, {new:true}
    ).then( () => {
        res.status(200).json({
            message: 'User updated!'
        })
    })
    .catch(error => console.log(error));
    
});

authRoutes.post('/upload', upload.single('imagePath'), (req, res) => {

    const loggedUser = req.user;
    loggedUser.imagePath = req.file;
    
    loggedUser
        .save()
        .then( () => {

            res.status(200).json(req.file);
        })
        .catch(error => console.log(error));
})


module.exports = authRoutes;
