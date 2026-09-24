const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./models/User");

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/* =========================================================
   DATABASE
========================================================= */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });

/* =========================================================
   DOCTORS
========================================================= */

const doctors = [
  {
    id: 1,
    name: "Dr. Ananya Sharma",
    specialty: "General Physician",
    experience: "8+ Years",
    rating: 4.9,
    capacity: 5,
  },
  {
    id: 2,
    name: "Dr. Rahul Mehta",
    specialty: "Dermatologist",
    experience: "10+ Years",
    rating: 4.8,
    capacity: 5,
  },
  {
    id: 3,
    name: "Dr. Arjun Kapoor",
    specialty: "Cardiologist",
    experience: "12+ Years",
    rating: 4.9,
    capacity: 5,
  },
];

/* =========================================================
   DEFAULT TIME SLOTS
========================================================= */

const TIME_SLOTS = [
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

/* =========================================================
   APPOINTMENT SCHEMA
========================================================= */

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

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    doctor: {
      type: String,
      required: true,
      trim: true,
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
      trim: true,
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
      default: "Confirmed",
    },
  },
  {
    timestamps: true,
  }
);

/*
   This index helps prevent the same patient from
   accidentally booking the same doctor/date/time twice.
*/
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

/* =========================================================
   AUTHENTICATION MIDDLEWARE
========================================================= */

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/* =========================================================
   HOME / HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MediSlot Backend Connected!",
    status: "Online",
    version: "2.0.0",
  });
});

/* =========================================================
   REGISTER
========================================================= */

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

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
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
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
    console.error(
      "Registration Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
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
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
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
    console.error(
      "Login Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

/* =========================================================
   GET ALL DOCTORS
========================================================= */

app.get("/api/doctors", (req, res) => {
  res.status(200).json({
    success: true,
    doctors,
  });
});

/* =========================================================
   GET SINGLE DOCTOR
========================================================= */

app.get(
  "/api/doctors/:doctorId",
  (req, res) => {
    const doctorId = Number(
      req.params.doctorId
    );

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
  }
);

/* =========================================================
   GET AVAILABLE SLOTS
========================================================= */

app.get(
  "/api/availability",
  async (req, res) => {
    try {
      const { doctorId, date } = req.query;

      if (!doctorId || !date) {
        return res.status(400).json({
          success: false,
          message:
            "doctorId and date are required",
        });
      }

      const numericDoctorId =
        Number(doctorId);

      const doctor = doctors.find(
        (item) =>
          item.id === numericDoctorId
      );

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      const appointments =
        await Appointment.find({
          doctorId: numericDoctorId,
          date,
          status: {
            $in: [
              "Pending",
              "Confirmed",
            ],
          },
        });

      const slots = TIME_SLOTS.map(
        (time) => {
          const bookedCount =
            appointments.filter(
              (appointment) =>
                appointment.time === time
            ).length;

          const availableSeats =
            Math.max(
              doctor.capacity -
                bookedCount,
              0
            );

          let status = "available";

          if (availableSeats === 0) {
            status = "full";
          } else if (
            availableSeats <= 2
          ) {
            status = "limited";
          }

          return {
            time,
            capacity: doctor.capacity,
            bookedSeats: bookedCount,
            availableSeats,
            status,
            isFull:
              availableSeats === 0,
          };
        }
      );

      res.status(200).json({
        success: true,
        doctor: {
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
        },
        date,
        slots,
      });
    } catch (error) {
      console.error(
        "Availability Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch availability",
      });
    }
  }
);

/* =========================================================
   BOOK APPOINTMENT
========================================================= */

app.post(
  "/book",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        doctor,
        doctorId,
        date,
        time,
        reason,
      } = req.body;

      /* -----------------------------------------
         BASIC VALIDATION
      ----------------------------------------- */

      if (
        !name ||
        !email ||
        !phone ||
        !doctor ||
        !doctorId ||
        !date ||
        !time
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please fill all required appointment fields",
        });
      }

      const numericDoctorId =
        Number(doctorId);

      const selectedDoctor =
        doctors.find(
          (item) =>
            item.id === numericDoctorId
        );

      if (!selectedDoctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      /* -----------------------------------------
         VALID TIME SLOT
      ----------------------------------------- */

      if (!TIME_SLOTS.includes(time)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid appointment time slot",
        });
      }

      /* -----------------------------------------
         PREVENT PAST DATE
      ----------------------------------------- */

      const today =
        new Date()
          .toISOString()
          .split("T")[0];

      if (date < today) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot book an appointment for a past date",
        });
      }

      /* -----------------------------------------
         CHECK EXISTING PATIENT BOOKING
      ----------------------------------------- */

      const existingPatientBooking =
        await Appointment.findOne({
          email: email.toLowerCase().trim(),
          doctorId: numericDoctorId,
          date,
          time,
          status: {
            $in: [
              "Pending",
              "Confirmed",
            ],
          },
        });

      if (existingPatientBooking) {
        return res.status(409).json({
          success: false,
          message:
            "You already have an appointment for this slot",
        });
      }

      /* -----------------------------------------
         CHECK CURRENT CAPACITY
      ----------------------------------------- */

      const bookedAppointments =
        await Appointment.countDocuments({
          doctorId: numericDoctorId,
          date,
          time,
          status: {
            $in: [
              "Pending",
              "Confirmed",
            ],
          },
        });

      const availableSeats =
        selectedDoctor.capacity -
        bookedAppointments;

      if (availableSeats <= 0) {
        return res.status(409).json({
          success: false,
          message:
            "This appointment slot is fully booked",
          availableSeats: 0,
        });
      }

      /* -----------------------------------------
         CREATE APPOINTMENT
      ----------------------------------------- */

      const appointment =
        await Appointment.create({
          name: name.trim(),
          email:
            email.toLowerCase().trim(),
          phone: phone.trim(),
          doctor:
            selectedDoctor.name,
          doctorId:
            selectedDoctor.id,
          specialty:
            selectedDoctor.specialty,
          date,
          time,
          reason:
            reason || "",
          status: "Confirmed",
        });

      const remainingSeats =
        availableSeats - 1;

      res.status(201).json({
        success: true,
        message:
          "Appointment booked successfully!",
        appointment,
        availability: {
          capacity:
            selectedDoctor.capacity,
          bookedSeats:
            bookedAppointments + 1,
          availableSeats:
            remainingSeats,
          status:
            remainingSeats === 0
              ? "full"
              : remainingSeats <= 2
              ? "limited"
              : "available",
        },
      });
    } catch (error) {
      console.error(
        "Booking Error:",
        error
      );

      /*
         MongoDB duplicate-key protection
      */

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "This appointment has already been booked",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Failed to book appointment",
      });
    }
  }
);

