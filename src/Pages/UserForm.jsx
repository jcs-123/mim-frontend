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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReceiptIcon from "@mui/icons-material/Receipt";
import StudentViewRequestModal from "../Components/StudentViewRequestModal";
import ApologyViewModal from "../Components/ApologyViewModal";
import { useNavigate } from "react-router-dom"
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

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
const navigate = useNavigate();
const [openComplaintView, setOpenComplaintView] = useState(false);
const today = new Date().toISOString().split("T")[0];
const [holidays, setHolidays] = useState([]);
const isHoliday = holidays.includes(formData.leavingDate);

const [feeData, setFeeData] = useState({
  totalFee: 0,
  totalPaid: 0,
  totalDue: 0,
});
useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  if (!storedUser?.admissionNumber) {
    console.warn("Admission number not found for fee fetch");
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

        console.log("✅ Fee data loaded:", res.data.data);
      } else {
        toast.error("Fee data not found");
      }
    } catch (error) {
      console.error("❌ Error fetching fee data:", error);
      // toast.error("Unable to fetch fee details");
    }
  };

  fetchFeeData();
}, []);

useEffect(() => {
  const fetchHolidays = async () => {
    try {
      const res = await axios.get(
        "https://mim-backend-b5cd.onrender.com/api/holiday/all"
      );

      if (res.data.success) {
        // store only date strings (yyyy-mm-dd)
        const holidayDates = res.data.data.map(
          (h) => h.date.split("T")[0]
        );
        setHolidays(holidayDates);
      }
    } catch (err) {
      console.error("❌ Error fetching holidays:", err);
    }
  };

  fetchHolidays();
}, []);

const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => {
    if (name === "leavingDate") {
      return {
        ...prev,
        leavingDate: value,
        leavingTime: "",
        returningTime: "",
      };
    }

    return {
      ...prev,
      [name]: value, // ✅ simple update
    };
  });
};



  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

const handleMesscutSubmit = async () => {

  // 🔍 CHECK REQUIRED FIELDS BEFORE SENDING TO SERVER
  if (
    !formData.leavingDate ||
    !formData.leavingTime ||
    !formData.returningDate ||
    !formData.returningTime ||
    !formData.reason
  ) {
    toast.warning(" All fields are required!");
    return; // ❌ STOP HERE — DO NOT CALL SERVER
  }

  try {
    const res = await axios.post("https://mim-backend-b5cd.onrender.com/adddetail", formData);

    if (res.data.success) {
      toast.success("✅ Mess cut request submitted!");

      setFormData((prev) => ({
        ...prev,
        leavingDate: "",
        leavingTime: "",
        returningDate: "",
        returningTime: "",
        reason: "",
      }));
    } else {
      toast.error(res.data.message || "Submission failed!");
    }
  } catch (err) {
    console.error("❌ Error submitting messcut:", err);
    toast.error("Server error, please try again later.");
  }
};


