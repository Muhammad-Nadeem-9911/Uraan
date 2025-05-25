import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css'; // You can clear this out later
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS for react-toastify

// Import Page Components
import HomePage from './pages/HomePage'; // Import the actual HomePage

import CompetitionDetailPage from './pages/CompetitionDetailPage'; // Import the actual CompetitionDetailPage
import Navbar from './components/layout/Navbar'; // Import the new Navbar component
import AdminLoginPage from './pages/AdminLoginPage'; // Import the actual AdminLoginPage
import AdminDashboardPage from './pages/AdminDashboardPage'; // Import the actual AdminDashboardPage
import CreateCompetitionPage from './pages/CreateCompetitionPage'; // Import CreateCompetitionPage
import EditCompetitionPage from './pages/EditCompetitionPage'; // Import EditCompetitionPage
import ManageCompetitionParticipantsPage from './pages/ManageCompetitionParticipantsPage'; // Import ManageCompetitionParticipantsPage
import RecordPigeonTimesPage from './pages/RecordPigeonTimesPage'; // Import RecordPigeonTimesPage
import EditParticipantPage from './pages/EditParticipantPage'; // Import EditParticipantPage
import ProtectedRoute from './components/auth/ProtectedRoute'; // Import ProtectedRoute
import ParticleBackground from './components/effects/ParticleBackground'; // Import ParticleBackground
import Footer from './components/layout/Footer'; // Import the Footer component
import './styles/admin-layout.css'; // Import admin layout styles
// Removed AdminLayout import, will use AdminPagesWrapper instead
import AdminPagesWrapper from './components/layout/AdminPagesWrapper'; // Import AdminPagesWrapper
import ManageHeroCarouselPage from './pages/admin/ManageHeroCarouselPage'; // Import new admin page
function App() {

  return (
    <Router>
      <div className="app-container"> {/* Optional: A wrapper for overall app styling */}
        <ParticleBackground /> {/* Add particle background here */}
        <Navbar /> {/* Use the new Navbar component */}
        <ToastContainer autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        <main className="main-content"> {/* Optional: A wrapper for page content */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/competition/:id" element={<CompetitionDetailPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            {/* Protected Admin Routes with AdminPagesWrapper */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminPagesWrapper />}> {/* AdminPagesWrapper provides AdminNavbar and Outlet */}
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/hero-carousel" element={<ManageHeroCarouselPage />} /> {/* New Route */}
                <Route path="/admin/competitions/create" element={<CreateCompetitionPage />} />
                <Route path="/admin/competitions/edit/:id" element={<EditCompetitionPage />} />
                <Route path="/admin/competitions/:competitionId/participants" element={<ManageCompetitionParticipantsPage />} />
                <Route path="/admin/competitions/:competitionId/participants/:participantId/record-times" element={<RecordPigeonTimesPage />} />
                <Route path="/admin/competitions/:competitionId/participants/:participantId/edit" element={<EditParticipantPage />} />
              </Route>
            </Route>
            {/* Define more routes here */}
          </Routes>
        </main>
        <Footer /> {/* Add the Footer component here */}
      </div>
    </Router>
  );
}

export default App;
