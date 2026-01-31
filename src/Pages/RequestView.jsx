import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Chip,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  Search,
  MoreVert,
  CheckCircle,
  Cancel,
  Visibility,
} from "@mui/icons-material";
import axios from "axios";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function RequestView() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = "https://mim-backend-b5cd.onrender.com/messcut"; // 🔧 backend base URL
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* =========================================
     🟩 Toast Config
  ========================================= */
  const toastConfig = {
    position: "top-center",
    autoClose: 1000,
    hideProgressBar: false,
    theme: "colored",
    transition: Slide,
  };

  /* =========================================
     🟩 Fetch Requests (Only Pending)
  ========================================= */
useEffect(() => {
  let mounted = true; // ✅ Prevent duplicate calls in React Strict Mode

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/all`);
      if (mounted && res.data.success) {
        // ✅ Filter only pending requests
        const pending = (res.data.data || []).filter(
          (r) => r.status === "Pending"
        );
        setRequests(pending);

        // ✅ Clear previous toasts before showing new one
        toast.dismiss();

        if (pending.length > 0) {
          toast.info(`📦 Loaded ${pending.length} pending requests`, {
            ...toastConfig,
            style: {
              background: "linear-gradient(135deg, #1565C0, #42A5F5)",
              color: "#fff",
              fontWeight: 600,
            },
          });
        } else {
          toast.warning("✅ No pending requests found", {
            ...toastConfig,
            style: {
              background: "linear-gradient(135deg, #546E7A, #90A4AE)",
              color: "#fff",
              fontWeight: 600,
            },
          });
        }
      } else if (mounted) {
        toast.dismiss();
        toast.error("❌ Failed to load requests", toastConfig);
      }
    } catch (err) {
      if (mounted) {
        console.error("❌ Fetch Error:", err);
        toast.dismiss();
        toast.error("🚨 Server connection error", toastConfig);
      }
    } finally {
      if (mounted) setLoading(false);
    }
  };

  fetchRequests();

  // ✅ Cleanup to prevent duplicate side-effects on remount
  return () => {
    mounted = false;
    toast.dismiss(); // optional: clear any lingering toast on unmount
  };
}, []);

const getParentStatusChip = (status) => {
  switch (status) {
    case "APPROVE":
      return <Chip label="Approved" color="success" size="small" />;
    case "REJECT":
      return <Chip label="Rejected" color="error" size="small" />;
    default:
      return <Chip label="Pending" color="warning" size="small" variant="outlined" />;
  }
};

  /* =========================================
     🟩 Update Status (Accept/Reject)
  ========================================= */
  const handleAction = async (id, newStatus) => {
    try {
      setActionLoading(true);
      const res = await axios.put(`${API_URL}/status/${id}`, {
        status: newStatus,
        updatedBy: "Admin",
      });

      if (res.data.success) {
        // Remove the updated request from pending list
        setRequests((prev) => prev.filter((r) => r._id !== id));

        toast.success(
          newStatus === "ACCEPT"
            ? "✅ Request Approved Successfully!"
            : "❌ Request Rejected!",
          {
            ...toastConfig,
            style: {
              background:
                newStatus === "ACCEPT"
                  ? "linear-gradient(135deg, #1B5E20, #4CAF50)"
                  : "linear-gradient(135deg, #B71C1C, #E53935)",
              color: "#fff",
              fontWeight: 600,
            },
          }
        );
      } else {
        toast.warning("⚠️ Could not update status", toastConfig);
      }
    } catch (err) {
      console.error("❌ Update Error:", err);
      toast.error("💥 Server Error! Try again later.", {
        ...toastConfig,
        style: {
          background: "linear-gradient(135deg, #880E4F, #C2185B)",
          color: "#fff",
          fontWeight: 600,
        },
      });
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================
     🟩 Filtered by Search
  ========================================= */
  const filtered = requests.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.admissionNo?.toLowerCase().includes(search.toLowerCase()) ||
      r.roomNo?.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================================
     🟩 Mobile Card View
  ========================================= */
  const MobileCard = ({ request }) => (
    <Card
      component={motion.div}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {request.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Room {request.roomNo} • {request.admissionNo}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Leave:</strong> {request.leavingDate} →{" "}
          {request.returningDate}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          <strong>Reason:</strong> {request.reason}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1.5,
          }}
        >
          <Chip label="Pending" color="warning" size="small" />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              disabled={actionLoading}
              onClick={() => handleAction(request._id, "ACCEPT")}
            >
              Accept
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              disabled={actionLoading}
              onClick={() => handleAction(request._id, "REJECT")}
            >
              Reject
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  /* =========================================
     🟩 Main Render
  ========================================= */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "#f8fafc",
          minHeight: "100vh",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <ToastContainer
          position="top-center"
          autoClose={2500}
          hideProgressBar={false}
          newestOnTop
          theme="colored"
          transition={Slide}
          style={{
            fontSize: "0.95rem",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 500,
            textAlign: "center",
          }}
        />

        {/* ===== Header ===== */}
        <Typography
          variant="h4"
          fontWeight="bold"
          textAlign="center"
          sx={{
            mb: 3,
            fontSize: { xs: "1.6rem", sm: "2.1rem" },
            background: "linear-gradient(135deg, #1e3c72, #2a5298)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Pending Messcut Requests
        </Typography>

        {/* ===== Search ===== */}
        <Grid container justifyContent="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={8} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, room or admission no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "white",
                },
              }}
            />
          </Grid>
        </Grid>

        {/* ===== Content ===== */}
        {loading ? (
          <Box textAlign="center" py={8}>
            <CircularProgress color="primary" />
          </Box>
        ) : isMobile ? (
          filtered.length > 0 ? (
            filtered.map((r) => <MobileCard key={r._id} request={r} />)
          ) : (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                No pending requests found
              </Typography>
            </Paper>
          )
        ) : (
          <Paper
            sx={{
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              overflowX: "auto",
            }}
          >
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f0f4ff" }}>
                    {[
                      "Sl.No",
                      "Room No",
                      "Student Name",
                      "Admission No",
                      "Leaving Date",
                       "Leaving Time",
                      "Returning Date",
                             "Returning Time",
                      "Reason",
                      "Parent Status",
                      "Status",
                      "Action",
                    ].map((h) => (
                      <TableCell
                        key={h}
                        align="center"
                        sx={{ fontWeight: "bold", fontSize: "0.85rem" }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map((row, index) => (
                      <TableRow
                        key={row._id}
                        sx={{
                          backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                          "&:hover": { backgroundColor: "#eef3fc" },
                        }}
                      >
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell align="center">{row.roomNo}</TableCell>
                        <TableCell align="center">{row.name}</TableCell>
                        <TableCell align="center">{row.admissionNo}</TableCell>
                        <TableCell align="center">{row.leavingDate}</TableCell>
                                                <TableCell align="center">{row.leavingTime}</TableCell>

                        <TableCell align="center">{row.returningDate}</TableCell>
                                                <TableCell align="center">{row.returningTime}</TableCell>

                        <TableCell align="center">{row.reason}</TableCell>
                            <TableCell align="center">
        {getParentStatusChip(row.parentStatus)}
      </TableCell>
                        <TableCell align="center">
                          <Chip label="Pending" color="warning" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disabled={actionLoading}
                              startIcon={<CheckCircle />}
                              onClick={() => handleAction(row._id, "ACCEPT")}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={actionLoading}
                              startIcon={<Cancel />}
                              onClick={() => handleAction(row._id, "REJECT")}
                            >
                              Reject
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No pending requests found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </motion.div>
  );
}

export default RequestView;
