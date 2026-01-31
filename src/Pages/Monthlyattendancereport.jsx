import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { motion } from "framer-motion";
import { CalendarToday, Download } from "@mui/icons-material";

/* 🔹 Dummy student list (base data) */
const studentList = [
  { name: "AADITHYA B AJAY KRISHNA", sem: "S5", room: "513", admn: "12426035", dept: "MR" },
  { name: "ABEL VARGHESE CHACKO", sem: "S5", room: "319", admn: "12312003", dept: "CSE" },
  { name: "ABHINAV P", sem: "S7", room: "121", admn: "12325038", dept: "ME" },
  { name: "ABHISHEK AJI", sem: "S7", room: "214", admn: "12216002", dept: "MR" },
  { name: "ABIN JOSE", sem: "S00", room: "10", admn: "JEC817", dept: "Teacher" },
  { name: "AJAY K", sem: "S3", room: "418", admn: "12412005", dept: "CSE" },
  { name: "ALFRED GEORGE", sem: "S00", room: "13", admn: "JEC786", dept: "Teacher" },
  { name: "ANAND KRISHNAN N", sem: "S00", room: "12", admn: "JEC730", dept: "Teacher" },
  { name: "ANS RENNY P", sem: "S5", room: "517", admn: "12423037", dept: "EEE" },
  { name: "LINS A T", sem: "S5", room: "529", admn: "12423045", dept: "EEE" },
];

/* 🔹 Helper: Generate date range */
function generateDateRange(start, end) {
  const dateArray = [];
  let currentDate = new Date(start);
  const endDate = new Date(end);
  while (currentDate <= endDate) {
    dateArray.push(new Date(currentDate).toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateArray;
}

/* 🔹 Helper: Randomize A/P for each date */
function generateAttendanceData(dates) {
  return studentList.map((student) => {
    const attendance = {};
    dates.forEach((d) => {
      attendance[d] = Math.random() > 0.3 ? "A" : "P"; // 70% chance A, 30% P
    });
    return { ...student, attendance };
  });
}

function Monthlyattendancereport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dates, setDates] = useState([]);
  const [rows, setRows] = useState([]);

  /* 🔹 Load Data */
  const handleLoadData = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates!");
      return;
    }
    const generatedDates = generateDateRange(startDate, endDate);
    const data = generateAttendanceData(generatedDates);
    setDates(generatedDates);
    setRows(data);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setRows([]);
    setDates([]);
  };

  /* 🔹 Export to Excel (Vite-safe dynamic import) */
const handleExportExcel = async () => {
  if (rows.length === 0) {
    alert("No data to export!");
    return;
  }

  try {
    // ✅ dynamic import (works perfectly in Vite)
    const XLSX = await import("xlsx/xlsx.mjs");

    const data = rows.map((row, index) => {
      const record = {
        "Sl.No": index + 1,
        Name: row.name,
        Semester: row.sem,
        "Room No": row.room,
        "Admn No": row.admn,
        Department: row.dept,
      };
      dates.forEach((d) => {
        record[d] = row.attendance[d];
      });
      return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(
      workbook,
      `Monthly_Attendance_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  } catch (err) {
    console.error("❌ Excel Export Error:", err);
    alert("Failed to export Excel. Check console for details.");
  }
};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <Box
        sx={{
          bgcolor: "#f8fafc",
          minHeight: "100vh",
          p: { xs: 2, sm: 3, md: 4 },
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {/* ===== Header ===== */}
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            textAlign: "center",
            mb: { xs: 3, sm: 4 },
            fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.5rem" },
            background: "linear-gradient(135deg, #1e3c72, #2a5298)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Monthly Attendance Report
        </Typography>

        {/* ===== Filter Section ===== */}
        <Paper
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            mb: 4,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, color: "gray" }} />,
                }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, color: "gray" }} />,
                }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleLoadData}
                sx={{
                  mt: 1,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  background: "linear-gradient(135deg, #1e3c72, #2a5298)",
                  "&:hover": { background: "linear-gradient(135deg, #0d285b, #1b3c7a)" },
                }}
              >
                Load Data
              </Button>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={handleReset}
                sx={{
                  mt: 1,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Reset
              </Button>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Download />}
                color="success"
                onClick={handleExportExcel}
                sx={{
                  mt: 1,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  background: "linear-gradient(135deg, #2e7d32, #43a047)",
                  "&:hover": { background: "linear-gradient(135deg, #1b5e20, #2e7d32)" },
                }}
              >
                Export Excel
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* ===== Table Section ===== */}
        {rows.length > 0 ? (
          <Paper
            sx={{
              borderRadius: 3,
              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              overflowX: "auto",
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f0f4ff" }}>
                    {["Sl.No", "Name", "Semester", "Room No.", "Admn No.", "Department", ...dates].map(
                      (col) => (
                        <TableCell
                          key={col}
                          align="center"
                          sx={{
                            fontWeight: "bold",
                            fontSize: { xs: "0.7rem", sm: "0.85rem" },
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f9",
                        "&:hover": { backgroundColor: "#eef3fc" },
                      }}
                    >
                      <TableCell align="center">{index + 1}</TableCell>
                      <TableCell align="center">{row.name}</TableCell>
                      <TableCell align="center">{row.sem}</TableCell>
                      <TableCell align="center">{row.room}</TableCell>
                      <TableCell align="center">{row.admn}</TableCell>
                      <TableCell align="center">{row.dept}</TableCell>

                      {dates.map((d) => (
                        <TableCell key={d} align="center">
                          <Typography
                            sx={{
                              color: row.attendance[d] === "A" ? "#2e7d32" : "#d32f2f",
                              fontWeight: 600,
                              fontSize: { xs: "0.75rem", sm: "0.9rem" },
                            }}
                          >
                            {row.attendance[d]}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Box textAlign="center" py={6}>
            <Typography variant="h6" color="text.secondary">
              No attendance data found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please select a date range and click “Load Data”.
            </Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  );
}

export default Monthlyattendancereport;
