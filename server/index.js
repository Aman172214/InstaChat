const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cors = require("cors");
const User = require("./models/User");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

const app = express();
app.use(express.json());
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }));
app.use(cookieParser());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected successfully !");
  })
  .catch((err) => {
    console.log("unsuccessful connection", err);
  });

app.get("/authenticate", async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (error, data) => {
      if (error) throw error;
      res.json(data);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const pass = bcrypt.compareSync(password, foundUser.password);
    try {
      if (pass) {
        jwt.sign(
          { userId: foundUser._id, username },
          jwtSecret,
          {},
          (err, token) => {
            if (err) {
              throw err;
            } else {
              res
                .cookie("token", token)
                .status(200)
                .json({ id: foundUser._id });
            }
          }
        );
      }
    } catch (error) {
      throw error;
    }
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);
    const user = await User.create({ username, password: hashedPassword });
    jwt.sign({ userId: user._id, username }, jwtSecret, {}, (err, token) => {
      if (err) {
        throw err;
      } else {
        res.cookie("token", token).status(200).json({ id: user._id });
      }
    });
  } catch (err) {
    if (err) throw err;
    res.status(500).json("error");
  }
});

app.listen(5000, () => {
  console.log("Serving to port 5000!");
});
