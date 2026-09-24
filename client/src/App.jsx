import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "https://medislot-imbs.onrender.com";

const doctors = [
  {
    id: 1,
    name: "Dr. Ananya Sharma",
    specialty: "General Physician",
    experience: "8+ Years",
    rating: 4.9,
    fee: 500,
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=90",
    initials: "AS",
    description:
      "Experienced physician focused on preventive care, diagnosis and complete family healthcare.",
  },
  {
    id: 2,
    name: "Dr. Rahul Mehta",
    specialty: "Dermatologist",
    experience: "10+ Years",
    rating: 4.8,
    fee: 700,
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=90",
    initials: "RM",
    description:
      "Specialist in skin, hair and cosmetic dermatology with patient-focused treatment.",
  },
  {
    id: 3,
    name: "Dr. Arjun Kapoor",
    specialty: "Cardiologist",
    experience: "12+ Years",
    rating: 4.9,
    fee: 900,
    image:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=900&q=90",
    initials: "AK",
    description:
      "Cardiology specialist providing comprehensive heart-health consultation and care.",
  },
];

const specialties = [
  {
    name: "General Physician",
    icon: "🩺",
    description: "Everyday health & preventive care",
  },
  {
    name: "Dermatology",
    icon: "✨",
    description: "Skin, hair & cosmetic care",
  },
  {
    name: "Cardiology",
    icon: "❤️",
    description: "Heart & cardiovascular care",
  },
];

const timeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

