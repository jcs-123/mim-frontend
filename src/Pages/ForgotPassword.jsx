import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

  /* 🔹 Step 1: Send OTP */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/send-otp`, { gmail: email });
      if (res.data.success) {
        toast.success("✅ OTP sent to your email!", { theme: "colored" });
        setStep(2);
      } else {
        toast.error(res.data.message || "Failed to send OTP.", { theme: "colored" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "❌ Error sending OTP.", { theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  /* 🔹 Step 2: Verify OTP */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/verify-otp`, { gmail: email, otp });
      if (res.data.success) {
        toast.success("✅ OTP verified! You can now reset your password.", { theme: "colored" });
        setStep(3);
      } else {
        toast.error(res.data.message || "❌ Invalid OTP.", { theme: "colored" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error verifying OTP.", { theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  /* 🔹 Step 3: Reset Password */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/reset-password`, {
        gmail: email,
        newPassword,
        confirmPassword,
      });

      if (res.data.success) {
        toast.success("✅ Password reset successfully!", { theme: "colored" });
        setTimeout(() => navigate("/"), 1500);
      } else {
        toast.error(res.data.message || "❌ Failed to reset password.", { theme: "colored" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error resetting password.", { theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        background: "radial-gradient(circle at 20% 20%, #0a192f, #020c1b 80%)",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        p: 2,
      }}
    >
      {/* Floating glowing particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: 100 + Math.random() * 60,
            height: 100 + Math.random() * 60,
            borderRadius: "50%",
            background:
              i % 2
                ? "radial-gradient(circle, rgba(0,255,255,0.25), transparent)"
                : "radial-gradient(circle, rgba(100,255,218,0.2), transparent)",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            zIndex: 0,
          }}
          animate={{
            y: [0, 25, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 2 }}>
        <ToastContainer position="top-center" autoClose={2000} />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Paper
            elevation={10}
            sx={{
              borderRadius: 4,
              p: { xs: 3, sm: 4 },
              textAlign: "center",
              background: "rgba(10,25,47,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,255,255,0.3)",
              boxShadow: "0 0 35px rgba(0,255,255,0.25)",
              color: "#fff",
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              sx={{
                color: "#64ffda",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Forgot Password
            </Typography>
            <Typography
              variant="body2"
              mb={3}
              sx={{ color: "#aee4e4", fontSize: "0.95rem" }}
            >
              {step === 1
                ? "Enter your registered email to receive an OTP."
                : step === 2
                ? "Enter the OTP sent to your email."
                : "Enter your new password."}
            </Typography>

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleSendOtp}>
                <TextField
                  fullWidth
                  label="Registered Email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  InputLabelProps={{ style: { color: "#80deea" } }}
                  InputProps={{
                    style: { color: "#fff" },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#00e5ff" },
                      "&:hover fieldset": { borderColor: "#64ffda" },
                    },
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 3,
                    background:
                      "linear-gradient(90deg, #00e5ff, #64ffda, #00e5ff)",
                    backgroundSize: "200% 100%",
                    color: "#0a192f",
                    fontWeight: "bold",
                    py: 1.2,
                    borderRadius: 2,
                    fontSize: "1rem",
                    transition: "0.4s ease",
                    "&:hover": {
                      backgroundPosition: "right center",
                      boxShadow: "0 0 25px #00e5ff",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "#0a192f" }} />
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <TextField
                  fullWidth
                  label="Enter OTP"
                  variant="outlined"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  InputLabelProps={{ style: { color: "#80deea" } }}
                  InputProps={{ style: { color: "#fff" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#00e5ff" },
                      "&:hover fieldset": { borderColor: "#64ffda" },
                    },
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 3,
                    background:
                      "linear-gradient(90deg, #00e5ff, #64ffda, #00e5ff)",
                    backgroundSize: "200% 100%",
                    color: "#0a192f",
                    fontWeight: "bold",
                    py: 1.2,
                    borderRadius: 2,
                    fontSize: "1rem",
                    "&:hover": {
                      backgroundPosition: "right center",
                      boxShadow: "0 0 25px #00e5ff",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "#0a192f" }} />
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
                <Button
                  fullWidth
                  sx={{
                    mt: 2,
                    color: "#64ffda",
                    fontWeight: "bold",
                    textTransform: "none",
                  }}
                  onClick={() => setStep(1)}
                >
                  ← Back to Email
                </Button>
              </form>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  label="New Password"
                  variant="outlined"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                  InputLabelProps={{ style: { color: "#80deea" } }}
                  InputProps={{
                    style: { color: "#fff" },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? (
                            <VisibilityOff sx={{ color: "#64ffda" }} />
                          ) : (
                            <Visibility sx={{ color: "#64ffda" }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  label="Confirm Password"
                  variant="outlined"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  InputLabelProps={{ style: { color: "#80deea" } }}
                  InputProps={{ style: { color: "#fff" } }}
                />
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 3,
                    background:
                      "linear-gradient(90deg, #00e5ff, #64ffda, #00e5ff)",
                    backgroundSize: "200% 100%",
                    color: "#0a192f",
                    fontWeight: "bold",
                    py: 1.2,
                    borderRadius: 2,
                    fontSize: "1rem",
                    "&:hover": {
                      backgroundPosition: "right center",
                      boxShadow: "0 0 25px #00e5ff",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: "#0a192f" }} />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
