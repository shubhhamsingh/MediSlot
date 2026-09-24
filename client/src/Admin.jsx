import React, { useEffect, useMemo, useState } from "react";
import "./Admin.css";

const API_URL = "https://medislot-4w01.onrender.com";

const DOCTORS = [
  {
    name: "Dr. Ananya Sharma",
    specialty: "General Physician",
    experience: "8+ Years",
    rating: "4.9",
    patients: "2,500+",
    icon: "👩‍⚕️",
  },
  {
    name: "Dr. Arjun Kapoor",
    specialty: "Dermatologist",
    experience: "10+ Years",
    rating: "4.8",
    patients: "3,100+",
    icon: "👨‍⚕️",
  },
  {
    name: "Dr. Rohan Mehta",
    specialty: "Cardiologist",
    experience: "12+ Years",
    rating: "4.9",
    patients: "4,200+",
    icon: "👨‍⚕️",
  },
];

function Admin() {
  const [activePage, setActivePage] = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/appointments`);

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();

      const formattedAppointments = (data.appointments || []).map(
        (appointment) => ({
          ...appointment,
          status: appointment.status || "Pending",
        })
      );

      setAppointments(formattedAppointments);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Unable to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Doctors appearing in appointments
  const doctors = useMemo(() => {
    return [
      "All",
      ...new Set(
        appointments
          .map((appointment) => appointment.doctor)
          .filter(Boolean)
      ),
    ];
  }, [appointments]);

  // Local date
  const today = new Date();
  const todayString =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  // Statistics
  const totalAppointments = appointments.length;

  const todayAppointments = appointments.filter(
    (appointment) => appointment.date === todayString
  ).length;

  const uniquePatients = new Set(
    appointments
      .map((appointment) => appointment.email)
      .filter(Boolean)
  ).size;

  const totalDoctors = DOCTORS.length;

  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "Pending"
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "Confirmed"
  ).length;

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        appointment.name?.toLowerCase().includes(searchText) ||
        appointment.email?.toLowerCase().includes(searchText) ||
        appointment.phone?.toLowerCase().includes(searchText) ||
        appointment.doctor?.toLowerCase().includes(searchText);

      const matchesDoctor =
        filterDoctor === "All" ||
        appointment.doctor === filterDoctor;

      const matchesStatus =
        statusFilter === "All" ||
        appointment.status === statusFilter;

      return matchesSearch && matchesDoctor && matchesStatus;
    });
  }, [appointments, search, filterDoctor, statusFilter]);

  // Change appointment status locally
  const updateStatus = (id, newStatus) => {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment._id === id
          ? { ...appointment, status: newStatus }
          : appointment
      )
    );

    if (selectedAppointment?._id === id) {
      setSelectedAppointment((current) => ({
        ...current,
        status: newStatus,
      }));
    }
  };

  // Delete from dashboard view
  const removeAppointment = (id) => {
    const confirmed = window.confirm(
      "Remove this appointment from the admin panel?"
    );

    if (!confirmed) return;

    setAppointments((current) =>
      current.filter((appointment) => appointment._id !== id)
    );

    setSelectedAppointment(null);
  };

  const pageTitles = {
    dashboard: {
      title: "Dashboard",
      subtitle:
        "Monitor appointments, patients and healthcare activity.",
    },
    appointments: {
      title: "Appointments",
      subtitle:
        "View, search and manage all patient appointments.",
    },
    patients: {
      title: "Patients",
      subtitle:
        "View patients who have booked appointments through MediSlot.",
    },
    doctors: {
      title: "Doctors",
      subtitle:
        "Manage and monitor doctors available on MediSlot.",
    },
  };

  const currentPage = pageTitles[activePage];

  // Appointment table
  const AppointmentTable = ({ data }) => (
    <>
      {data.length === 0 ? (
        <div className="state-message">
          <div className="empty-icon">◷</div>
          <h3>No appointments found</h3>
          <p>
            No appointments match your current search or filters.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="appointment-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {data.map((appointment) => (
                <tr key={appointment._id}>
                  <td>
                    <div className="patient-cell">
                      <div className="patient-avatar">
                        {(appointment.name || "P")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {appointment.name || "Patient"}
                        </strong>

                        <span>
                          ID:{" "}
                          {appointment._id?.slice(-6) || "------"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="contact-cell">
                      <span>
                        {appointment.email || "No email"}
                      </span>

                      <small>
                        {appointment.phone || "No phone"}
                      </small>
                    </div>
                  </td>

                  <td>
                    <strong className="doctor-name">
                      {appointment.doctor || "—"}
                    </strong>
                  </td>

                  <td>{appointment.date || "—"}</td>

                  <td>
                    <span className="time-badge">
                      {appointment.time || "—"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status ${
                        appointment.status === "Confirmed"
                          ? "confirmed"
                          : appointment.status === "Cancelled"
                          ? "cancelled"
                          : "pending"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="view-btn"
                      onClick={() =>
                        setSelectedAppointment(appointment)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <div className="admin-page">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-brand">
          <div className="brand-icon">M</div>

          <div>
            <h2>MediSlot</h2>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="admin-nav">

          <button
            className={`nav-item ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActivePage("dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage === "appointments" ? "active" : ""
            }`}
            onClick={() => setActivePage("appointments")}
          >
            <span>◷</span>
            Appointments
          </button>

          <button
            className={`nav-item ${
              activePage === "patients" ? "active" : ""
            }`}
            onClick={() => setActivePage("patients")}
          >
            <span>♙</span>
            Patients
          </button>

          <button
            className={`nav-item ${
              activePage === "doctors" ? "active" : ""
            }`}
            onClick={() => setActivePage("doctors")}
          >
            <span>⚕</span>
            Doctors
          </button>

        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="profile-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <span>System Admin</span>
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN */}
      <main className="admin-main">

        {/* HEADER */}
        <header className="admin-header">

          <div>
            <p className="eyebrow">
              MEDISLOT MANAGEMENT
            </p>

            <h1>{currentPage.title}</h1>

            <p className="header-subtitle">
              {currentPage.subtitle}
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={fetchAppointments}
          >
            ↻ Refresh
          </button>

        </header>

        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <>
            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon blue">◷</div>

                <div>
                  <span>Total Appointments</span>
                  <strong>{totalAppointments}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>

                <div>
                  <span>Today's Appointments</span>
                  <strong>{todayAppointments}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">♙</div>

                <div>
                  <span>Total Patients</span>
                  <strong>{uniquePatients}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">⚕</div>

                <div>
                  <span>Doctors</span>
                  <strong>{totalDoctors}</strong>
                </div>
              </div>

            </section>

            <section className="appointment-panel">

              <div className="panel-header">

                <div>
                  <h2>Recent Appointments</h2>
                  <p>
                    Latest appointments received by MediSlot.
                  </p>
                </div>

                <button
                  className="view-btn"
                  onClick={() =>
                    setActivePage("appointments")
                  }
                >
                  View All
                </button>

              </div>

              {loading ? (
                <div className="state-message">
                  <div className="loader"></div>
                  <p>Loading appointments...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <strong>Something went wrong</strong>
                  <p>{error}</p>

                  <button onClick={fetchAppointments}>
                    Try Again
                  </button>
                </div>
              ) : (
                <AppointmentTable
                  data={appointments.slice(0, 5)}
                />
              )}

            </section>

            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon orange">!</div>

                <div>
                  <span>Pending</span>
                  <strong>{pendingAppointments}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>

                <div>
                  <span>Confirmed</span>
                  <strong>{confirmedAppointments}</strong>
                </div>
              </div>

            </section>
          </>
        )}

        {/* APPOINTMENTS */}
        {activePage === "appointments" && (
          <section className="appointment-panel">

            <div className="panel-header">

              <div>
                <h2>All Appointments</h2>

                <p>
                  {filteredAppointments.length} appointment
                  {filteredAppointments.length !== 1
                    ? "s"
                    : ""}{" "}
                  found.
                </p>
              </div>

              <div className="panel-actions">

                <input
                  type="text"
                  placeholder="Search patient, email, doctor..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

                <select
                  value={filterDoctor}
                  onChange={(e) =>
                    setFilterDoctor(e.target.value)
                  }
                >
                  {doctors.map((doctor) => (
                    <option key={doctor} value={doctor}>
                      {doctor}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">
                    Confirmed
                  </option>
                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>

              </div>

            </div>

            {loading ? (
              <div className="state-message">
                <div className="loader"></div>
                <p>Loading appointments...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <strong>Unable to load appointments</strong>
                <p>{error}</p>

                <button onClick={fetchAppointments}>
                  Try Again
                </button>
              </div>
            ) : (
              <AppointmentTable
                data={filteredAppointments}
              />
            )}

          </section>
        )}

        {/* PATIENTS */}
        {activePage === "patients" && (
          <section className="appointment-panel">

            <div className="panel-header">

              <div>
                <h2>Patient Directory</h2>

                <p>
                  {uniquePatients} unique patient
                  {uniquePatients !== 1 ? "s" : ""} registered
                  through appointments.
                </p>
              </div>

              <input
                type="text"
                className="patient-search"
                placeholder="Search patients..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <div className="table-wrapper">

              <table className="appointment-table">

                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Appointments</th>
                    <th>Latest Doctor</th>
                  </tr>
                </thead>

                <tbody>
                  {Array.from(
                    new Map(
                      appointments
                        .filter((appointment) => {
                          const text =
                            search.toLowerCase();

                          return (
                            !text ||
                            appointment.name
                              ?.toLowerCase()
                              .includes(text) ||
                            appointment.email
                              ?.toLowerCase()
                              .includes(text) ||
                            appointment.phone
                              ?.toLowerCase()
                              .includes(text)
                          );
                        })
                        .map((appointment) => [
                          appointment.email ||
                            appointment.phone ||
                            appointment._id,
                          appointment,
                        ])
                    ).values()
                  ).map((patient) => {

                    const patientAppointments =
                      appointments.filter(
                        (appointment) =>
                          appointment.email ===
                          patient.email
                      );

                    return (
                      <tr key={patient._id}>

                        <td>
                          <div className="patient-cell">

                            <div className="patient-avatar">
                              {(patient.name || "P")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {patient.name ||
                                  "Patient"}
                              </strong>

                              <span>
                                Patient
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          {patient.email || "—"}
                        </td>

                        <td>
                          {patient.phone || "—"}
                        </td>

                        <td>
                          <strong>
                            {patientAppointments.length}
                          </strong>
                        </td>

                        <td>
                          <strong className="doctor-name">
                            {patient.doctor || "—"}
                          </strong>
                        </td>

                      </tr>
                    );
                  })}

                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan="5">
                        <div className="state-message">
                          <h3>No patients yet</h3>
                          <p>
                            Patients will appear here after
                            booking appointments.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {/* DOCTORS */}
        {activePage === "doctors" && (
          <section className="appointment-panel">

            <div className="panel-header">

              <div>
                <h2>Our Doctors</h2>

                <p>
                  Doctors currently available on MediSlot.
                </p>
              </div>

            </div>

            <div className="doctor-grid">

              {DOCTORS.map((doctor) => {

                const appointmentCount =
                  appointments.filter(
                    (appointment) =>
                      appointment.doctor === doctor.name
                  ).length;

                return (
                  <div
                    className="doctor-card"
                    key={doctor.name}
                  >

                    <div className="doctor-card-top">

                      <div className="doctor-avatar">
                        {doctor.icon}
                      </div>

                      <span className="doctor-active">
                        ● Active
                      </span>

                    </div>

                    <h3>{doctor.name}</h3>

                    <p className="doctor-specialty">
                      {doctor.specialty}
                    </p>

                    <div className="doctor-info">
                      <span>
                        ⭐ {doctor.rating}
                      </span>

                      <span>
                        {doctor.experience}
                      </span>
                    </div>

                    <div className="doctor-card-footer">

                      <div>
                        <strong>
                          {appointmentCount}
                        </strong>

                        <span>
                          Appointments
                        </span>
                      </div>

                      <div>
                        <strong>
                          {doctor.patients}
                        </strong>

                        <span>
                          Patients
                        </span>
                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          </section>
        )}

      </main>

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAppointment && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedAppointment(null)
          }
        >

          <div
            className="appointment-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={() =>
                setSelectedAppointment(null)
              }
            >
              ×
            </button>

            <div className="modal-header">
              <div className="modal-avatar">
                {(selectedAppointment.name || "P")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h2>
                  {selectedAppointment.name ||
                    "Patient"}
                </h2>

                <p>
                  Appointment #
                  {selectedAppointment._id?.slice(-6)}
                </p>
              </div>
            </div>

            <div className="modal-details">

              <div>
                <span>Email</span>
                <strong>
                  {selectedAppointment.email || "—"}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  {selectedAppointment.phone || "—"}
                </strong>
              </div>

              <div>
                <span>Doctor</span>
                <strong>
                  {selectedAppointment.doctor || "—"}
                </strong>
              </div>

              <div>
                <span>Date</span>
                <strong>
                  {selectedAppointment.date || "—"}
                </strong>
              </div>

              <div>
                <span>Time</span>
                <strong>
                  {selectedAppointment.time || "—"}
                </strong>
              </div>

              <div>
                <span>Reason</span>
                <strong>
                  {selectedAppointment.reason ||
                    "General consultation"}
                </strong>
              </div>

            </div>

            <div className="modal-actions">

              <button
                className="confirm-btn"
                onClick={() =>
                  updateStatus(
                    selectedAppointment._id,
                    "Confirmed"
                  )
                }
              >
                ✓ Confirm
              </button>

              <button
                className="cancel-btn"
                onClick={() =>
                  updateStatus(
                    selectedAppointment._id,
                    "Cancelled"
                  )
                }
              >
                × Cancel
              </button>

              <button
                className="remove-btn"
                onClick={() =>
                  removeAppointment(
                    selectedAppointment._id
                  )
                }
              >
                Remove
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Admin;