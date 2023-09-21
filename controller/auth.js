const { toTitleCase, validateEmail } = require("../config/function");
const bcrypt = require("bcryptjs");
const userModel = require("../models/users");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");
const nodemailer = require('nodemailer');
const   uuid  = require('uuid');

class Auth {
  async isAdmin(req, res) {
    let { loggedInUserId } = req.body;
    try {
      let loggedInUserRole = await userModel.findById(loggedInUserId);
      res.json({ role: loggedInUserRole.userRole });
    } catch {
      res.status(404);
    }
  }

  async allUser(req, res) {
    try {
      let allUser = await userModel.find({});
      res.json({ users: allUser });
    } catch {
      res.status(404);
    }
  }
  // Email Service

  /* User Registration/Signup controller  */
  async postSignup(req, res) {


    let { name, email, password, cPassword } = req.body;
    let error = {};
    if (!name || !email || !password || !cPassword) {
      error = {
        ...error,
        name: "Filed must not be empty",
        email: "Filed must not be empty",
        password: "Filed must not be empty",
        cPassword: "Filed must not be empty",
      };
      return res.json({ error });
    }
    if (name.length < 3 || name.length > 25) {
      error = { ...error, name: "Name must be 3-25 charecter" };
      return res.json({ error });
    } else {
      if (validateEmail(email)) {
        name = toTitleCase(name);
        if ((password.length > 255) | (password.length < 6)) {
          error = {
            ...error,
            password: "Password must be 6 charecter",
            name: "",
            email: "",
          };
          return res.json({ error });
        } else {
          // If Email & Number exists in Database then:
          try {
            password = bcrypt.hashSync(password, 10);
            const data = await userModel.findOne({ email: email });
            if (data) {
              error = {
                ...error,
                password: "",
                name: "",
                email: "Email already exists",
              };
              return res.json({ error });
            } else {
              let newUser = new userModel({
                name,
                email,
                password,
                // ========= Here role 1 for admin signup role 0 for customer signup =========
                userRole: 0, // Field Name change to userRole from role
              });

              newUser
                .save()
                .then((data) => {
                  // 
                  const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: 'mzaydk@gmail.com',
                      pass: 'adyrdnaerffkfndj'
                    }
                  });
            
                  const mailOptions = {
                    from: 'mzaydk@gmail.com',
                    to: email,
                    subject: 'Account Created',
                    text: `Hello  ${name},\n\nThank You for Joining RedCart. `
                  };
            
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                  });
                  // 
                  return res.json({
                    success: "Account create successfully. Please login",
                  });
                  
                })
                .catch((err) => {
                  console.log(err);
                });
                
            }
          } catch (err) {
            console.log(err);
          }
        }
      } else {
        error = {
          ...error,
          password: "",
          name: "",
          email: "Email is not valid",
        };
        return res.json({ error });
      }
    }
  }

  /* User Login/Signin controller  */
  async postSignin(req, res) {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        error: "Fields must not be empty",
      });
    }
    try {
      const data = await userModel.findOne({ email: email });
      if (!data) {
        return res.json({
          error: "Invalid email or password",
        });
      } else {
        const login = await bcrypt.compare(password, data.password);
        if (login) {
          const token = jwt.sign(
            { _id: data._id, role: data.userRole },
            JWT_SECRET
          );
          const encode = jwt.verify(token, JWT_SECRET);
          return res.json({
            token: token,
            user: encode,
          });
        } else {
          return res.json({
            error: "Invalid email or password",
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  // 
  /* Forgot Password controller */
  async postForgotPassword(req, res) {
    let { email } = req.body;
    let error = {};

    if (!email) {
      error = {
        ...error,
        email: "Field must not be empty",
      };
      return res.json({ error });
    }

    if (!validateEmail(email)) {
      error = {
        ...error,
        email: "Email is not valid",
      };
      return res.json({ error });
    }

    try {
      const user = await userModel.findOne({ email: email });

      if (!user) {
        error = {
          ...error,
          email: "Email not found",
        };
        return res.json({ error });
      }

      const resetToken = uuid.v4();
      const resetExpire = Date.now() + 60 * 60 * 1000; // token valid for 1 hour
      user.resetToken = resetToken;
      user.resetTokenExpire = resetExpire;

      await user.save();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'mzaydk@gmail.com',
          pass: 'adyrdnaerffkfndj'
        }
      });

      const mailOptions = {
        from: 'mzaydk@gmail.com',
        to: email,
        subject: 'Password Reset Request',
        text: `Hi ${user.name},\n\nYou requested to reset your password. Please click on the link below to reset your password.\n\nhttp://localhost:3000/reset-password/${resetToken}\n\nNote: This link will be valid for next 1 hour only.\n\nIf you did not request for password reset, then please ignore this email.\n\nThanks,\nYour App`
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      return res.json({
        success: "Password reset link has been sent to your email address.",
      });
    } catch (err) {
      console.log(err);
    }
  }
  //

  //
  async postResetPassword(req, res) {
    const { email, newPassword, confirmNewPassword, token } = req.body;
    let error = {};
  
    // Check if email is valid
    // if (!validateEmail(email)) {
    //   error = { ...error, email: "Invalid email address" };
    //   return res.status(400).json({ error });
    // }
  
    console.log(newPassword, "New Password")
    console.log(confirmNewPassword, "confirm New Password")
    // Check if passwords match
    if (newPassword != confirmNewPassword) {
      error = { ...error, newPassword: "Passwords do not match", confirmNewPassword: "Passwords do not match" };
      return res.status(400).json({ error });
    }
  
    // Check if password is valid
    if (newPassword.length < 6 || newPassword.length > 255) {
      error = { ...error, newPassword: "Password must be between 6 and 255 characters" };
      return res.status(400).json({ error });
    }
  
    try {
      // Find user by email
      const user = await userModel.findOne({ email });
      if (!user) {
        error = { ...error, email: "User not found" };
        return res.status(400).json({ error });
      }
  
      // Check if token matches
      if (user.resetToken !== token) {
        error = { ...error, token: "Invalid token" };
        return res.status(400).json({ error });
      }
  
      // Check if token is expired
      if (user.resetTokenExpires < Date.now()) {
        error = { ...error, token: "Token expired" };
        return res.status(400).json({ error });
      }
  
      // Update password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpires = null;
  
      // Save user
      await user.save();
  
      // Send success response
      return res.json({ success: "Password updated successfully" });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
  //
}

const authController = new Auth();
module.exports = authController;