const handleComplaintSubmit = async () => {
  try {
    if (!formData.complaint.trim()) {
      toast.warning("⚠️ Please enter your complaint before submitting!");
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
      toast.error("❌ User session missing! Please log in again.", { theme: "colored" });
      navigate("/login");
      return;
    }

    // 🔹 Basic client-side validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("❌ New password and confirm password do not match!", { theme: "colored" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.warning("⚠️ Password must be at least 6 characters long!", { theme: "colored" });
      return;
    }

    // 🔹 Send to backend
    const res = await axios.put("https://mim-backend-b5cd.onrender.com/update-password", {
      admissionNumber: user.admissionNumber,
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
    });

    if (res.data.success) {
      toast.success("✅ Password changed successfully!", { theme: "colored" });
      console.log("Password Data:", passwordData);

      // Optional: clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Close modal after delay
      setTimeout(() => {
        setPasswordDialogOpen(false);
      }, 1200);
    } else {
      toast.error(res.data.message || "⚠️ Password update failed.", { theme: "colored" });
    }
  } catch (err) {
    console.error("❌ Password change error:", err);
    toast.error(
      err.response?.data?.message || "Server error. Please try again later.",
      { theme: "colored" }
    );
  }
};
// 🔹 Fetch student details when page loads
useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (!storedUser?.admissionNumber) {
    toast.error("⚠️ User session expired. Please log in again.", { theme: "colored" });
    navigate("/login");
    return;
  }

  // ✅ Fetch fresh details from backend
  axios
    .get("https://mim-backend-b5cd.onrender.com/user", {
      params: { admissionNumber: storedUser.admissionNumber },
    })
    .then((res) => {
      if (res.data.success) {
        const data = res.data.data;

        setFormData((prev) => ({
          ...prev,
          admissionNo: data.admissionNumber || "",
          name: data.name || "",
          roomNo: data.roomNo || "",
        }));

        // Store updated user details if needed
        localStorage.setItem("user", JSON.stringify(data));

        // toast.success(`✅ Welcome ${data.name}`, { autoClose: 1000, theme: "colored" });
        console.log("✅ User loaded:", data);
      } else {
        toast.error("❌ Unable to fetch user details.", { theme: "colored" });
      }
    })
    .catch((err) => {
      console.error("❌ Error fetching user:", err);
      toast.error("Server error while fetching details.", { theme: "colored" });
    });
}, [navigate]);


const handleLogout = () => {
  // 1️⃣ Clear local storage
  localStorage.removeItem("user");
  localStorage.removeItem("role");

  // 2️⃣ Show toast
  toast.success("✅ Logged out successfully!", {
    position: "top-right",
    autoClose: 2000,
    theme: "colored",
  });

  console.log("User logged out and session cleared");

  // 3️⃣ Redirect after short delay (so toast is visible)
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

  const getStatusChip = (status) => {
    return status === "Paid" ? 
      <Chip label="Paid" color="success" size="small" /> : 
      <Chip label="Pending" color="warning" size="small" />;
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2, color: "#00bfa6" }}>
        MIM Portal
      </Typography>
      <List>
        <ListItem button onClick={handleLogoutDialogOpen}>
          <LogoutIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
          <ListItemText primary="Logout" />
        </ListItem>
        <ListItem button onClick={handlePasswordDialogOpen}>
          <LockResetIcon sx={{ mr: 1, fontSize: "1.2rem" }} />
          <ListItemText primary="Change Password" />
        </ListItem>
      </List>
    </Box>
  );

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
      {/* ---------- Modern Header ---------- */}
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
            fontWeight={700}
            sx={{
              background: "linear-gradient(135deg, #00bfa6 0%, #009688 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            MIM
          </Typography>

          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
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
                  fontWeight: 500,
                  "&:hover": {
                    color: "#00bfa6",
                    backgroundColor: "rgba(0, 191, 166, 0.04)",
                  },
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
                  fontWeight: 500,
                  "&:hover": {
                    color: "#ef4444",
                    backgroundColor: "rgba(239, 68, 68, 0.04)",
                  },
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
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
        }}
      >
        {drawer}
      </Drawer>

      {/* ---------- Main Content ---------- */}
      <Container maxWidth="lg" sx={{ mt: { xs: 3, md: 5 }, mb: 6, px: { xs: 2, sm: 3 }, flex: 1 }}>
        {/* Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
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
         <Typography variant="h5" fontWeight={600} gutterBottom>
  Welcome, {formData.name || "Student"} 
</Typography>

              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage your mess cut permissions, complaints
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        <Grid container spacing={3}>
          {/* Student Details Card */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
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
                  <PersonIcon sx={{ color: "#00bfa6", mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Student Details
                  </Typography>
                </Box>
                
<Grid
  container
  spacing={2}
  sx={{
    "& .MuiInputBase-root": {
      backgroundColor: "white",
      color: "black", // ✅ text color black
      borderRadius: "8px",
    },
    "& .MuiInputLabel-root": {
      color: "#475569", // subtle label color
      fontWeight: 500,
    },
    "& .Mui-disabled": {
      WebkitTextFillColor: "black", // ✅ force disabled text black
      opacity: 1, // make it fully visible
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#cbd5e1", // light gray border
    },
    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#00bfa6", // mint green on hover
    },
  }}
>
  <Grid item xs={12}>
    <TextField
      label="Admission No."
      value={formData.admissionNo}
      fullWidth
      size="small"
      disabled
    />
  </Grid>
  <Grid item xs={12}>
    <TextField
      label="Full Name"
      value={formData.name}
      fullWidth
      size="small"
      disabled
    />
  </Grid>
  <Grid item xs={12}>
    <TextField
      label="Room No."
      value={formData.roomNo}
      fullWidth
      size="small"
      disabled
    />
  </Grid>
</Grid>


              </Paper>
            </motion.div>
          </Grid>

          {/* Mess Cut Permission Form */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
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
                  <EventIcon sx={{ color: "#00bfa6", mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Mess Cut Permission
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ mb: 3, color: "gray", fontSize: "0.875rem" }}>
                  Permission requested here is just for mess cut only. Permission to leave and enter
                  hostel should be sought separately via proper channel.
                  <br />
                  <Box component="span" fontWeight={600} color="#00bfa6">
                    For further enquiry: 9446047155
                  </Box>
                </Typography>

                <Grid container spacing={2}>
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
    min: today,   // ✅ BLOCK PAST DATES
  }}
/>

                  </Grid>
                  <Grid item xs={12} sm={6}>
<TextField
  name="leavingTime"
  label="Leaving Time"
  select
  fullWidth
  size="small"
  value={formData.leavingTime}
  onChange={handleChange}
  disabled={!formData.leavingDate}
>
  <MenuItem value="">Select Leaving Time</MenuItem>

  {isHoliday && (
    <MenuItem key="morning" value="Morning (6AM TO 8AM)">
      Morning (6AM TO 8AM)
    </MenuItem>
  )}

  {formData.leavingDate && (
    <MenuItem key="evening" value="Evening (4PM TO 6PM)">
      Evening (4PM TO 6PM)
    </MenuItem>
  )}
</TextField>




                  </Grid>
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
    min: formData.leavingDate || today, // ✅ AFTER LEAVING DATE
  }}
