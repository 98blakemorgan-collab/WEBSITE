import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ContentProvider } from "@/context/ContentContext";
import { PublicLayout } from "@/components/PublicLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Shows from "@/pages/Shows";
import ShowDetail from "@/pages/ShowDetail";
import OurStory from "@/pages/OurStory";
import Archive from "@/pages/Archive";
import Membership from "@/pages/Membership";
import Sponsors from "@/pages/Sponsors";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import Portal from "@/pages/member/Portal";

import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import AdminShows from "@/pages/admin/AdminShows";
import AdminMembers from "@/pages/admin/AdminMembers";
import AdminTickets from "@/pages/admin/AdminTickets";
import AdminEmail from "@/pages/admin/AdminEmail";
import AdminPages from "@/pages/admin/AdminPages";
import MediaLibrary from "@/pages/admin/MediaLibrary";

const pub = (el) => <PublicLayout>{el}</PublicLayout>;

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ContentProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={pub(<Home />)} />
              <Route path="/shows" element={pub(<Shows />)} />
              <Route path="/shows/:id" element={pub(<ShowDetail />)} />
              <Route path="/our-story" element={pub(<OurStory />)} />
              <Route path="/archive" element={pub(<Archive />)} />
              <Route path="/membership" element={pub(<Membership />)} />
              <Route path="/sponsors" element={pub(<Sponsors />)} />
              <Route path="/contact" element={pub(<Contact />)} />
              <Route path="/payment/success" element={pub(<PaymentSuccess />)} />
              <Route path="/payment/cancel" element={pub(<PaymentCancel />)} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/portal" element={<ProtectedRoute>{pub(<Portal />)}</ProtectedRoute>} />

              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="shows" element={<AdminShows />} />
                <Route path="members" element={<AdminMembers />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="email" element={<AdminEmail />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="media" element={<MediaLibrary />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors theme="dark" />
        </ContentProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
