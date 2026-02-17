import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  Container,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LockResetIcon from "@mui/icons-material/LockReset";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import ComplaintIcon from "@mui/icons-material/ReportProblem";
import PaymentIcon from "@mui/icons-material/Payment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import StudentViewRequestModal from "../Components/StudentViewRequestModal";
import ApologyViewModal from "../Components/ApologyViewModal";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import ComplaintViewModal from "../Components/ComplaintViewModal";
import OneDayOutingRequestModal from "../Components/OneDayOutingRequestModal";

const UserForm = () => {
  const [formData, setFormData] = useState({
    admissionNo: "",
    roomNo: "",
    name: "",
    leavingDate: "",
    leavingTime: "",
    returningDate: "",
    returningTime: "",
    reason: "",
    complaint: "",
  });
  
  const [openModal, setOpenModal] = useState(false);
  const [openApology, setOpenApology] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [openOneDayOuting, setOpenOneDayOuting] = useState(false);
  const [lockedDates, setLockedDates] = useState([]); // ⚠️ CHANGED: renamed for clarity
  const [holidays, setHolidays] = useState([]);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [feeData, setFeeData] = useState({
    totalFee: 0,
    totalPaid: 0,
    totalDue: 0,
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [openComplaintView, setOpenComplaintView] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  // ✅ ============== ACCURATE DATE UTILITY FUNCTIONS ==============
  
  // Get ALL dates between start and end (INCLUSIVE) - FIXED TIMEZONE ISSUE
  const getAllDatesInRange = (startDate, endDate) => {
    const dates = [];
    
    // Parse dates properly to avoid timezone issues
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    
    // Set to noon to avoid date boundary issues
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    
    return dates;
  };

  // ✅ Check if a SPECIFIC date is locked
  const isDateLocked = (dateString) => {
    if (!dateString) return false;
    return lockedDates.includes(dateString);
  };

  // ✅ Check if ANY date in range is locked
  const isAnyDateLockedInRange = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    const dateRange = getAllDatesInRange(startDate, endDate);
    return dateRange.some(date => lockedDates.includes(date));
  };

  // ✅ Get ALL locked dates in a range
  const getLockedDatesInRange = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const dateRange = getAllDatesInRange(startDate, endDate);
    return dateRange.filter(date => lockedDates.includes(date));
  };

  // ✅ Check if date is weekend
  const isWeekend = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // ✅ Check if date is holiday
  const isHoliday = (dateString) => {
    return holidays.includes(dateString);
  };

  // ✅ Format date for display
  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // ✅ ============== ACCURATE DATE FETCHING ==============

  // Fetch ALL messcut dates that are ACTIVE (not rejected)
  const fetchLockedDates = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.admissionNumber) return;

      const res = await axios.get(
        `https://mim-backend-b5cd.onrender.com/messcut/student`,
        { params: { admissionNo: user.admissionNumber } }
      );

      if (res.data?.success) {
        const requests = res.data.data || [];
        const locked = [];
        
        console.log("📋 Fetched requests:", requests.length);
        
        requests.forEach((request) => {
          // ✅ ONLY lock dates from NON-REJECTED requests
          if (request.status !== "REJECT" && request.parentStatus !== "REJECT") {
            
            // ✅ Extract clean date strings (remove time part if exists)
            const startDate = request.leavingDate.split('T')[0];
            const endDate = request.returningDate.split('T')[0];
            
            console.log(`🔒 Locking: ${startDate} to ${endDate}`);
            
            // ✅ Get ALL dates between leaving and returning (INCLUSIVE)
            const allDates = getAllDatesInRange(startDate, endDate);
            locked.push(...allDates);
          }
        });

        // ✅ Remove duplicates and sort
        const uniqueLockedDates = [...new Set(locked)].sort();
        setLockedDates(uniqueLockedDates);
        
        console.log("✅ Locked dates loaded:", uniqueLockedDates.length, "dates");
      }
    } catch (err) {
      console.error("❌ Error fetching messcut dates:", err);
    }
  };

  // Fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await axios.get(
          "https://mim-backend-b5cd.onrender.com/api/holiday/all"
        );

        if (res.data.success) {
          const holidayDates = res.data.data.map(
            (h) => h.date.split("T")[0]
          );
          setHolidays(holidayDates);
          console.log("✅ Holidays loaded:", holidayDates.length);
        }
      } catch (err) {
        console.error("❌ Error fetching holidays:", err);
      }
    };

    fetchHolidays();
  }, []);

  // Fetch fee data
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser?.admissionNumber) {
      console.warn("⚠️ Admission number not found for fee fetch");
      return;
    }

    const fetchFeeData = async () => {
      try {
        const res = await axios.get(
          `https://mim-backend-b5cd.onrender.com/fees/get/${storedUser.admissionNumber}`
        );

        if (res.data.success) {
          setFeeData({
            totalFee: res.data.data.totalFee || 0,
            totalPaid: res.data.data.totalPaid || 0,
            totalDue: res.data.data.totalDue || 0,
          });
          console.log("✅ Fee data loaded");
        }
      } catch (error) {
        console.error("❌ Error fetching fee data:", error);
      }
    };

    fetchFeeData();
  }, []);

  // Fetch user details and locked dates
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser?.admissionNumber) {
      toast.error("⚠️ User session expired. Please log in again.");
      navigate("/login");
      return;
    }

    // Fetch user details
    axios
      .get("https://mim-backend-b5cd.onrender.com/user", {
        params: { admissionNumber: storedUser.admissionNumber },
      })
      .then((res) => {
        if (res.data.success) {
          const data = res.data.data;
          setFormData(prev => ({
            ...prev,
            admissionNo: data.admissionNumber || "",
            name: data.name || "",
            roomNo: data.roomNo || "",
          }));
          localStorage.setItem("user", JSON.stringify(data));
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching user:", err);
      });

    // ✅ Fetch locked dates immediately
    fetchLockedDates();

    // ✅ Auto-refresh every 10 seconds to keep locks updated
    const interval = setInterval(fetchLockedDates, 10000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  // ✅ ============== ACCURATE HANDLE CHANGE WITH DATE LOCKING ==============

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      // --- LEAVING DATE VALIDATION ---
      if (name === "leavingDate") {
        // ❌ Check if date is in past
        if (value < today) {
          toast.error("❌ Cannot select past dates!");
          return { ...prev };
        }

        // ❌ Check if date is ALREADY LOCKED
        if (isDateLocked(value)) {
          toast.error(`❌ ${formatDate(value)} already has a mess cut request!`);
          return { ...prev };
        }

        // ℹ️ Weekend check
        if (isWeekend(value)) {
          toast.info("📅 Weekend - Morning departure available");
        }

        // ℹ️ Holiday check
        if (isHoliday(value)) {
          toast.info("🎉 Holiday - Morning departure available");
        }

        return {
          ...prev,
          leavingDate: value,
          leavingTime: "",
          returningDate: "",
          returningTime: "",
        };
      }

      // --- RETURNING DATE VALIDATION ---
 // --- RETURNING DATE VALIDATION ---
if (name === "returningDate") {
  if (!prev.leavingDate) {
    toast.warning("⚠️ Please select leaving date first!");
    return { ...prev };
  }

  const leaveDate = prev.leavingDate;
  const returnDate = value;

  if (returnDate < leaveDate) {
    toast.error("❌ Returning date must be after leaving date!");
    return { ...prev, returningDate: "" };
  }

  if (isDateLocked(returnDate)) {
    toast.error(`❌ ${formatDate(returnDate)} already has a mess cut request!`);
    return { ...prev, returningDate: "" };
  }

  if (isAnyDateLockedInRange(leaveDate, returnDate)) {
    const lockedDatesList = getLockedDatesInRange(leaveDate, returnDate);

    toast.error(
      `❌ ${lockedDatesList.length} date(s) already booked`
    );
    return { ...prev, returningDate: "" };
  }

  return {
    ...prev,
    returningDate: value,
  };
}


      // Default: update other fields
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ ============== ACCURATE MESS CUT SUBMIT WITH FULL VALIDATION ==============

const handleMesscutSubmit = async () => {
  const {
    leavingDate,
    leavingTime,
    returningDate,
    returningTime,
    reason,
  } = formData;

  if (!leavingDate || !leavingTime || !returningDate || !returningTime) {
    toast.warning("⚠️ All fields are required!");
    return;
  }

  if (!reason.trim()) {
    toast.warning("⚠️ Please provide a reason!");
    return;
  }

  if (returningDate < leavingDate) {
    toast.error("❌ Returning date cannot be before leaving date!");
    return;
  }

  if (isDateLocked(leavingDate)) {
    toast.error(`❌ ${formatDate(leavingDate)} already booked!`);
    return;
  }

  if (isDateLocked(returningDate)) {
    toast.error(`❌ ${formatDate(returningDate)} already booked!`);
    return;
  }

  const lockedInRange = getLockedDatesInRange(leavingDate, returningDate);
  if (lockedInRange.length > 0) {
    toast.error(`❌ ${lockedInRange.length} dates already booked!`);
    return;
  }

  if (feeData.totalDue >= 10000) {
    toast.error(`❌ Mess cut blocked. Clear fee dues ₹${feeData.totalDue}`);
    return;
  }

  try {
    const res = await axios.post(
      `https://mim-backend-b5cd.onrender.com/adddetail`,
      formData
    );

    if (res.data?.success) {
      toast.success("✅ Mess cut request submitted!");

      setFormData(prev => ({
        ...prev,
        leavingDate: "",
        leavingTime: "",
        returningDate: "",
        returningTime: "",
        reason: "",
      }));

      await fetchLockedDates();
    } else {
      toast.error(res.data?.message || "❌ Submission failed!");
    }
  } catch (err) {
    toast.error("❌ Server error. Try again.");
  }
};


  const handleComplaintSubmit = async () => {
    try {
      if (!formData.complaint.trim()) {
        toast.warning("⚠️ Please enter your complaint!");
        return;
      }

      const payload = {
        name: formData.name,
        admissionNo: formData.admissionNo,
        roomNo: formData.roomNo,
        complaint: formData.complaint,
      };

      const res = await axios.post("https://mim-backend-b5cd.onrender.com/add", payload);

      if (res.data.success) {
        toast.success("✅ Complaint submitted successfully!");
        setFormData((prev) => ({ ...prev, complaint: "" }));
      } else {
        toast.error(res.data.message || "Failed to submit complaint.");
      }
    } catch (error) {
      console.error("❌ Complaint submission error:", error);
      toast.error("Server error while submitting complaint.");
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.admissionNumber) {
        toast.error("❌ User session missing! Please log in again.");
        navigate("/login");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("❌ New password and confirm password do not match!");
        return;
      }
      if (passwordData.newPassword.length < 6) {
        toast.warning("⚠️ Password must be at least 6 characters long!");
        return;
      }

      const res = await axios.put("https://mim-backend-b5cd.onrender.com/update-password", {
        admissionNumber: user.admissionNumber,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (res.data.success) {
        toast.success("✅ Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          setPasswordDialogOpen(false);
        }, 1200);
      } else {
        toast.error(res.data.message || "⚠️ Password update failed.");
      }
    } catch (err) {
      console.error("❌ Password change error:", err);
      toast.error(
        err.response?.data?.message || "Server error. Please try again later."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    toast.success("✅ Logged out successfully!");

    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handlePasswordDialogOpen = () => {
    setPasswordDialogOpen(true);
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleLogoutDialogOpen = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutDialogClose = () => {
    setLogoutDialogOpen(false);
  };

  // ✅ ============== UI COMPONENTS ==============

  // 📅 Display ALL locked dates
  const LockedDatesDisplay = () => {
    if (lockedDates.length === 0) return null;
    
    // Get only upcoming dates
    const upcomingDates = lockedDates
      .filter(date => date >= today)
      .sort();
    
    if (upcomingDates.length === 0) return null;
    
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 2, 
          mt: 2, 
          bgcolor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color="#dc2626" gutterBottom>
          🚫 BLOCKED DATES - Cannot Select
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {upcomingDates.slice(0, 12).map((date, index) => (
            <Chip
              key={index}
              label={formatDate(date)}
              size="small"
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                fontWeight: 600,
                '&:hover': { bgcolor: '#dc2626' }
              }}
            />
          ))}
          {upcomingDates.length > 12 && (
            <Chip
              label={`+${upcomingDates.length - 12} more`}
              size="small"
              sx={{
                bgcolor: '#6b7280',
                color: 'white',
                fontWeight: 600
              }}
            />
          )}
        </Box>
        <Typography variant="caption" color="#dc2626" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
          ⚠️ These dates already have mess cut requests and CANNOT be selected
        </Typography>
      </Paper>
    );
  };

  // 📊 Date status chips
  const DateStatusChips = () => {
    const chips = [];
    
    if (formData.leavingDate) {
      if (isWeekend(formData.leavingDate)) {
        chips.push({ label: "Weekend", color: "#f59e0b" });
      }
      if (isHoliday(formData.leavingDate)) {
        chips.push({ label: "Holiday", color: "#3b82f6" });
      }
      if (isDateLocked(formData.leavingDate)) {
        chips.push({ label: "🔴 ALREADY BOOKED", color: "#ef4444" });
      }
    }
    
    if (formData.leavingDate && formData.returningDate) {
      const lockedCount = getLockedDatesInRange(formData.leavingDate, formData.returningDate).length;
      if (lockedCount > 0) {
        chips.push({ 
          label: `🔴 ${lockedCount} DATE${lockedCount > 1 ? 'S' : ''} BLOCKED`, 
          color: "#dc2626" 
        });
      }
      
      // Days count
      if (!isAnyDateLockedInRange(formData.leavingDate, formData.returningDate)) {
        const [leaveYear, leaveMonth, leaveDay] = formData.leavingDate.split('-').map(Number);
        const [returnYear, returnMonth, returnDay] = formData.returningDate.split('-').map(Number);
        
        const leave = new Date(leaveYear, leaveMonth - 1, leaveDay);
        const ret = new Date(returnYear, returnMonth - 1, returnDay);
        
        const days = Math.ceil((ret - leave) / (1000 * 60 * 60 * 24)) + 1;
        chips.push({ label: `${days} Day${days > 1 ? 's' : ''}`, color: "#10b981" });
      }
    }
    
    if (chips.length === 0) return null;
    
    return (
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {chips.map((chip, index) => (
          <Chip
            key={index}
            label={chip.label}
            size="small"
            sx={{
              bgcolor: chip.color,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem'
            }}
          />
        ))}
      </Box>
    );
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2, color: "#00bfa6", fontWeight: 700 }}>
        MIM Portal
      </Typography>
      <List>
        <ListItem button onClick={handleLogoutDialogOpen}>
          <LogoutIcon sx={{ mr: 1, fontSize: "1.2rem", color: "#ef4444" }} />
          <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
        </ListItem>
        <ListItem button onClick={handlePasswordDialogOpen}>
          <LockResetIcon sx={{ mr: 1, fontSize: "1.2rem", color: "#00bfa6" }} />
          <ListItemText primary="Change Password" primaryTypographyProps={{ fontWeight: 600 }} />
        </ListItem>
      </List>
    </Box>
  );

  // ✅ ============== RENDER ==============

  return (
    <Box
      sx={{
        fontFamily: "'Inter', 'Poppins', sans-serif",
        bgcolor: "#f8fafc",
        minHeight: "100vh",
        color: "#1e293b",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          bgcolor: "white",
          color: "#1e293b",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={{
              background: "linear-gradient(135deg, #00bfa6 0%, #009688 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            MIM
          </Typography>

          {isMobile ? (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ color: "#64748b" }}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box display="flex" gap={3} alignItems="center">
              <Button
                startIcon={<LockResetIcon />}
                onClick={handlePasswordDialogOpen}
                sx={{
                  color: "#64748b",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { color: "#00bfa6" },
                }}
              >
                Change Password
              </Button>
              <Button
                startIcon={<LogoutIcon />}
                onClick={handleLogoutDialogOpen}
                sx={{
                  color: "#64748b",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { color: "#ef4444" },
                }}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: 240 },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: { xs: 3, md: 5 }, mb: 6, px: { xs: 2, sm: 3 }, flex: 1 }}>
        
        {/* Welcome Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card
            sx={{
              mb: 4,
              background: "linear-gradient(135deg, #00bfa6 0%, #009688 100%)",
              color: "white",
              borderRadius: 3,
              boxShadow: "0 4px 12px rgba(0, 191, 166, 0.2)",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Welcome, {formData.name || "Student"} 
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                Manage your mess cut permissions & complaints
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        <Grid container spacing={3}>
          
          {/* Student Details Card */}
          <Grid item xs={12} lg={4}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  height: "100%",
                }}
              >
                <Box display="flex" alignItems="center" mb={3}>
                  <PersonIcon sx={{ color: "#00bfa6", mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" fontWeight={700}>
                    Student Details
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Admission No."
                      value={formData.admissionNo}
                      fullWidth
                      size="small"
                      disabled
                      InputProps={{ sx: { fontWeight: 600 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Full Name"
                      value={formData.name}
                      fullWidth
                      size="small"
                      disabled
                      InputProps={{ sx: { fontWeight: 600 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Room No."
                      value={formData.roomNo}
                      fullWidth
                      size="small"
                      disabled
                      InputProps={{ sx: { fontWeight: 600 } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>

          {/* Mess Cut Form */}
          <Grid item xs={12} lg={8}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  background: "white",
                }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <EventIcon sx={{ color: "#00bfa6", mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" fontWeight={700}>
                    Mess Cut Permission
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ mb: 3, color: "#64748b", fontSize: "0.875rem" }}>
                  Permission requested here is just for mess cut only. Permission to leave and enter
                  hostel should be sought separately via proper channel.
                  <br />
                  <Box component="span" fontWeight={700} color="#00bfa6" sx={{ mt: 1, display: 'block' }}>
                    📞 For further enquiry: 9446047155
                  </Box>
                </Typography>

                <Grid container spacing={2}>
                  
                  {/* LEAVING DATE - With immediate lock check */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="leavingDate"
                      label="Leaving Date"
                      type="date"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formData.leavingDate}
                      onChange={handleChange}
                      inputProps={{
                        min: today,
                      }}
                      error={isDateLocked(formData.leavingDate)}
                      helperText={
                        isDateLocked(formData.leavingDate)
                          ? `🔴 ${formatDate(formData.leavingDate)} is ALREADY BOOKED!`
                          : ""
                      }
                      sx={{
                        '& .MuiFormHelperText-root': {
                          color: '#ef4444',
                          fontWeight: 600
                        }
                      }}
                    />
                  </Grid>
                  
                  {/* LEAVING TIME - Disabled if date is locked */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="leavingTime"
                      label="Leaving Time"
                      select
                      fullWidth
                      size="small"
                      value={formData.leavingTime}
                      onChange={handleChange}
                      disabled={!formData.leavingDate || isDateLocked(formData.leavingDate)}
                    >
                      <MenuItem value="">Select Leaving Time</MenuItem>
                      {(isHoliday(formData.leavingDate) || isWeekend(formData.leavingDate)) && (
                        <MenuItem value="Morning (6AM TO 8AM)">
                          🌅 Morning (6AM - 8AM)
                        </MenuItem>
                      )}
                      {formData.leavingDate && !isDateLocked(formData.leavingDate) && (
                        <MenuItem value="Evening (4PM TO 6PM)">
                          🌆 Evening (4PM - 6PM)
                        </MenuItem>
                      )}
                    </TextField>
                  </Grid>
                  
                  {/* RETURNING DATE - With full range lock check */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="returningDate"
                      label="Returning Date"
                      type="date"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={formData.returningDate}
                      onChange={handleChange}
                      inputProps={{
                        min: formData.leavingDate || today,
                      }}
                      disabled={!formData.leavingDate || isDateLocked(formData.leavingDate)}
                      error={formData.returningDate && isAnyDateLockedInRange(
                        formData.leavingDate, 
                        formData.returningDate
                      )}
                      helperText={
                        formData.returningDate && isAnyDateLockedInRange(
                          formData.leavingDate, 
                          formData.returningDate
                        )
                          ? `🔴 ${getLockedDatesInRange(formData.leavingDate, formData.returningDate).length} dates in this range are ALREADY BOOKED!`
                          : ""
                      }
                      sx={{
                        '& .MuiFormHelperText-root': {
                          color: '#ef4444',
                          fontWeight: 600
                        }
                      }}
                    />
                  </Grid>
                  
                  {/* RETURNING TIME */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="returningTime"
                      label="Returning Time"
                      select
                      fullWidth
                      size="small"
                      value={formData.returningTime}
                      onChange={handleChange}
                      disabled={!formData.returningDate}
                    >
                      <MenuItem value="">Select Time</MenuItem>
                      <MenuItem value="Morning (6AM TO 8AM)">🌅 Morning (6AM - 8AM)</MenuItem>
                      <MenuItem value="Evening (4PM TO 6PM)">🌆 Evening (4PM - 6PM)</MenuItem>
                    </TextField>
                  </Grid>
                  
                  {/* REASON */}
                  <Grid item xs={12}>
                    <TextField
                      name="reason"
                      label="Reason for Mess Cut"
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="Please provide a valid reason for your request..."
                    />
                  </Grid>
                </Grid>

                {/* Date Status Chips */}
                <DateStatusChips />

                {/* LOCKED DATES DISPLAY - Shows all blocked dates */}
                <LockedDatesDisplay />

                {/* Action Buttons */}
                <Box mt={4} display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#00bfa6",
                      textTransform: "none",
                      fontWeight: 700,
                      px: 4,
                      py: 1,
                      "&:hover": { bgcolor: "#009688" },
                      "&:disabled": {
                        bgcolor: "#94a3b8",
                      }
                    }}
                    onClick={handleMesscutSubmit}
                    disabled={
                      !formData.leavingDate || 
                      !formData.leavingTime || 
                      !formData.returningDate || 
                      !formData.returningTime || 
                      !formData.reason.trim() ||
                      isDateLocked(formData.leavingDate) ||
                      isDateLocked(formData.returningDate) ||
                      isAnyDateLockedInRange(formData.leavingDate, formData.returningDate)
                    }
                  >
                    ✅ Submit Request
                  </Button>

                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: "#64748b",
                      color: "#64748b",
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: "#00bfa6",
                        color: "#00bfa6",
                      },
                    }}
                    onClick={() => setOpenModal(true)}
                  >
                    📋 View Requests
                  </Button>

                  <StudentViewRequestModal
                    open={openModal}
                    handleClose={() => setOpenModal(false)}
                  />
                  
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: "#64748b",
                      color: "#64748b",
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: "#00bfa6",
                        color: "#00bfa6",
                      },
                    }}
                    onClick={() => setOpenApology(true)}
                  >
                    📝 Apology View
                  </Button>

                  <ApologyViewModal
                    open={openApology}
                    handleClose={() => setOpenApology(false)}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<CalendarMonthIcon />}
                    sx={{
                      borderColor: "#00bfa6",
                      color: "#00bfa6",
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        bgcolor: "rgba(0,191,166,0.08)",
                        borderColor: "#009688",
                      },
                    }}
                    onClick={() => setOpenOneDayOuting(true)}
                  >
                    One-Day Outing
                  </Button>
                  
                  <OneDayOutingRequestModal
                    open={openOneDayOuting}
                    onClose={() => setOpenOneDayOuting(false)}
                  />
                </Box>
              </Paper>
            </motion.div>
          </Grid>

          {/* Fee Summary */}
          <Grid item xs={12}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  background: "white",
                }}
              >
                <Box display="flex" alignItems="center" mb={3}>
                  <PaymentIcon sx={{ color: "#00bfa6", mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" fontWeight={700}>
                    Fee Summary
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card
                      sx={{
                        bgcolor: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: 3,
                      }}
                    >
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography variant="body2" sx={{ color: "#15803d", fontWeight: 700 }} gutterBottom>
                          Advance Paid
                        </Typography>
                        <Typography variant="h4" sx={{ color: "#16a34a", fontWeight: 800 }}>
                          ₹{feeData?.totalPaid ?? 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card
                      sx={{
                        bgcolor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: 3,
                      }}
                    >
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography variant="body2" sx={{ color: "#b91c1c", fontWeight: 700 }} gutterBottom>
                          Total Fee Due
                        </Typography>
                        <Typography variant="h4" sx={{ color: "#dc2626", fontWeight: 800 }}>
                          ₹{feeData?.totalDue ?? 0}
                        </Typography>
                        {feeData.totalDue >= 10000 && (
                          <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 700, mt: 1, display: 'block' }}>
                            ⚠️ Mess cut BLOCKED - Clear dues
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>

          {/* Complaint Form */}
          <Grid item xs={12}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  background: "white",
                }}
              >
                <Box display="flex" alignItems="center" mb={3}>
                  <ComplaintIcon sx={{ color: "#00bfa6", mr: 1, fontSize: 28 }} />
                  <Typography variant="h6" fontWeight={700}>
                    Submit Complaint
                  </Typography>
                </Box>

                <TextField
                  name="complaint"
                  label="Describe your complaint..."
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.complaint}
                  onChange={handleChange}
                  sx={{ mb: 3 }}
                />

                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#00bfa6",
                      textTransform: "none",
                      fontWeight: 700,
                      px: 4,
                      "&:hover": { bgcolor: "#009688" },
                    }}
                    onClick={handleComplaintSubmit}
                  >
                    Submit Complaint
                  </Button>

                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: "#64748b",
                      color: "#64748b",
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: "#00bfa6",
                        color: "#00bfa6",
                      },
                    }}
                    onClick={() => setOpenComplaintView(true)}
                  >
                    View Complaints
                  </Button>

                  <ComplaintViewModal
                    open={openComplaintView}
                    handleClose={() => setOpenComplaintView(false)}
                  />
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handlePasswordDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <LockResetIcon sx={{ color: "#00bfa6", mr: 1 }} />
            <Typography variant="h6" fontWeight={700}>
              Change Password
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              name="currentPassword"
              label="Current Password"
              type="password"
              fullWidth
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              sx={{ mb: 3 }}
            />
            <TextField
              name="newPassword"
              label="New Password"
              type="password"
              fullWidth
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              sx={{ mb: 3 }}
              helperText="Password must be at least 6 characters long"
            />
            <TextField
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              fullWidth
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose} sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            sx={{
              bgcolor: "#00bfa6",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#009688" },
            }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onClose={handleLogoutDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <LogoutIcon sx={{ color: "#ef4444", mr: 1 }} />
            <Typography variant="h6" fontWeight={700}>
              Confirm Logout
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography fontWeight={500}>
            Are you sure you want to logout from your account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutDialogClose} sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            sx={{
              bgcolor: "#ef4444",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#dc2626" },
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: "#000000",
          color: "white",
          width: "100%",
          mt: "auto",
          pt: { xs: 5, md: 6 },
          pb: { xs: 4, md: 5 },
          borderTop: "2px solid #00bfa6",
        }}
      >
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Box textAlign="center" sx={{ mb: 3, px: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: "linear-gradient(90deg, #00bfa6 0%, #00acc1 50%, #00bfa6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1
                }}
              >
                JCS@JECC
              </Typography>

              <Typography variant="body2" sx={{ color: "#f1f5f9", maxWidth: 700, mx: "auto", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Marian Information Management System (MIM Portal) — developed to
                simplify and unify student, hostel, and mess data management at{" "}
                <Box component="span" sx={{ fontWeight: 700, color: "#00bfa6" }}>
                  Jyothi Engineering College
                </Box>
                .
              </Typography>
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", width: "60%", mx: "auto", my: 3 }} />

            <Box textAlign="center">
              <Typography variant="body2" sx={{ fontWeight: 600, color: "white", letterSpacing: 0.2 }}>
                © {new Date().getFullYear()} All Rights Reserved —{" "}
                <Box component="span" sx={{ color: "#00bfa6", fontWeight: 700 }}>
                  JCS@JECC
                </Box>{" "}
                | Marian Information Management System
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </Box>
  );
};

export default UserForm;