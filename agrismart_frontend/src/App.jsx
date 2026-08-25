import { Navigate, Route, Routes } from "react-router-dom";
import { getAdminAccessToken } from './auth/authStorage';
import "./App.css";
import { ThemeProvider } from "./ThemeContext";
import Login from "./Page/Login/Login";
import AdminLogin from "./Page/AdminLogin/AdminLogin";
import Register from "./Page/Register/Register";
import ForgotPassword from "./Page/ForfotPassword/ForgotPassword";
import Send from "./Page/Send/Send";
import Home from "./Page/Home/Home";
import Tips from "./Page/Tips/Tips";
import About from "./Page/About/About";
import Scheduler from "./Page/Scheduler/Scheduler";
import Farmmanagement from "./Page/Farmmanagement/Farmmanagement";
import Notify from "./Page/Notify/Notify";
import Profile from "./Page/Profile/Profile";
import PlantGrowth from "./Page/PlantGrowth/PlantGrowth";
import Settings from "./Page/Settings/Settings";
import AccountSettings from "./Page/AccountSettings/AccountSettings";
import DiseaseAlerts from "./Page/DiseaseAlerts/DiseaseAlerts";
import VerifyCode from "./Page/VerifyCode/VerifyCode";
import NotificationsSettings from "./Page/NotificationsSettings/NotificationsSettings";
import ReportsHome from "./Page/Reports/ReportsHome";
import FarmSettings from "./Page/FarmSettings/FarmSettings";
import ResetPassword from "./Page/ResetPassword/ResetPassword";
import Soilmonitoring from "./Page/Soilmonitoring/Soilmonitoring";
import ReportsSettings from "./Page/ReportsSettings/ReportsSettings";
import Subscriptions from "./Page/Subscriptions/Subscriptions";
import AdminDashboard from "./Page/AdminDashboard/AdminDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import HelpCenter from "./Page/HelpCenter/HelpCenter";



const AdminProtectedRoute = ({ children }) => {
  const adminToken = getAdminAccessToken();
  
  // إذا لم يكن هناك توكن إدارة، وجهه لصفحة تسجيل دخول الإدارة
  if (!adminToken) {
    return <Navigate to="/admin-login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/help-center" element={<HelpCenter/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/send" element={<Send />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tips" element={<Tips />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/scheduler"
          element={
            <ProtectedRoute>
              <Scheduler />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Farmmanagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notify"
          element={
            <ProtectedRoute>
              <Notify />
            </ProtectedRoute>
          }
        />
        <Route
          path="/soilmonitoring"
          element={
            <ProtectedRoute>
              <Soilmonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plant-growth"
          element={
            <ProtectedRoute>
              <PlantGrowth />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-settings"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/disease-alerts"
          element={
            <ProtectedRoute>
              <DiseaseAlerts />
            </ProtectedRoute>
          }
        />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route
          path="/notifications-settings"
          element={
            <ProtectedRoute>
              <NotificationsSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports-settings"
          element={
            <ProtectedRoute>
              <ReportsSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farm-settings"
          element={
            <ProtectedRoute>
              <FarmSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <Subscriptions />
            </ProtectedRoute>
          }
        />
        
        {/* واجهة الأدمن الخارجية */}
        <Route 
  path="/admin/*" 
  element={
    <AdminProtectedRoute>
      <AdminDashboard />
    </AdminProtectedRoute>
  } 
/>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
