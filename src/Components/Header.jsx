import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout,
  VpnKey,
  Person,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

function Header({ handleDrawerToggle }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const open = Boolean(anchorEl);
  const isMobile = useMediaQuery("(max-width:600px)");
  const navigate = useNavigate();

  // ✅ Load user info
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const displayName = user?.name || "Student";
  const displayEmail = user?.gmail || "user@jecc.ac.in";

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  /* 🟢 Logout */
  const handleLogout = () => {
    handleProfileMenuClose();
    localStorage.clear();
    toast.dismiss();
    toast.success("✅ Logged out successfully!", { theme: "colored" });
    setTimeout(() => navigate("/login"), 1000);
  };

  /* 🟢 Change Password (API call) */
  const handlePasswordSubmit = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    toast.dismiss();

    if (!currentPassword || !newPassword || !confirmPassword)
      return toast.warning("⚠️ Please fill all fields", { theme: "colored" });

    if (newPassword !== confirmPassword)
      return toast.error("❌ New passwords do not match", { theme: "colored" });

    if (newPassword.length < 6)
      return toast.warning("⚠️ Password must be at least 6 characters", {
        theme: "colored",
      });

    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/update-password`, {
        admissionNumber: user.admissionNumber,
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.data.success) {
        toast.success("✅ Password updated successfully!", { theme: "colored" });
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPasswordDialog(false), 1000);
      } else {
        toast.error(res.data.message || "Password update failed", { theme: "colored" });
      }
    } catch (err) {
      console.error("❌ Password update error:", err);
      toast.error("Server error while changing password", { theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <ToastContainer position="top-center" limit={1} autoClose={2000} />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: "linear-gradient(135deg, #1565C0, #42A5F5)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: { xs: 2, sm: 3 },
            }}
          >
            {/* ===== Left Section ===== */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ display: { sm: "none" } }}
              >
                <MenuIcon />
              </IconButton>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  color: "white",
                  fontSize: isMobile ? "1.1rem" : "1.4rem",
                  userSelect: "none",
                }}
              >
                MIM PORTAL
              </Typography>
            </Box>

            {/* ===== Right Section ===== */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "white",
                    color: "#1976d2",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  {displayName?.[0]?.toUpperCase() || "U"}
                </Avatar>
              </IconButton>

              {/* ===== Profile Dropdown ===== */}
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleProfileMenuClose}
                PaperProps={{
                  elevation: 4,
                  sx: {
                    mt: 1.5,
                    minWidth: 230,
                    borderRadius: 2,
                    overflow: "visible",
                    filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))",
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                {/* User Info */}
                <MenuItem disabled>
                  <ListItemIcon>
                    <Person fontSize="small" sx={{ color: "#1976d2" }} />
                  </ListItemIcon>
                  <Box>
                    <ListItemText
                      primary={displayName}
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {displayEmail}
                        </Typography>
                      }
                    />
                  </Box>
                </MenuItem>

                <Divider />

                {/* Change Password */}
                <MenuItem
                  onClick={() => {
                    handleProfileMenuClose();
                    setPasswordDialog(true);
                  }}
                >
                  <ListItemIcon>
                    <VpnKey fontSize="small" sx={{ color: "#1976d2" }} />
                  </ListItemIcon>
                  <ListItemText primary="Change Password" />
                </MenuItem>

                <Divider />

                {/* Logout */}
                <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                  <ListItemIcon>
                    <Logout fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
      </motion.div>

      {/* ===== Change Password Modal ===== */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600} color="#1565C0">
            Change Password
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Current Password"
            name="currentPassword"
            type="password"
            fullWidth
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            sx={{ mb: 2 }}
          />
          <TextField
            label="New Password"
            name="newPassword"
            type="password"
            fullWidth
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            fullWidth
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handlePasswordSubmit}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #1565C0, #42A5F5)",
              textTransform: "none",
              px: 3,
              fontWeight: 600,
              "&:hover": { background: "linear-gradient(135deg, #0d47a1, #2196f3)" },
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Header;
