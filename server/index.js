const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./models/User");
const Message = require("./models/Message");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const ws = require("ws");
const fs = require("fs");
const cors = require("cors");

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

const app = express();
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

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

const getOurUserId = async (req) => {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (error, data) => {
        if (error) throw error;
        resolve(data.userId);
      });
    } else reject("no token");
  });
};

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const ourUserId = await getOurUserId(req);
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    receiver: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get("/people", async (req, res) => {
  const users = await User.find({});
  res.json(users);
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
    res.status(500).json(err);
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`Serving to port ${port}!`);
});

const wss = new ws.WebSocketServer({ server });

wss.on("connection", (connection, req) => {
  // notify about online people (when someone connects)
  const notifyAboutOnlinePeople = () => {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((client) => ({
            userId: client.userId,
            username: client.username,
          })),
        })
      );
    });
  };

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.endTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
    }, 1000);
  }, 5000);

  connection.on("pong", () => {
    clearTimeout(connection.endTimer);
  });

  // read username and id from cookies for this connection
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenString) {
      const token = tokenString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (error, data) => {
          if (error) throw error;
          const { username, userId } = data;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  // sending messages
  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { receiverId, text, file } = messageData;
    let filename = null;
    if (file) {
      const parts = file.name.split(".");
      const ext = parts[parts.length - 1];
      filename = Date.now() + "." + ext;
      const path = __dirname + "/uploads/" + filename;
      const bufferData = Buffer.from(file.data.split(",")[1], "base64");
      fs.writeFile(path, bufferData, () => {});
    }
    if (receiverId && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        receiver: receiverId,
        text: text,
        file: file ? filename : null,
      });
      [...wss.clients]
        .filter((client) => client.userId === receiverId)
        .forEach((client) =>
          client.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              receiver: receiverId,
              _id: messageDoc._id,
              file: file ? filename : null,
            })
          )
        );
    }
  });

  notifyAboutOnlinePeople();
});
