const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });

// Appointment Schema
const appointmentSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    doctor: String,
    date: String,
    time: String,
    reason: String,
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

// Home route
app.get("/", (req, res) => {
  res.send("MediSlot Backend Connected!");
});

// Book appointment
app.post("/book", async (req, res) => {
  try {
    console.log("Appointment received:", req.body);

    const appointment = new Appointment(req.body);

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment booked successfully!",
      appointment,
    });
  } catch (error) {
    console.error("Booking Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to book appointment",
    });
  }
});

// Get all appointments
app.get("/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Fetch Appointments Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
    });
  }
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});