/* =========================================================
   GET MY APPOINTMENTS
========================================================= */

app.get(
  "/api/my-appointments",
  authenticateToken,
  async (req, res) => {
    try {
      const appointments =
        await Appointment.find({
          email: req.user.email,
        }).sort({
          date: 1,
          time: 1,
        });

      res.status(200).json({
        success: true,
        appointments,
      });
    } catch (error) {
      console.error(
        "My Appointments Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch your appointments",
      });
    }
  }
);

/* =========================================================
   GET ALL APPOINTMENTS
========================================================= */

app.get(
  "/appointments",
  async (req, res) => {
    try {
      const appointments =
        await Appointment.find().sort({
          createdAt: -1,
        });

      res.status(200).json({
        success: true,
        appointments,
      });
    } catch (error) {
      console.error(
        "Fetch Appointments Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch appointments",
      });
    }
  }
);

/* =========================================================
   CANCEL APPOINTMENT
========================================================= */

app.put(
  "/api/appointments/:id/cancel",
  authenticateToken,
  async (req, res) => {
    try {
      const appointment =
        await Appointment.findById(
          req.params.id
        );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            "Appointment not found",
        });
      }

      if (
        appointment.email !==
        req.user.email
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to cancel this appointment",
        });
      }

      if (
        appointment.status ===
        "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Appointment is already cancelled",
        });
      }

      appointment.status =
        "Cancelled";

      await appointment.save();

      res.status(200).json({
        success: true,
        message:
          "Appointment cancelled successfully",
        appointment,
      });
    } catch (error) {
      console.error(
        "Cancel Appointment Error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to cancel appointment",
      });
    }
  }
);

/* =========================================================
   404 HANDLER
========================================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API endpoint not found",
    });
  }
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Server Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
);

/* =========================================================
   START SERVER
========================================================= */

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `MediSlot server running on port ${PORT}`
  );
});