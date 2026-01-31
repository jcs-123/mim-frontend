import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { toast } from "react-toastify";

/* ======================================================
   ONE DAY OUTING REQUEST MODAL – FINAL & CORRECT
====================================================== */
const OneDayOutingRequestModal = ({ open, onClose }) => {
  const today = new Date().toISOString().split("T")[0];

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [monthlyCount, setMonthlyCount] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentName: "",
    date: "",
    leavingTime: "",
    returningTime: "",
    reason: "",
  });

  const [requests, setRequests] = useState([]);

  /* ================= LOAD STUDENT ================= */
  useEffect(() => {
    if (!open) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.admissionNumber) {
      toast.error("Session expired. Please login again.");
      return;
    }

    setFormData({
      admissionNumber: user.admissionNumber,
      studentName: user.name || "",
      date: "",
      leavingTime: "",
      returningTime: "",
      reason: "",
    });

    fetchRequests(user.admissionNumber);
    fetchMonthlyCount(user.admissionNumber);
    fetchEligibility(user.admissionNumber);
  }, [open]);

  /* ================= FETCH REQUESTS ================= */
  const fetchRequests = async (admissionNumber) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://mim-backend-b5cd.onrender.com/outing/student/${admissionNumber}`
      );
      if (res.data.success) {
        setRequests(res.data.data || []);
      }
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  /* ================= MONTHLY COUNT ================= */
  const fetchMonthlyCount = async (admissionNumber) => {
    const now = new Date();
    const res = await axios.get("https://mim-backend-b5cd.onrender.com/outing/count", {
      params: {
        admissionNumber,
        month: now.getMonth(),
        year: now.getFullYear(),
      },
    });

    if (res.data.success) {
      setMonthlyCount(res.data.outingCount);
    }
  };

  /* ================= ELIGIBILITY CHECK ================= */
  const fetchEligibility = async (admissionNumber) => {
    try {
      setCheckingEligibility(true);

      const res = await axios.get(
        "https://mim-backend-b5cd.onrender.com/admin/outing/eligible"
      );

      const eligibleList = res.data.data || [];

      // STRICT admission number match
      const match = eligibleList.some(
        (s) =>
          String(s.admissionNumber).trim() ===
          String(admissionNumber).trim()
      );

      setIsEligible(match);
    } catch {
      setIsEligible(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  /* ================= HANDLER ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };



  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    const { date, leavingTime, returningTime, reason } = formData;

    if (!date || !leavingTime || !returningTime || !reason) {
      toast.warning("All fields are required");
      return;
    }

 

    try {
      const res = await axios.post(
        "https://mim-backend-b5cd.onrender.com/outing/request",
        formData
      );

      if (res.data.success) {
        toast.success("Outing request submitted");
        fetchRequests(formData.admissionNumber);
        fetchMonthlyCount(formData.admissionNumber);
        setTab(1);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Server error");
    }
  };

  /* ================= STATUS CHIP ================= */
  const statusChip = (status) => {
    if (status === "APPROVED")
      return <Chip label="APPROVED" color="success" size="small" />;
    if (status === "REJECTED")
      return <Chip label="REJECTED" color="error" size="small" />;
    return <Chip label="PENDING" color="warning" size="small" />;
  };

  /* ================= ELIGIBILITY BADGE ================= */
  const eligibilityBadge = () => {
    if (checkingEligibility)
      return <Chip label="Checking eligibility…" color="warning" />;

    if (isEligible)
      return <Chip label="Eligible for One-Day Outing" color="success" />;

    return <Chip label="Not Eligible for Outing" color="error" />;
  };

  /* ================= UI ================= */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <EventIcon sx={{ color: "#00bfa6", mr: 1 }} />
            <Typography fontWeight={600}>One-Day Outing</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="Request Outing" />
        <Tab label="View Requests" />
      </Tabs>
<Grid item xs={12}>
  <Typography
    variant="caption"
    sx={{
      color: "error.main",
      fontWeight: 600,
      textAlign: "center",
      display: "block",
      mt: 0.5,
    }}
  >
    Outing permitted only between 6:00 AM and 6:00 PM. Students must return before 6:00 PM.
  </Typography>
</Grid>


      <DialogContent dividers>
        {tab === 0 && (
          <Paper sx={{ p: 2 }}>
            <Box mb={2}>{eligibilityBadge()}</Box>

            {monthlyCount === 1 && (
              <Typography color="error" mb={2}>
                ❌ Monthly outing limit reached
              </Typography>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  type="date"
                  label="Outing Date"
                  name="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: today }}
                  value={formData.date}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Leaving Time (e.g. 6:00 AM)"
                  name="leavingTime"
                  fullWidth
                  value={formData.leavingTime}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Returning Time (e.g. 6:00 PM)"
                  name="returningTime"
                  fullWidth
                  value={formData.returningTime}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Reason"
                  name="reason"
                  multiline
                  rows={2}
                  fullWidth
                  value={formData.reason}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {tab === 1 && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Admission No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Admin</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No requests
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>{r.admissionNumber}</TableCell>
                      <TableCell>{r.studentName}</TableCell>
                      <TableCell>
                        {new Date(r.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{statusChip(r.parentStatus)}</TableCell>
                      <TableCell>{statusChip(r.adminStatus)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {tab === 0 && (
          <Button
            variant="contained"
            disabled={monthlyCount === 1 || !isEligible || checkingEligibility}
            onClick={handleSubmit}
            sx={{ bgcolor: "#00bfa6", fontWeight: 600 }}
          >
            Submit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OneDayOutingRequestModal;
