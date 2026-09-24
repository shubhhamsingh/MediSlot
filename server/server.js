```javascript
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET =
  process.env.JWT_SECRET || "MediSlot_SuperSecret_2026_ChangeMe_8472";

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "https://medi-slot-mu.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(express.json());

/* =========================
   MONGODB
========================= */

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });

/* =========================
   USER MODEL
========================= */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

/* =========================
   APPOINTMENT MODEL
========================= */

const appointmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    doctor: {
      type: String,
      required: true,
      trim: true,
    },

    specialty: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    fee: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model(
  "Appointment",
  appointmentSchema
);

/* =========================
   HOME / HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MediSlot Backend Connected!",
    status: "Online",
    version: "2.0.0",
  });
});

/* =========================
   REGISTER
========================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

/* =========================
   BOOK APPOINTMENT
========================= */

app.post("/book", async (req, res) => {
  try {
    const {
      name,
      email,
      doctor,
      specialty,
      date,
      time,
      fee,
    } = req.body;

    if (
      !name ||
      !email ||
      !doctor ||
      !specialty ||
      !date ||
      !time
    ) {
      return res.status(400).json({
        success: false,
        message: "All appointment fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingAppointment = await Appointment.findOne({
      doctor,
      date,
      time,
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This appointment slot is already booked",
      });
    }

    const appointment = new Appointment({
      name: name.trim(),
      email: normalizedEmail,
      doctor: doctor.trim(),
      specialty: specialty.trim(),
      date,
      time,
      fee: Number(fee) || 0,
    });

    await appointment.save();

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("BOOKING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to book appointment",
      error: error.message,
    });
  }
});

/* =========================
   GET ALL APPOINTMENTS
========================= */

app.get("/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("GET APPOINTMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch appointments",
    });
  }
});

/* =========================
   GET APPOINTMENTS BY EMAIL
========================= */

app.get("/appointments/:email", async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();

    const appointments = await Appointment.find({
      email,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("GET USER APPOINTMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user appointments",
    });
  }
});

/* =========================
   DELETE APPOINTMENT
========================= */

app.delete("/appointments/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(
      req.params.id
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("DELETE APPOINTMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel appointment",
    });
  }
});

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    route: req.originalUrl,
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((error, req, res, next) => {
  console.error("SERVER ERROR:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message,
  });
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MediSlot server running on port ${PORT}`);
});
```
