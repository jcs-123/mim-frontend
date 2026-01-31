import React, { useState } from "react";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress,
} from "@mui/material";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function AILogin() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    admissionNumber: "",
    password: "",
  });
  const navigate = useNavigate();
  const API_URL = "https://mim-backend-b5cd.onrender.com";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, formData);
      if (res.data.success && res.data.data) {
        const user = res.data.data;
        const role = user.Role || "User";
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", role);
        toast.success(` Welcome back, ${user.name}!`, {
          position: "top-right",
          autoClose: 2000,
          theme: "colored",
        });
        setTimeout(() => {
          if (role.toLowerCase() === "student") navigate("/userform");
          else navigate("/dashboard");
        }, 1000);
      } else {
        toast.error("❌ Invalid credentials", {
          position: "top-right",
          autoClose: 2500,
          theme: "colored",
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Try again.", {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        background:
          "radial-gradient(circle at 20% 20%, #0a192f 0%, #020c1b 80%)",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ✨ Animated gradient particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: 80 + Math.random() * 80,
            height: 80 + Math.random() * 80,
            borderRadius: "50%",
            background:
              i % 2
                ? "radial-gradient(circle, rgba(0,255,255,0.2), transparent 70%)"
                : "radial-gradient(circle, rgba(100,255,218,0.15), transparent 70%)",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            zIndex: 0,
          }}
          animate={{
            y: [0, 30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main Container */}
      <Container
        maxWidth="xs"
        sx={{
          position: "relative",
          zIndex: 2,
          px: { xs: 3, sm: 2 },
        }}
      >
        <ToastContainer />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Paper
            elevation={10}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              textAlign: "center",
              background: "rgba(10,25,47,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,255,255,0.25)",
              boxShadow: "0 0 35px rgba(0,255,255,0.25)",
              color: "#fff",
            }}
          >
            {/* 🧠 Logo / Eye Animation */}
           

            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{
                mt: 3,
                color: "#64ffda",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Marian Information Manager
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "#aee4e4" }}>
              Jyothi Engineering College
            </Typography>

            {/* 🔹 Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Admission Number"
                name="admissionNumber"
                fullWidth
                margin="normal"
                variant="outlined"
                value={formData.admissionNumber}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaUser color="#64ffda" />
                    </InputAdornment>
                  ),
                  style: { color: "#fff" },
                }}
                InputLabelProps={{ style: { color: "#80deea" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#00e5ff" },
                    "&:hover fieldset": { borderColor: "#64ffda" },
                  },
                }}
                required
              />

              <TextField
                label="Password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                fullWidth
                margin="normal"
                variant="outlined"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock color="#64ffda" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      >
                        {passwordVisible ? (
                          <FaEyeSlash color="#64ffda" />
                        ) : (
                          <FaEye color="#64ffda" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                  style: { color: "#fff" },
                }}
                InputLabelProps={{ style: { color: "#80deea" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#00e5ff" },
                    "&:hover fieldset": { borderColor: "#64ffda" },
                  },
                }}
                required
              />

              {/* Forgot Password */}
              <Typography
                onClick={() => navigate("/forgot-password")}
                variant="body2"
                sx={{
                  color: "#00e5ff",
                  textAlign: "right",
                  mt: 1,
                  mb: 2,
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Forgot Password?
              </Typography>

              {/* 🔘 Login Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 2,
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
                    <CircularProgress size={26} sx={{ color: "#0a192f" }} />
                  ) : (
                    "Access Portal"
                  )}
                </Button>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}

export default AILogin;
