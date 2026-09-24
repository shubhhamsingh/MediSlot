const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./models/User");

const app = express();

// ==========================================
// CONFIGURATION
// ==========================================

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "MediSlot_SuperSecret_2026_ChangeMe_8472";

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ==========================================
// MONGODB
// ==========================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });

// ==========================================
// DOCTORS
// ==========================================

const doctors = [
  {
    id: 1,
    name: "Dr. Ananya Sharma",
    specialty: "General Physician",
    experience: "8+ Years",
    rating: 4.9,
    fee: 500,
  },
  {
    id: 2,
    name: "Dr. Rahul Mehta",
    specialty: "Dermatologist",
    experience: "10+ Years",
    rating: 4.8,
    fee: 700,
  },
  {
    id: 3,
    name: "Dr. Arjun Kapoor",
    specialty: "Cardiologist",
    experience: "12+ Years",
    rating: 4.9,
    fee: 900,
  },
];

// ==========================================
// TIME SLOTS
// ==========================================

const timeSlots = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
];

// ==========================================
// APPOINTMENT MODEL
// ==========================================

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
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    doctor: {
      type: String,
      required: true,
    },

    doctorId: {
      type: Number,
      required: true,
    },

    specialty: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index(
  {
    email: 1,
    doctorId: 1,
    date: 1,
    time: 1,
  },
  {
    unique: true,
  }
);

const Appointment = mongoose.model(
  "Appointment",
  appointmentSchema
);

// ==========================================
// AUTHENTICATION
// ==========================================

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log("AUTH ERROR: No Authorization header");

      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const parts = authHeader.trim().split(/\s+/);

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.log("AUTH ERROR: Invalid Authorization format");

      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const token = parts[1];

    if (!token) {
      console.log("AUTH ERROR: Empty token");

      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      console.log(
        "AUTH ERROR:",
        jwtError.name,
        jwtError.message
      );

      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(decoded.userId).select(
      "-password"
    );

    if (!user) {
      console.log("AUTH ERROR: User not found");

      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MediSlot Backend Connected!",
    status: "Online",
    version: "2.0.0",
  });
});

// ==========================================
// REGISTER
// ==========================================

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

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "patient",
    });

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
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
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
});

// ==========================================
// LOGIN
// ==========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

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
        userId: user._id.toString(),
        role: user.role,
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
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// ==========================================
// DOCTORS
// ==========================================

app.get("/api/doctors", (req, res) => {
  res.status(200).json({
    success: true,
    doctors,
  });
});

app.get("/api/doctors/:doctorId", (req, res) => {
  const doctorId = Number(req.params.doctorId);

  const doctor = doctors.find(
    (item) => item.id === doctorId
  );

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor not found",
    });
  }

  res.status(200).json({
    success: true,
    doctor,
  });
});

// ==========================================
// AVAILABILITY
// ==========================================

app.get("/api/availability", async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "doctorId and date are required",
      });
    }

    const appointments = await Appointment.find({
      doctorId: Number(doctorId),
      date,
      status: {
        $ne: "Cancelled",
      },
    }).select("time");

    const bookedSlots = appointments.map(
      (appointment) => appointment.time
    );

    const availableSlots = timeSlots.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    res.status(200).json({
      success: true,
      date,
      doctorId: Number(doctorId),
      bookedSlots,
      availableSlots,
    });
  } catch (error) {
    console.error("Availability Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch availability",
    });
  }
});

// ==========================================
// BOOK APPOINTMENT
// ==========================================

app.post("/book", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      doctor,
      doctorId,
      specialty,
      date,
      time,
      reason,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !doctor ||
      !doctorId ||
      !specialty ||
      !date ||
      !time
    ) {
      return res.status(400).json({
        success: false,
        message: "All appointment details are required",
      });
    }

    const doctorExists = doctors.find(
      (item) => item.id === Number(doctorId)
    );

    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const existingAppointment =
      await Appointment.findOne({
        doctorId: Number(doctorId),
        date,
        time,
        status: {
          $ne: "Cancelled",
        },
      });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    const appointment = await Appointment.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      doctor,
      doctorId: Number(doctorId),
      specialty,
      date,
      time,
      reason: reason || "",
      status: "Pending",
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("Booking Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This appointment slot is already booked",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to book appointment",
      error: error.message,
    });
  }
});

// ==========================================
// MY APPOINTMENTS
// ==========================================

app.get(
  "/api/my-appointments",
  authenticateToken,
  async (req, res) => {
    try {
      const appointments = await Appointment.find({
        userId: req.user._id,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        appointments,
      });
    } catch (error) {
      console.error("My Appointments Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to fetch appointments",
      });
    }
  }
);

// ==========================================
// ALL APPOINTMENTS
// ==========================================

app.get(
  "/appointments",
  authenticateToken,
  async (req, res) => {
    try {
      const appointments = await Appointment.find().sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        appointments,
      });
    } catch (error) {
      console.error("Appointments Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to fetch appointments",
      });
    }
  }
);

// ==========================================
// CANCEL APPOINTMENT
// ==========================================

app.put(
  "/api/appointments/:id/cancel",
  authenticateToken,
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(
        req.params.id
      );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      if (
        appointment.userId &&
        appointment.userId.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot cancel this appointment",
        });
      }

      appointment.status = "Cancelled";

      await appointment.save();

      res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully",
        appointment,
      });
    } catch (error) {
      console.error(
        "Cancel Appointment Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Unable to cancel appointment",
      });
    }
  }
);

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==========================================
// GLOBAL ERROR
// ==========================================

app.use((error, req, res, next) => {
  console.error("Global Error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `MediSlot server running on port ${PORT}`
  );
});