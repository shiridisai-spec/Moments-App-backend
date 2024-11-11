require("dotenv").config();
require("express-async-errors");
const express = require("express");
const sgMail = require("@sendgrid/mail");
const app = express();

const cors = require("cors");

const connectDB = require("./db/connect");
const authenticateUser = require("./middleware/auth");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// routers
const authRouter = require("./routes/authRoutes");
const momentsRouter = require("./routes/momentRoutes");
const profileRouter = require("./routes/profileRoutes");

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.use(express.json());

app.use(cors({ origin: "http://localhost:3001", credentials: true }));

// routes
app.use("/api/v1/moments/auth", authRouter);
app.use("/api/v1/moments/usermoments", authenticateUser, momentsRouter);
app.use("/api/v1/moments/userprofile", authenticateUser, profileRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
