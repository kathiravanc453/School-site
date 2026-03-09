import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Events from './components/Events';
import Gallery from './components/Gallery';
import Achievements from './components/Achievements';
import Facilities from './components/Facilities';
import AdmissionForm from './components/AdmissionForm';
// import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import AdminEvents from './components/AdminEvents';
import AdminMessages from './components/AdminMessages';
import AdminTeachers from './components/AdminTeachers';
import AdminGallery from './components/AdminGallery';
import AdminFees from './components/AdminFees';
import AdminAlumni from './components/AdminAlumni';
import AnnouncementBanner from './components/AnnouncementBanner';
import Faculty from './components/Faculty';
import SocialSidebar from './components/SocialSidebar';
import Chatbot from './components/Chatbot';
import Alumni from './components/Alumni';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHome = location.pathname === '/';

  return (
    <div className="app-container">
      {/* Show Navbar & Footer only on public pages */}
      {isHome && !isAdminRoute && <AnnouncementBanner />}
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <SocialSidebar />}

      <main className="content" style={{ minHeight: '80vh', paddingTop: (!isHome && !isAdminRoute) ? '80px' : '0' }}>
        <Routes>
          {/* Home page combines Hero and Admissions as a landing */}
          <Route path="/" element={<><Hero /><AdmissionForm /></>} />
          <Route path="/events" element={<Events />} />
          <Route path="/facilities" element={<Facilities />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/admissions" element={<AdmissionForm />} />
          <Route path="/alumni" element={<Alumni />} />
          {/* <Route path="/contact" element={<Contact />} /> */}

          {/* Admin Pages (No Navbar/Footer) */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/teachers" element={<AdminTeachers />} />
          <Route path="/admin/gallery" element={<AdminGallery />} />
          <Route path="/admin/fees" element={<AdminFees />} />
          <Route path="/admin/alumni" element={<AdminAlumni />} />
        </Routes>
      </main>

      {!isAdminRoute && <Chatbot />}
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
