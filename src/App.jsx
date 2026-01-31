import './App.css';
import { Route, Routes } from 'react-router-dom';
import Login from './Pages/Login';
import AdminDashboard from './Pages/AdminDashboard';
import Layout from './Components/Layout';
import Messcutreport from './Pages/Messcutreport';
import Namewisereport from './Pages/Namewisereport';
import DateWiseReport from './Pages/Datewisereport';
import Monthlyattendancereport from './Pages/Monthlyattendancereport';
import RequestView from './Pages/RequestView';
import RequestBulkAproval from './Pages/RequestBulkAproval';
import ApologyRequest from './Pages/ApologyRequest';
import HolidaySelect from './Pages/HolidaySelect';
import ComplaintDetails from './Pages/ComplaintDetails';
import StudentDetails from './Pages/StudentDetails';
import PresentMesscutReport from './Pages/PresentMesscutReport';
import AttendanceReport from './Pages/AttendanceReport';
import AbsentNoMesscutReport from './Pages/AbsentNoMesscutReport';
import AbsenteesReport from './Pages/AbsenteesReport';
import AttendanceComparisonReport from './Pages/AttendanceComparisonReport';
import AttendanceMonthlyReport from "./Pages/AttendanceMonthlyReport";
import UserForm from './Pages/UserForm';
import ForgotPassword from './Pages/ForgotPassword';


import ProtectedRoute from "./Components/ProtectedRoute";
import FeePay from './Pages/FeePay';
import Studentprofiles from './Pages/Studentprofiles';
import AdminOutingPage from './Pages/AdminOutingPage';
import OutingAndReport from './Pages/OutingAndReport';
import SemesterBulkChange from './Pages/SemesterBulkChange';

function App() {
  return (
    <>
      <Routes>

        {/* Public Routes */}
        <Route path='/login' element={<Login />} />
        <Route path='/' element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>

          <Route path='/dashboard' element={<AdminDashboard />} />
          <Route path='/student-profile' element={<Studentprofiles />} />

          <Route path='/mess-cut-report' element={<Messcutreport />} />
          <Route path='/name-wise-report' element={<Namewisereport />} />
          <Route path='/Date-wise-report' element={<DateWiseReport />} />
          <Route path='/Monthly-Attendance-report' element={<Monthlyattendancereport />} />
          <Route path='/Request-View' element={<RequestView />} />
          <Route path='/Request-Bulk-Aprove' element={<RequestBulkAproval />} />
          <Route path='/Aplology-Request' element={<ApologyRequest />} />
          <Route path='/holiday-select' element={<HolidaySelect />} />
          <Route path="/complaint-details" element={<ComplaintDetails />} />
          <Route path="/student-details" element={<StudentDetails />} />
          <Route path="/present-messcut-report" element={<PresentMesscutReport />} />
          <Route path="/attendance-report" element={<AttendanceReport />} />
          <Route path="/absent-nomesscut-report" element={<AbsentNoMesscutReport />} />
          <Route path="/absentees-report" element={<AbsenteesReport />} />
          <Route path="/attendance-comparison" element={<AttendanceComparisonReport />} />
          <Route path="/attendance-monthly-report" element={<AttendanceMonthlyReport />} />

          <Route path="/fee-pay" element={<FeePay />} />
          <Route path="/outing" element={<AdminOutingPage />} />
          <Route
            path="/outingrequestandreport"
            element={<OutingAndReport />}
          />

          <Route
            path="/semester-bulk-change"
            element={<SemesterBulkChange />}
          />
        </Route>

        {/* Public User Form */}
        <Route path='/userform' element={<UserForm />} />

      </Routes>
    </>
  );
}

export default App;