function App() {
  const [activeSection, setActiveSection] = useState("home");

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [showBooking, setShowBooking] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("medislot_user")) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    localStorage.getItem("medislot_token") || ""
  );

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    symptoms: "",
  });

  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [availability, setAvailability] = useState({});
  const [serverOnline, setServerOnline] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const [mobileMenu, setMobileMenu] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      type,
      message,
    });

    setTimeout(() => {
      setToast({
        show: false,
        type: "success",
        message: "",
      });
    }, 3000);
  };

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${API_URL}/`, {
          method: "GET",
        });

        setServerOnline(response.ok);
      } catch {
        setServerOnline(false);
      }
    };

    checkServer();

    const interval = setInterval(checkServer, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!bookingForm.date || !selectedDoctor) {
      setAvailability({});
      return;
    }

    const key = `${selectedDoctor.id}-${bookingForm.date}`;

    try {
      const bookedSlots = JSON.parse(
        localStorage.getItem(`medislot_${key}`) || "[]"
      );

      const status = {};

      timeSlots.forEach((slot) => {
        status[slot] = bookedSlots.includes(slot);
      });

      setAvailability(status);
    } catch {
      setAvailability({});
    }
  }, [bookingForm.date, selectedDoctor]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        doctor.name.toLowerCase().includes(search.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(search.toLowerCase());

      const matchesSpecialty =
        specialty === "All" ||
        doctor.specialty.toLowerCase().includes(specialty.toLowerCase());

      return matchesSearch && matchesSpecialty;
    });
  }, [search, specialty]);

  const scrollToSection = (section) => {
    setActiveSection(section);
    setMobileMenu(false);

    const element = document.getElementById(section);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const openAuth = (mode = "login") => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const closeAuth = () => {
    setShowAuth(false);
    setAuthForm({
      name: "",
      email: "",
      password: "",
    });
  };

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    if (authMode === "register" && !authForm.name.trim()) {
      showToast("Please enter your name", "error");
      return;
    }

    if (!authForm.email.trim() || !authForm.password.trim()) {
      showToast("Please fill all required fields", "error");
      return;
    }

    if (authForm.password.length < 6) {
      showToast("Password must contain at least 6 characters", "error");
      return;
    }

    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "register"
          ? "/api/auth/register"
          : "/api/auth/login";

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(authForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      localStorage.setItem("medislot_token", data.token);
      localStorage.setItem("medislot_user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      closeAuth();

      showToast(
        authMode === "register"
          ? "Account created successfully!"
          : "Welcome back!"
      );
    } catch (error) {
      showToast(error.message || "Something went wrong", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("medislot_token");
    localStorage.removeItem("medislot_user");

    setToken("");
    setUser(null);

    showToast("Logged out successfully");
  };

  const openBooking = (doctor) => {
    if (!user) {
      openAuth("login");
      showToast("Please login to book an appointment", "error");
      return;
    }

    setSelectedDoctor(doctor);
    setSelectedSlot("");

    setBookingForm({
      name: user.name || "",
      email: user.email || "",
      phone: "",
      date: "",
      symptoms: "",
    });

    setShowBooking(true);
  };

  const closeBooking = () => {
    setShowBooking(false);
    setSelectedDoctor(null);
    setSelectedSlot("");
  };

  const handleBookingChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value,
    });
  };

  const selectSlot = (slot) => {
    if (availability[slot]) {
      showToast("This time slot is already booked", "error");
      return;
    }

    setSelectedSlot(slot);
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) {
      showToast("Please select a doctor", "error");
      return;
    }

    if (
      !bookingForm.name ||
      !bookingForm.email ||
      !bookingForm.phone ||
      !bookingForm.date ||
      !selectedSlot
    ) {
      showToast("Please complete all required fields", "error");
      return;
    }

    if (bookingForm.phone.length < 10) {
      showToast("Please enter a valid phone number", "error");
      return;
    }

    setBookingLoading(true);

    const appointment = {
      name: bookingForm.name,
      email: bookingForm.email,
      phone: bookingForm.phone,
      doctor: selectedDoctor.name,
      date: bookingForm.date,
      time: selectedSlot,
      reason: bookingForm.symptoms,
    };

    try {
      const response = await fetch(`${API_URL}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointment),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to book appointment");
      }

      const key = `${selectedDoctor.id}-${bookingForm.date}`;

      const existing = JSON.parse(
        localStorage.getItem(`medislot_${key}`) || "[]"
      );

      localStorage.setItem(
        `medislot_${key}`,
        JSON.stringify([...existing, selectedSlot])
      );

      showToast("Appointment booked successfully!");

      closeBooking();

      if (user) {
        fetchAppointments();
      }
    } catch (error) {
      showToast(
        error.message || "Unable to connect to the server",
        "error"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const fetchAppointments = async () => {
    setLoadingAppointments(true);

    try {
      const response = await fetch(`${API_URL}/appointments`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch appointments");
      }

      const userAppointments = user?.email
        ? (data.appointments || []).filter(
            (appointment) =>
              appointment.email?.toLowerCase() ===
              user.email?.toLowerCase()
          )
        : [];

      setAppointments(userAppointments);
    } catch {
      showToast("Unable to load appointments", "error");
    } finally {
      setLoadingAppointments(false);
    }
  };

  const openAppointments = async () => {
    if (!user) {
      openAuth("login");
      showToast("Please login to view appointments", "error");
      return;
    }

    setShowAppointments(true);
    await fetchAppointments();
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-container">
          <button
            className="logo"
            onClick={() => scrollToSection("home")}
          >
            <span className="logo-icon">✚</span>
            <span className="logo-text">
              Medi<span>Slot</span>
            </span>
          </button>

          <nav className={`nav-links ${mobileMenu ? "open" : ""}`}>
            <button onClick={() => scrollToSection("home")}>
              Home
            </button>

            <button onClick={() => scrollToSection("doctors")}>
              Doctors
            </button>

            <button onClick={() => scrollToSection("specialties")}>
              Specialties
            </button>

            <button onClick={() => scrollToSection("about")}>
              About
            </button>

            <button onClick={openAppointments}>
              My Appointments
            </button>
          </nav>

          <div className="nav-actions">
            {user ? (
              <div className="user-menu">
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>

                <div className="user-info">
                  <strong>{user.name}</strong>
                  <span>Patient</span>
                </div>

                <button
                  className="logout-btn"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  className="login-btn"
                  onClick={() => openAuth("login")}
                >
                  Login
                </button>

                <button
                  className="nav-register-btn"
                  onClick={() => openAuth("register")}
                >
                  Get Started
                </button>
              </>
            )}

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section id="home" className="hero-section">
          <div className="hero-background">
            <div className="hero-orb orb-one"></div>
            <div className="hero-orb orb-two"></div>
          </div>

          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="pulse-dot"></span>
                Trusted healthcare, simplified
              </div>

              <h1>
                Your Health.
                <br />
                <span>Our Priority.</span>
              </h1>

              <p>
                Connect with trusted doctors, discover the right
                specialist and book your appointment in just a few
                clicks.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-btn"
                  onClick={() => scrollToSection("doctors")}
                >
                  Find a Doctor
                  <span>→</span>
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => scrollToSection("about")}
                >
                  Learn More
                </button>
              </div>

              <div className="hero-trust">
                <div className="trust-avatars">
                  <span>👩🏻‍⚕️</span>
                  <span>👨🏻‍⚕️</span>
                  <span>👨🏻‍⚕️</span>
                </div>

                <div>
                  <strong>Trusted by patients</strong>
                  <small>Professional healthcare access</small>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="medical-dashboard">
                <div className="dashboard-top">
                  <div>
                    <small>Today's care</small>
                    <h3>Doctor Appointment</h3>
                  </div>

                  <div
                    className={`status-pill ${
                      serverOnline ? "online" : "offline"
                    }`}
                  >
                    <span></span>
                    {serverOnline ? "Online" : "Offline"}
                  </div>
                </div>

                <div className="dashboard-card featured-doctor">
                  <div className="doctor-mini-image">
                    <img
                      src={doctors[0].image}
                      alt={doctors[0].name}
                    />
                  </div>

                  <div>
                    <span>Available today</span>
                    <strong>{doctors[0].name}</strong>
                    <small>{doctors[0].specialty}</small>
                  </div>

                  <div className="rating">
                    ★ {doctors[0].rating}
                  </div>
                </div>

                <div className="dashboard-stats">
                  <div>
                    <strong>3</strong>
                    <span>Specialists</span>
                  </div>

                  <div>
                    <strong>4.9</strong>
                    <span>Avg. Rating</span>
                  </div>

                  <div>
                    <strong>24/7</strong>
                    <span>Access</span>
                  </div>
                </div>

                <div className="dashboard-bottom">
                  <span>Next available appointment</span>
                  <strong>Today · 09:00 AM</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH */}
        <section className="search-section">
          <div className="search-container">
            <div className="search-box">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search doctor or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button
                  className="clear-search"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="filter-pills">
              {["All", "General Physician", "Dermatology", "Cardiology"].map(
                (item) => (
                  <button
                    key={item}
                    className={`filter-pill ${
                      specialty === item ? "active" : ""
                    }`}
                    onClick={() => setSpecialty(item)}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* DOCTORS */}
        <section id="doctors" className="doctors-section">
          <div className="section-container">
            <div className="section-heading">
              <div>
                <span className="section-label">
                  OUR SPECIALISTS
                </span>

                <h2>Meet Our Doctors</h2>

                <p>
                  Experienced professionals dedicated to your
                  health and wellbeing.
                </p>
              </div>

              <div className="doctor-count">
                <strong>{filteredDoctors.length}</strong>
                <span>Doctors</span>
              </div>
            </div>

            <div className="doctor-grid">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <article className="doctor-card" key={doctor.id}>
                    <div className="doctor-image-wrapper">
                      <img
                        className="doctor-image"
                        src={doctor.image}
                        alt={doctor.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement.classList.add(
                            "image-fallback"
                          );
                        }}
                      />

                      <div className="image-fallback-content">
                        {doctor.initials}
                      </div>

                      <div className="verified-badge">
                        ✓
                      </div>

                      <div className="doctor-rating">
                        ★ {doctor.rating}
                      </div>
                    </div>

                    <div className="doctor-content">
                      <div className="doctor-heading-row">
                        <div>
                          <h3>{doctor.name}</h3>
                          <p className="doctor-specialty">
                            {doctor.specialty}
                          </p>
                        </div>

                        <div className="doctor-fee">
                          ₹{doctor.fee}
                        </div>
                      </div>

                      <p className="doctor-description">
                        {doctor.description}
                      </p>

                      <div className="doctor-meta">
                        <span>◷ {doctor.experience}</span>
                        <span>● Available</span>
                      </div>

                      <button
                        className="book-btn"
                        onClick={() => openBooking(doctor)}
                      >
                        Book Appointment
                        <span>→</span>
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <div>🔍</div>
                  <h3>No doctors found</h3>
                  <p>
                    Try another doctor name or specialty.
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setSpecialty("All");
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SPECIALTIES */}
        <section
          id="specialties"
          className="specialties-section"
        >
          <div className="section-container">
            <div className="section-heading centered">
              <span className="section-label">
                HEALTHCARE SPECIALTIES
              </span>

              <h2>Care for Every Need</h2>

              <p>
                Choose a specialty and find the right healthcare
                professional for you.
              </p>
            </div>

            <div className="specialty-grid">
              {specialties.map((item) => (
                <button
                  className="specialty-card"
                  key={item.name}
                  onClick={() => {
                    setSpecialty(item.name);
                    scrollToSection("doctors");
                  }}
                >
                  <div className="specialty-icon">
                    {item.icon}
                  </div>

                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>

                  <span className="specialty-arrow">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="about-section">
          <div className="section-container about-grid">
            <div className="about-visual">
              <div className="about-main-card">
                <div className="about-icon">✚</div>

                <span>Healthcare made simple</span>

                <strong>
                  Better care starts with the right
                  connection.
                </strong>

                <div className="about-stat">
                  <strong>01</strong>
                  <span>
                    Search
                    <br />
                    Choose
                    <br />
                    Book
                  </span>
                </div>
              </div>

              <div className="floating-card card-one">
                <strong>4.9/5</strong>
                <span>Patient Rating</span>
              </div>

              <div className="floating-card card-two">
                <strong>✓</strong>
                <span>Verified Doctors</span>
              </div>
            </div>

            <div className="about-content">
              <span className="section-label">
                WHY MEDISLOT
              </span>

              <h2>
                Healthcare that fits
                <span> your life.</span>
              </h2>

              <p>
                MediSlot is designed to make finding and booking
                healthcare appointments simple, fast and
                convenient.
              </p>

              <div className="feature-list">
                <div>
                  <span>✓</span>
                  <div>
                    <strong>Verified Specialists</strong>
                    <p>
                      Connect with experienced healthcare
                      professionals.
                    </p>
                  </div>
                </div>

                <div>
                  <span>✓</span>
                  <div>
                    <strong>Easy Booking</strong>
                    <p>
                      Select a doctor, date and available time
                      slot.
                    </p>
                  </div>
                </div>

                <div>
                  <span>✓</span>
                  <div>
                    <strong>Simple Experience</strong>
                    <p>
                      Everything you need in one elegant
                      platform.
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="primary-btn"
                onClick={() => scrollToSection("doctors")}
              >
                Explore Doctors →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <span>✚</span>
              Medi<span>Slot</span>
            </div>

            <p>
              Modern healthcare appointment booking,
              designed for simplicity and convenience.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <h4>Explore</h4>
              <button onClick={() => scrollToSection("home")}>
                Home
              </button>
              <button onClick={() => scrollToSection("doctors")}>
                Doctors
              </button>
              <button
                onClick={() => scrollToSection("specialties")}
              >
                Specialties
              </button>
            </div>

            <div>
              <h4>Account</h4>
              <button onClick={() => openAuth("login")}>
                Login
              </button>
              <button onClick={() => openAuth("register")}>
                Register
              </button>
              <button onClick={openAppointments}>
                Appointments
              </button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} MediSlot. All rights
            reserved.
          </span>

          <span>Designed & Developed by Shubham Singh</span>
        </div>
      </footer>

      {/* AUTH MODAL */}
      {showAuth && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAuth();
          }}
        >
          <div className="auth-modal">
            <button
              className="modal-close"
              onClick={closeAuth}
            >
              ×
            </button>

            <div className="auth-header">
              <div className="auth-icon">✚</div>

              <h2>
                {authMode === "login"
                  ? "Welcome Back"
                  : "Create Account"}
              </h2>

              <p>
                {authMode === "login"
                  ? "Login to manage your appointments."
                  : "Create your MediSlot patient account."}
              </p>
            </div>

            <div className="auth-tabs">
              <button
                className={
                  authMode === "login" ? "active" : ""
                }
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>

              <button
                className={
                  authMode === "register" ? "active" : ""
                }
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    name="name"
                    value={authForm.name}
                    onChange={handleAuthChange}
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={authForm.password}
                  onChange={handleAuthChange}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <button
                className="auth-submit"
                type="submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                  ? "Login to MediSlot"
                  : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {showBooking && selectedDoctor && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeBooking();
            }
          }}
        >
          <div className="booking-modal">
            <button
              className="modal-close"
              onClick={closeBooking}
            >
              ×
            </button>

            <div className="booking-header">
              <span className="section-label">
                BOOK APPOINTMENT
              </span>

              <h2>Schedule your visit</h2>

              <p>
                Select a convenient date and available time.
              </p>
            </div>

            <div className="booking-doctor">
              <div className="booking-doctor-image">
                <img
                  src={selectedDoctor.image}
                  alt={selectedDoctor.name}
                />
              </div>

              <div>
                <strong>{selectedDoctor.name}</strong>
                <span>{selectedDoctor.specialty}</span>
              </div>

              <strong>₹{selectedDoctor.fee}</strong>
            </div>

            <form onSubmit={handleBooking}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Your Name *</label>
                  <input
                    name="name"
                    value={bookingForm.name}
                    onChange={handleBookingChange}
                    placeholder="Full name"
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={bookingForm.email}
                    onChange={handleBookingChange}
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={bookingForm.phone}
                    onChange={handleBookingChange}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={bookingForm.date}
                    onChange={handleBookingChange}
                    min={new Date()
                      .toISOString()
                      .split("T")[0]}
                  />
                </div>
              </div>

              <div className="slot-section">
                <div className="slot-heading">
                  <strong>Available Time</strong>
                  <span>
                    {bookingForm.date
                      ? "Choose a slot"
                      : "Select a date first"}
                  </span>
                </div>

                <div className="slot-grid">
                  {timeSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      disabled={
                        !bookingForm.date ||
                        availability[slot]
                      }
                      className={`time-slot ${
                        selectedSlot === slot
                          ? "selected"
                          : ""
                      } ${
                        availability[slot]
                          ? "booked"
                          : ""
                      }`}
                      onClick={() => selectSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Reason / Symptoms</label>
                <textarea
                  name="symptoms"
                  value={bookingForm.symptoms}
                  onChange={handleBookingChange}
                  placeholder="Briefly describe your concern..."
                  rows="3"
                />
              </div>

              <div className="booking-summary">
                <div>
                  <span>Doctor</span>
                  <strong>{selectedDoctor.name}</strong>
                </div>

                <div>
                  <span>Appointment</span>
                  <strong>
                    {bookingForm.date && selectedSlot
                      ? `${bookingForm.date} · ${selectedSlot}`
                      : "Not selected"}
                  </strong>
                </div>
              </div>

              <button
                className="confirm-booking-btn"
                type="submit"
                disabled={bookingLoading}
              >
                {bookingLoading
                  ? "Booking..."
                  : "Confirm Appointment →"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* APPOINTMENTS MODAL */}
      {showAppointments && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAppointments(false);
            }
          }}
        >
          <div className="appointments-modal">
            <button
              className="modal-close"
              onClick={() => setShowAppointments(false)}
            >
              ×
            </button>

            <div className="appointments-header">
              <span className="section-label">
                YOUR APPOINTMENTS
              </span>

              <h2>My Appointments</h2>

              <p>
                View your upcoming and booked appointments.
              </p>
            </div>

            {loadingAppointments ? (
              <div className="loading-state">
                <div className="loader"></div>
                Loading appointments...
              </div>
            ) : appointments.length > 0 ? (
              <div className="appointments-list">
                {appointments.map((appointment) => (
                  <div
                    className="appointment-card"
                    key={appointment._id}
                  >
                    <div className="appointment-date">
                      <strong>
                        {appointment.date}
                      </strong>
                      <span>{appointment.time}</span>
                    </div>

                    <div className="appointment-info">
                      <strong>{appointment.doctor}</strong>
                      <span>{appointment.email}</span>
                      <span>{appointment.phone}</span>
                    </div>

                    <div className="appointment-status">
                      Confirmed
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-appointments">
                <div>📅</div>
                <h3>No appointments yet</h3>
                <p>
                  Book an appointment with one of our
                  specialists.
                </p>

                <button
                  onClick={() => {
                    setShowAppointments(false);
                    scrollToSection("doctors");
                  }}
                >
                  Find a Doctor
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "error" ? "!" : "✓"}
          </span>

          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;