import { useState } from "react";
import "./App.css";

const doctors = [
  {
    id: 1,
    name: "Dr. Ananya Sharma",
    specialty: "General Physician",
    experience: "8+ Years",
    rating: "4.9",
    patients: "2,500+",
    timings: ["10:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"],
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80",
    description:
      "Experienced general physician providing comprehensive healthcare, preventive care and routine consultations.",
  },
  {
    id: 2,
    name: "Dr. Rahul Mehta",
    specialty: "Dermatologist",
    experience: "10+ Years",
    rating: "4.8",
    patients: "3,200+",
    timings: ["9:30 AM", "12:00 PM", "3:00 PM", "5:30 PM"],
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=500&q=80",
    description:
      "Specialist in skin, hair and nail conditions with a patient-focused approach to dermatological care.",
  },
  {
    id: 3,
    name: "Dr. Arjun Kapoor",
    specialty: "Cardiologist",
    experience: "12+ Years",
    rating: "4.9",
    patients: "4,100+",
    timings: ["10:30 AM", "1:00 PM", "3:30 PM", "6:00 PM"],
    image:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80",
    description:
      "Cardiovascular specialist focused on heart health, diagnosis, prevention and long-term patient care.",
  },
];

const specialties = [
  {
    icon: "🩺",
    title: "General Physician",
    text: "Everyday healthcare and preventive consultations.",
  },
  {
    icon: "✨",
    title: "Dermatology",
    text: "Expert care for skin, hair and nail conditions.",
  },
  {
    icon: "❤️",
    title: "Cardiology",
    text: "Specialized consultation for heart health.",
  },
];