/>

                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="returningTime"
                      label="Returning Time"
                      select
                      fullWidth
                      size="small"
                      value={formData.returningTime}
                      onChange={handleChange}
                    >
                      <MenuItem value="">Select Time</MenuItem>
                      <MenuItem value="Morning (6AM TO 8AM)">Morning(6AM TO 8AM)</MenuItem>
                      <MenuItem value="Evening (4PM TO 6PM)">Evening(4PM TO 6PM)</MenuItem>
                    </TextField>
                  </Grid>
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
                    />
                  </Grid>
                </Grid>

                <Box mt={4} display="flex" gap={2} flexWrap="wrap">
                <Button
  variant="contained"
  sx={{
    bgcolor: "#00bfa6",
    textTransform: "none",
    fontWeight: 600,
    px: 3,
    "&:hover": { bgcolor: "#009688" },
  }}
  onClick={handleMesscutSubmit}
>
  Submit Request
</Button>

                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: "#64748b",
                      color: "#64748b",
                      textTransform: "none",
                      fontWeight: 500,
                      "&:hover": {
                        borderColor: "#00bfa6",
                        color: "#00bfa6",
                      },
                    }}
                    onClick={() => setOpenModal(true)}
                  >
                    View Requests
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
                      fontWeight: 500,
                      "&:hover": {
                        borderColor: "#00bfa6",
                        color: "#00bfa6",
                      },
                    }}
                    onClick={() => setOpenApology(true)}
                  >
                    Apology View
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

      {/* Payment Summary */}
{/* Payment Summary */}
<Grid item xs={12}>
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
  >
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
        <PaymentIcon sx={{ color: "#00bfa6", mr: 1 }} />
        <Typography variant="h6" fontWeight={600}>
          Fee Summary
        </Typography>
      </Box>

      <Grid container spacing={3}>
       

