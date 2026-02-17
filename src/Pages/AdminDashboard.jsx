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
  EventSeat,
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
    if (!value) {
      setCount(0);
      return;
    }

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
  }, [value, duration]);

  return count;
};

/* =====================================================
   ANIMATION
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
              labels: { usePointStyle: true, padding: 18 },
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
          <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
      </Card>
    </motion.div>
  );
};

/* =====================================================
   DATE HELPERS (STRING SAFE)
===================================================== */
const todayDate = () => new Date().toLocaleDateString("en-CA");
const tomorrowDate = () =>
  new Date(Date.now() + 86400000).toLocaleDateString("en-CA");

const normalizeDate = (d) => (d ? d.slice(0, 10) : "");

/* range check: start <= target <= end */
const isDateInRange = (target, start, end) => {
  return target >= start && target <= end;
};

/* =====================================================
   DASHBOARD
===================================================== */
const AdminDashboard = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [occupiedRooms, setOccupiedRooms] = useState(0);
  const [complaintPending, setComplaintPending] = useState(0);
  const [complaintTotal, setComplaintTotal] = useState(0);
  const [apologyPending, setApologyPending] = useState(0);

  const [messcutPending, setMesscutPending] = useState(0);
  const [leavingToday, setLeavingToday] = useState(0);
  const [returningToday, setReturningToday] = useState(0);
  const [leavingTomorrow, setLeavingTomorrow] = useState(0);
  const [returningTomorrow, setReturningTomorrow] = useState(0);
  const [messcutTomorrow, setMesscutTomorrow] = useState(0);

  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    try {
      const [
        studentsRes,
        complaintRes,
        apologyRes,
        messcutRes,
      ] = await Promise.all([
        axios.get(`${API_URL}/studentprofile/api`),
        axios.get(`${API_URL}/allcomplaint/count`),
        axios.get(`${API_URL}/count/pending`),
        axios.get(`${API_URL}/api/messcut/all-details`),
      ]);

      /* STUDENTS */
      const users = studentsRes.data?.data || [];
      const students = users.filter(
        (u) => u.Role?.toLowerCase() !== "admin"
      );

      setTotalStudents(students.length);

      const occupied = new Set(
        students
          .filter((s) => s.roomNo)
          .map((s) => s.roomNo.trim().toUpperCase())
      ).size;
      setOccupiedRooms(occupied);

      /* COMPLAINT / APOLOGY */
      setComplaintTotal(complaintRes.data?.data?.total || 0);
      setComplaintPending(complaintRes.data?.data?.pending || 0);
      setApologyPending(apologyRes.data?.data?.pending || 0);

      /* MESSCUT LOGIC (FINAL & CORRECT) */
      const messcuts = messcutRes.data?.data || [];

      const today = todayDate();
      const tomorrow = tomorrowDate();

      let pending = 0;
      let leaveToday = 0;
      let returnToday = 0;
      let leaveTomorrow = 0;
      let returnTomorrow = 0;
      let tomorrowMesscut = 0;

     messcuts.forEach((m) => {
  const status = m.status?.toUpperCase();
  const leave = normalizeDate(m.leavingDate);
  const ret = normalizeDate(m.returningDate);

  if (status === "PENDING") pending++;

  if (status === "ACCEPT") {

    // Leaving / Returning counters (keep this as it is)
    if (leave === today) leaveToday++;
    if (ret === today) returnToday++;

    if (leave === tomorrow) leaveTomorrow++;
    if (ret === tomorrow) returnTomorrow++;

    // ✅ STRICT INSIDE RANGE ONLY (not leave, not return)
    if (tomorrow > leave && tomorrow < ret) {
      tomorrowMesscut++;
    }
  }
});


      setMesscutPending(pending);
      setLeavingToday(leaveToday);
      setReturningToday(returnToday);
      setLeavingTomorrow(leaveTomorrow);
      setReturningTomorrow(returnTomorrow);
      setMesscutTomorrow(tomorrowMesscut);

    } catch (err) {
      console.error("Dashboard error:", err);
    }
  };

  /* PIE DATA */
  const pieSmall = {
    labels: ["Pending Messcut", "Complaints", "Apologies"],
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
      "Pending Complaints",
      "Pending Apologies",
      "Pending Messcut",
      "Leaving Today",
      "Returning Today",
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
    <Box sx={{ p: 4, background: "#f5f7fb", minHeight: "100vh" }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Admin Dashboard
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            Hostel & Student Overview
          </Typography>
        </Box>
        <IconButton onClick={refreshAll}>
          <Refresh />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}><StatCard title="Total Students" value={totalStudents} icon={<People />} color="#1E88E5" /></Grid>
        <Grid item xs={12} md={3}><StatCard title="Occupied Rooms" value={occupiedRooms} icon={<MeetingRoom />} color="#43A047" /></Grid>
        <Grid item xs={12} md={3}><StatCard title="Pending Complaints" value={complaintPending} icon={<BugReport />} color="#E53935" /></Grid>
        <Grid item xs={12} md={3}><StatCard title="Pending Apologies" value={apologyPending} icon={<Rule />} color="#FB8C00" /></Grid>

        <Grid item xs={12} md={3}><StatCard title="Pending Messcut" value={messcutPending} icon={<Restaurant />} color="#5E35B1" /></Grid>
        <Grid item xs={12} md={3}><StatCard title="Leaving Today" value={leavingToday} icon={<EventBusy />} color="#C2185B" /></Grid>
        <Grid item xs={12} md={3}><StatCard title="Returning Today" value={returningToday} icon={<EventAvailable />} color="#00897B" /></Grid>
        <Grid item xs={12} md={3}><StatCard title="Messcut Tomorrow" value={messcutTomorrow} icon={<EventSeat />} color="#7B1FA2" /></Grid>
      </Grid>

      <Grid container spacing={3} mt={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography fontWeight={600} mb={2}>Overall Summary</Typography>
            <PieWrapper data={pieFull} />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography fontWeight={600} mb={2}>Pending Summary</Typography>
            <PieWrapper data={pieSmall} />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