function App() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [appointments, setAppointments] = useState([]);

  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    consultation: "Clinic Visit",
    symptoms: "",
  });

  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setMobileMenu(false);
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      doctor.name.toLowerCase().includes(searchText) ||
      doctor.specialty.toLowerCase().includes(searchText);

    const matchesSpecialty =
      specialtyFilter === "All Specialties" ||
      doctor.specialty === specialtyFilter;

    return matchesSearch && matchesSpecialty;
  });

  const openBooking = (doctor) => {
    setSelectedDoctor(doctor);
    setErrorMessage("");
    setSuccessMessage("");

    setBookingForm({
      name: "",
      email: "",
      phone: "",
      date: "",
      time: doctor.timings[0],
      consultation: "Clinic Visit",
      symptoms: "",
    });

    setBookingOpen(true);
  };

  const closeBooking = () => {
    setBookingOpen(false);
    setSelectedDoctor(null);
    setErrorMessage("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setBookingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) return;

    if (
      !bookingForm.name ||
      !bookingForm.email ||
      !bookingForm.phone ||
      !bookingForm.date ||
      !bookingForm.time
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    const appointment = {
      id: Date.now(),
      doctor: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      patient: bookingForm.name,
      email: bookingForm.email,
      phone: bookingForm.phone,
      date: bookingForm.date,
      time: bookingForm.time,
      consultation: bookingForm.consultation,
      symptoms: bookingForm.symptoms,
    };

    try {
      const response = await fetch("https://medislot-imbs.onrender.com/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointment),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      setAppointments((prev) => [appointment, ...prev]);

      setErrorMessage("");
      setSuccessMessage(
        data.message || "Appointment booked successfully!"
      );

      setTimeout(() => {
        closeBooking();
        scrollToSection("appointments");
      }, 1200);
    } catch (error) {
      console.error("Booking error:", error);

      setErrorMessage(
        "Unable to connect to the server. Please make sure the backend is running on port 5000."
      );
    }
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-container">
          <button
            className="brand"
            onClick={() => scrollToSection("home")}
          >
            <span className="brand-icon">+</span>
            <span>
              Medi<span>Slot</span>
            </span>
          </button>

          <nav className={`nav-links ${mobileMenu ? "active" : ""}`}>
            <button onClick={() => scrollToSection("home")}>Home</button>
            <button onClick={() => scrollToSection("doctors")}>
              Doctors
            </button>
            <button onClick={() => scrollToSection("specialties")}>
              Specialties
            </button>
            <button onClick={() => scrollToSection("how-it-works")}>
              How It Works
            </button>
            <button
              className="nav-book"
              onClick={() => scrollToSection("doctors")}
            >
              Book Appointment
            </button>
            <button
              onClick={() => scrollToSection("appointments")}
            >
              Appointments
            </button>
          </nav>

          <button
            className="menu-btn"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            ☰
          </button>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section id="home" className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <span>●</span> Trusted Healthcare Platform
              </div>

              <h1>
                Your Health.
                <br />
                <span>Our Priority.</span>
              </h1>

              <p>
                Book appointments with trusted doctors quickly and
                conveniently. Quality healthcare is now just a few clicks
                away.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-btn"
                  onClick={() => scrollToSection("doctors")}
                >
                  Find a Doctor →
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => scrollToSection("how-it-works")}
                >
                  How It Works
                </button>
              </div>

              <div className="hero-trust">
                <div>
                  <strong>10K+</strong>
                  <span>Patients</span>
                </div>

                <div>
                  <strong>50+</strong>
                  <span>Doctors</span>
                </div>

                <div>
                  <strong>24/7</strong>
                  <span>Support</span>
                </div>
              </div>
            </div>

            <div className="hero-card-area">
              <div className="hero-main-card">
                <div className="hero-card-icon">🩺</div>

                <h3>Healthcare made simple</h3>

                <p>
                  Find the right specialist and schedule your consultation
                  without waiting in long queues.
                </p>

                <div className="hero-mini-row">
                  <div className="mini-avatar">👩‍⚕️</div>
                  <div>
                    <strong>Verified Doctors</strong>
                    <span>Experienced professionals</span>
                  </div>
                </div>

                <div className="hero-mini-row">
                  <div className="mini-avatar">📅</div>
                  <div>
                    <strong>Easy Booking</strong>
                    <span>Choose your preferred time</span>
                  </div>
                </div>

                <div className="hero-mini-row">
                  <div className="mini-avatar">🔒</div>
                  <div>
                    <strong>Secure & Private</strong>
                    <span>Your information stays protected</span>
                  </div>
                </div>
              </div>

              <div className="floating-card floating-one">
                <span>⭐</span>
                <div>
                  <strong>4.9/5</strong>
                  <small>Patient Rating</small>
                </div>
              </div>

              <div className="floating-card floating-two">
                <span>✓</span>
                <div>
                  <strong>Verified</strong>
                  <small>Doctors</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH */}
        <section className="search-section">
          <div className="search-container">
            <div className="search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search doctor or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
            >
              <option>All Specialties</option>
              <option>General Physician</option>
              <option>Dermatologist</option>
              <option>Cardiologist</option>
            </select>

            <button
              className="search-btn"
              onClick={() => scrollToSection("doctors")}
            >
              Search
            </button>
          </div>
        </section>

        {/* DOCTORS */}
        <section id="doctors" className="section">
          <div className="section-heading">
            <span className="section-label">OUR SPECIALISTS</span>
            <h2>Meet Our Doctors</h2>
            <p>
              Consult experienced healthcare professionals from different
              medical specialties.
            </p>
          </div>

          <div className="doctor-grid">
            {filteredDoctors.map((doctor) => (
              <article className="doctor-card" key={doctor.id}>
                <div className="doctor-image-wrapper">
                  <img src={doctor.image} alt={doctor.name} />

                  <div className="verified-badge">✓ Verified</div>
                </div>

                <div className="doctor-content">
                  <div className="rating">
                    ⭐ {doctor.rating}
                  </div>

                  <h3>{doctor.name}</h3>

                  <p className="doctor-specialty">
                    {doctor.specialty}
                  </p>

                  <p className="doctor-description">
                    {doctor.description}
                  </p>

                  <div className="doctor-info">
                    <span>🎓 {doctor.experience}</span>
                    <span>👥 {doctor.patients}</span>
                  </div>

                  <button
                    className="doctor-btn"
                    onClick={() => openBooking(doctor)}
                  >
                    Book Appointment
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="empty-state">
              <span>🔎</span>
              <h3>No doctors found</h3>
              <p>Try another doctor name or specialty.</p>
            </div>
          )}
        </section>

        {/* SPECIALTIES */}
        <section id="specialties" className="section light-section">
          <div className="section-heading">
            <span className="section-label">SPECIALTIES</span>
            <h2>Healthcare For Every Need</h2>
            <p>
              Choose a medical specialty and connect with the right
              professional.
            </p>
          </div>

          <div className="specialty-grid">
            {specialties.map((specialty) => (
              <div className="specialty-card" key={specialty.title}>
                <div className="specialty-icon">{specialty.icon}</div>
                <h3>{specialty.title}</h3>
                <p>{specialty.text}</p>
                <button
                  onClick={() => {
                    setSpecialtyFilter(
                      specialty.title === "Dermatology"
                        ? "Dermatologist"
                        : specialty.title === "Cardiology"
                        ? "Cardiologist"
                        : "General Physician"
                    );
                    scrollToSection("doctors");
                  }}
                >
                  Explore Doctors →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="section">
          <div className="section-heading">
            <span className="section-label">HOW IT WORKS</span>
            <h2>Book In 4 Simple Steps</h2>
            <p>
              MediSlot makes scheduling healthcare appointments simple
              and convenient.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">🔍</div>
              <h3>Find a Doctor</h3>
              <p>Search for doctors by name or medical specialty.</p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">👨‍⚕️</div>
              <h3>Choose Doctor</h3>
              <p>Review doctor profiles and select your specialist.</p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">📅</div>
              <h3>Select Time</h3>
              <p>Choose a convenient date and available time slot.</p>
            </div>

            <div className="step-card">
              <div className="step-number">04</div>
              <div className="step-icon">✓</div>
              <h3>Confirm</h3>
              <p>Enter your details and confirm your appointment.</p>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features-section">
          <div className="features-container">
            <div className="feature-text">
              <span className="section-label">WHY MEDISLOT</span>
              <h2>
                Healthcare That Fits
                <span>Your Schedule</span>
              </h2>

              <p>
                MediSlot combines simple technology with convenient
                healthcare access to make appointment scheduling easier
                for patients.
              </p>

              <div className="feature-list">
                <div>
                  <span>✓</span>
                  <p>
                    <strong>Verified Professionals</strong>
                    <br />
                    Connect with qualified doctors.
                  </p>
                </div>

                <div>
                  <span>✓</span>
                  <p>
                    <strong>Flexible Appointments</strong>
                    <br />
                    Select a time that works for you.
                  </p>
                </div>

                <div>
                  <span>✓</span>
                  <p>
                    <strong>Simple Booking</strong>
                    <br />
                    Book without unnecessary complexity.
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-visual">
              <div className="feature-circle">
                <div className="feature-center">❤️</div>

                <div className="feature-orbit orbit-one">
                  🩺
                </div>

                <div className="feature-orbit orbit-two">
                  📅
                </div>

                <div className="feature-orbit orbit-three">
                  🔒
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* APPOINTMENTS */}
        <section id="appointments" className="section appointments-section">
          <div className="section-heading">
            <span className="section-label">MY APPOINTMENTS</span>
            <h2>Your Bookings</h2>
            <p>
              Your confirmed appointments will appear here.
            </p>
          </div>

          {appointments.length === 0 ? (
            <div className="no-appointments">
              <div>📅</div>
              <h3>No appointments yet</h3>
              <p>
                Book your first appointment with one of our doctors.
              </p>

              <button
                className="primary-btn"
                onClick={() => scrollToSection("doctors")}
              >
                Find a Doctor
              </button>
            </div>
          ) : (
            <div className="appointment-list">
              {appointments.map((appointment) => (
                <div className="appointment-card" key={appointment.id}>
                  <div className="appointment-icon">🩺</div>

                  <div className="appointment-details">
                    <span className="confirmed">CONFIRMED</span>

                    <h3>{appointment.doctor}</h3>

                    <p>{appointment.specialty}</p>

                    <div className="appointment-meta">
                      <span>📅 {appointment.date}</span>
                      <span>⏰ {appointment.time}</span>
                      <span>💻 {appointment.consultation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <button
              className="brand footer-logo"
              onClick={() => scrollToSection("home")}
            >
              <span className="brand-icon">+</span>
              <span>
                Medi<span>Slot</span>
              </span>
            </button>

            <p>
              Making healthcare appointment scheduling simple,
              accessible and convenient.
            </p>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <button onClick={() => scrollToSection("home")}>
              Home
            </button>
            <button onClick={() => scrollToSection("doctors")}>
              Doctors
            </button>
            <button onClick={() => scrollToSection("specialties")}>
              Specialties
            </button>
            <button onClick={() => scrollToSection("appointments")}>
              Appointments
            </button>
          </div>

          <div className="footer-column">
            <h4>Services</h4>
            <span>Doctor Consultation</span>
            <span>Appointment Booking</span>
            <span>Specialist Search</span>
            <span>Healthcare Support</span>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <span>📧 shubhamrajputx3@gmail.com</span>
            <span>📞 +91 9153073513</span>
            <span>📍 Roorkee, Uttarakhand</span>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 MediSlot. All rights reserved.</p>
          <p>Designed by Shubham Singh</p>
        </div>
      </footer>

      {/* BOOKING MODAL */}
      {bookingOpen && selectedDoctor && (
        <div className="modal-overlay" onClick={closeBooking}>
          <div
            className="booking-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeBooking}>
              ×
            </button>

            <div className="modal-header">
              <span className="modal-label">BOOK APPOINTMENT</span>
              <h2>Schedule Your Visit</h2>
              <p>
                Book an appointment with{" "}
                <strong>{selectedDoctor.name}</strong>
              </p>
            </div>

            <div className="selected-doctor">
              <img
                src={selectedDoctor.image}
                alt={selectedDoctor.name}
              />

              <div>
                <strong>{selectedDoctor.name}</strong>
                <span>{selectedDoctor.specialty}</span>
                <small>⭐ {selectedDoctor.rating} Rating</small>
              </div>
            </div>

            <form onSubmit={handleBooking}>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Full Name <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={bookingForm.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Email <span>*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={bookingForm.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Phone <span>*</span>
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 XXXXX XXXXX"
                    value={bookingForm.phone}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Appointment Date <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={bookingForm.date}
                    onChange={handleFormChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Preferred Time <span>*</span>
                  </label>

                  <select
                    name="time"
                    value={bookingForm.time}
                    onChange={handleFormChange}
                    required
                  >
                    {selectedDoctor.timings.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Consultation Type</label>

                  <select
                    name="consultation"
                    value={bookingForm.consultation}
                    onChange={handleFormChange}
                  >
                    <option value="Clinic Visit">
                      Clinic Visit
                    </option>
                    <option value="Video Consultation">
                      Video Consultation
                    </option>
                  </select>
                </div>

                <div className="form-group full">
                  <label>Symptoms / Message</label>

                  <textarea
                    name="symptoms"
                    rows="3"
                    placeholder="Briefly describe your concern..."
                    value={bookingForm.symptoms}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="form-error">
                  ⚠ {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="form-success">
                  ✓ {successMessage}
                </div>
              )}

              <button className="confirm-btn" type="submit">
                Confirm Appointment →
              </button>

              <p className="secure-note">
                🔒 Your information is securely handled.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;