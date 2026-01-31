import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  Avatar,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import {
  People,
  MeetingRoom,
  BugReport,
  Rule,
  Refresh,
  EventAvailable,
  EventBusy,
  Restaurant,
} from "@mui/icons-material";

import axios from "axios";
import { motion } from "framer-motion";

import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL =
  import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

/* =====================================================
   COUNT UP
===================================================== */
const useCountUp = (value, duration = 700) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return count;
};

/* =====================================================
   ANIMATION VARIANTS
===================================================== */
const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 },
};

/* =====================================================
   PIE WRAPPER
===================================================== */
const PieWrapper = ({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ height: isMobile ? 260 : 360 }}>
      <Pie
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: isMobile ? "bottom" : "right",
              labels: {
                usePointStyle: true,
                padding: 18,
              },
            },
          },
        }}
      />
    </Box>
  );
};

/* =====================================================
   STAT CARD
===================================================== */
const StatCard = ({ title, value, icon, color, delay }) => {
  const count = useCountUp(value);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -4 }}
    >
      <Card
        sx={{
          p: 3,
          borderRadius: 3,
          height: "100%",
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
          borderLeft: `4px solid ${color}`,
          background: "#ffffff",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700} color={color}>
              {count}
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              {title}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}15`,
              color: color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </Card>
    </motion.div>
  );
};

/* =====================================================
   DASHBOARD
===================================================== */
const AdminDashboard = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [occupiedRooms, setOccupiedRooms] = useState(0);
  const [complaintTotal, setComplaintTotal] = useState(0);
  const [complaintPending, setComplaintPending] = useState(0);
  const [apologyPending, setApologyPending] = useState(0);
  const [messcutPending, setMesscutPending] = useState(0);
  const [leavingToday, setLeavingToday] = useState(0);
  const [returningToday, setReturningToday] = useState(0);

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    const [c1, c2, c3, c4] = await Promise.all([
      axios.get(`${API_URL}/count`),
      axios.get(`${API_URL}/allcomplaint/count`),
      axios.get(`${API_URL}/count/pending`),
      axios.get(`${API_URL}/api/messcut/all-details`),
    ]);

    setTotalStudents(c1.data.totalStudents || 0);
    setOccupiedRooms(c1.data.occupiedRooms || 0);

    setComplaintTotal(c2.data.total || 0);
    setComplaintPending(c2.data.pending || 0);

    setApologyPending(c3.data.pending || 0);

    const today = new Date().toISOString().split("T")[0];
    let leave = 0,
      ret = 0;

    c4.data.data.forEach((d) => {
      if (d.status === "ACCEPT") {
        if (d.leavingDate === today) leave++;
        if (d.returningDate === today) ret++;
      }
    });

    setLeavingToday(leave);
    setReturningToday(ret);

    const pending = await axios.get(`${API_URL}/messcut/clear/count`);
    setMesscutPending(pending.data.pending || 0);
  };

  const pieSmall = {
    labels: ["Messcut", "Complaints", "Apologies"],
    datasets: [
      {
        data: [messcutPending, complaintTotal, apologyPending],
        backgroundColor: ["#5E35B1", "#1E88E5", "#FB8C00"],
      },
    ],
  };

  const pieFull = {
    labels: [
      "Students",
      "Rooms",
      "Complaints",
      "Apology",
      "Messcut",
      "Leaving",
      "Returning",
    ],
    datasets: [
      {
        data: [
          totalStudents,
          occupiedRooms,
          complaintPending,
          apologyPending,
          messcutPending,
          leavingToday,
          returningToday,
        ],
        backgroundColor: [
          "#1E88E5",
          "#43A047",
          "#E53935",
          "#FB8C00",
          "#5E35B1",
          "#C2185B",
          "#00897B",
        ],
      },
    ],
  };

  return (
    <Box sx={{ p: 4, minHeight: "100vh", background: "#f5f7fb" }}>
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Admin Dashboard
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            Hostel & Student Management Overview
          </Typography>
        </Box>
        <IconButton onClick={refreshAll}>
          <Refresh />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* TOP STATS */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={<People />}
            color="#1E88E5"
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Occupied Rooms"
            value={occupiedRooms}
            icon={<MeetingRoom />}
            color="#43A047"
            delay={0.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Complaints"
            value={complaintPending}
            icon={<BugReport />}
            color="#E53935"
            delay={0.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Apologies"
            value={apologyPending}
            icon={<Rule />}
            color="#FB8C00"
            delay={0.3}
          />
        </Grid>
      </Grid>

      {/* BOTTOM STATS */}
      <Grid container spacing={3} mt={1}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Pending Messcut"
            value={messcutPending}
            icon={<Restaurant />}
            color="#5E35B1"
            delay={0.4}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Leaving Today"
            value={leavingToday}
            icon={<EventBusy />}
            color="#C2185B"
            delay={0.5}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Returning Today"
            value={returningToday}
            icon={<EventAvailable />}
            color="#00897B"
            delay={0.6}
          />
        </Grid>
      </Grid>

      {/* CHARTS */}
      <Grid container spacing={3} mt={3}>
        <Grid item xs={12} md={6}>
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography fontWeight={600} mb={2}>
                Overall Summary
              </Typography>
              <PieWrapper data={pieFull} />
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography fontWeight={600} mb={2}>
                Complaints / Messcut / Apology
              </Typography>
              <PieWrapper data={pieSmall} />
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