{/* ADVANCE / PAID */}
<Grid item xs={12} md={4}>
  <Card
    sx={{
      bgcolor: "#f0fdf4",          // light green
      border: "1px solid #86efac", // green border
      borderRadius: 3,
    }}
  >
    <CardContent sx={{ textAlign: "center" }}>
      <Typography
        variant="body2"
        sx={{ color: "#15803d", fontWeight: 600 }} // dark green
        gutterBottom
      >
        Advance
      </Typography>

      <Typography
        variant="h4"
        sx={{ color: "#16a34a", fontWeight: 700 }} // strong green
      >
        ₹{feeData?.totalPaid ?? 0}
      </Typography>
    </CardContent>
  </Card>
</Grid>

{/* TOTAL DUE */}
<Grid item xs={12} md={4}>
  <Card
    sx={{
      bgcolor: "#fef2f2",          // light red
      border: "1px solid #fecaca", // red border
      borderRadius: 3,
    }}
  >
    <CardContent sx={{ textAlign: "center" }}>
      <Typography
        variant="body2"
        sx={{ color: "#b91c1c", fontWeight: 600 }} // dark red
        gutterBottom
      >
        Total Fee Due
      </Typography>

      <Typography
        variant="h4"
        sx={{ color: "#dc2626", fontWeight: 700 }} // strong red
      >
        ₹{feeData?.totalDue ?? 0}
      </Typography>
    </CardContent>
  </Card>
</Grid>

      </Grid>
    </Paper>
  </motion.div>
</Grid>



          {/* Complaint Form */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
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
                  <ComplaintIcon sx={{ color: "#00bfa6", mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
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
    fontWeight: 600,
    px: 3,
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
    fontWeight: 500,
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

  

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={handlePasswordDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <LockResetIcon sx={{ color: "#00bfa6", mr: 1 }} />
            <Typography variant="h6" fontWeight={600}>
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
          <Button 
            onClick={handlePasswordDialogClose}
            sx={{ 
              textTransform: "none",
              color: "#64748b"
            }}
          >
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
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutDialogClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <LogoutIcon sx={{ color: "#ef4444", mr: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              Confirm Logout
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to logout from your account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleLogoutDialogClose}
            sx={{ 
              textTransform: "none",
              color: "#64748b"
            }}
          >
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

      {/* ---------- Full Width Footer ---------- */}
          <Box
      component="footer"
      sx={{
        bgcolor: "#000000", // pure black background
        color: "white",
        width: "100%",
        mt: "auto",
        pt: { xs: 5, md: 6 },
        pb: { xs: 4, md: 5 },
        boxShadow: "0 -2px 10px rgba(0,0,0,0.4)",
        borderTop: "2px solid #00bfa6",
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 🔹 Main Title & Description */}
          <Box textAlign="center" sx={{ mb: 3, px: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.6,
                background:
                  "linear-gradient(90deg, #00bfa6 0%, #00acc1 50%, #00bfa6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              JCS@JECC
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#f1f5f9",
                maxWidth: 700,
                mx: "auto",
                mt: 1,
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              Marian Information Management System (MIM Portal) — developed to
              simplify and unify student, hostel, and mess data management at{" "}
              <Box component="span" sx={{ fontWeight: 600, color: "#00bfa6" }}>
                Jyothi Engineering College
              </Box>
              .
            </Typography>
          </Box>

          {/* 🔹 Divider */}
          <Divider
            sx={{
              borderColor: "rgba(255,255,255,0.15)",
              width: "60%",
              mx: "auto",
              my: 3,
            }}
          />

          {/* 🔹 Footer Bottom Text */}
          <Box textAlign="center" sx={{ opacity: 0.9 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "white",
                letterSpacing: 0.2,
              }}
            >
              © {new Date().getFullYear()} All Rights Reserved —{" "}
              <Box component="span" sx={{ color: "#00bfa6", fontWeight: 600 }}>
                JCS@JECC
              </Box>{" "}
              | Marian Information Management System
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
      <ToastContainer position="top-right" autoClose={1000} />

    </Box>
  );
};

export default UserForm;