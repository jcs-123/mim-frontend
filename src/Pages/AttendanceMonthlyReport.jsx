import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  MenuItem,
  InputAdornment,
  Divider,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const API_URL =
  import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const AttendanceMonthlyReport = () => {
  const [month, setMonth] = useState("");
  const [semester, setSemester] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState([]);
  const [days, setDays] = useState(0);
  const [loaded, setLoaded] = useState(false);

  /* ================= LOAD DATA ================= */
  const loadReport = async () => {
    if (!month) {
      alert("Please select a month");
      return;
    }

    const res = await axios.get(
      `${API_URL}/attendance/monthly?month=${month}`
    );

    setData(res.data.data);
    setDays(res.data.daysInMonth);
    setLoaded(true);
  };

  /* ================= SEMESTER OPTIONS ================= */
  const semesterOptions = useMemo(() => {
    const set = new Set(data.map((d) => d.semester));
    return Array.from(set).filter(Boolean);
  }, [data]);

  /* ================= FILTERED DATA ================= */
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchSemester = semester ? row.semester === semester : true;
      const matchSearch =
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.semester?.toLowerCase().includes(search.toLowerCase());

      return matchSemester && matchSearch;
    });
  }, [data, semester, search]);

  /* ================= EXCEL EXPORT ================= */
  const exportExcel = async () => {
    if (!filteredData.length) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Monthly Attendance");

    /* ===== HEADING ===== */
    sheet.mergeCells(1, 1, 1, days + 6);
    sheet.getCell("A1").value = `ATTENDANCE MONTHLY REPORT (${month})`;
    sheet.getCell("A1").font = { size: 16, bold: true };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    sheet.mergeCells(2, 1, 2, days + 6);
    sheet.getCell("A2").value = "All Students – Day Wise Attendance";
    sheet.getCell("A2").alignment = { horizontal: "center" };

    /* ===== HEADER ===== */
    const headers = [
      "Name",
      "Semester",
      "Room No",
      ...Array.from({ length: days }, (_, i) => i + 1),
      "Present",
      "Absent",
    ];

    sheet.addRow(headers);

    sheet.getRow(3).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1E4FA3" },
      };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    /* ===== DATA ===== */
    filteredData.forEach((row) => {
      const rowData = [
        row.name,
        row.semester,
        row.roomNo,
        ...Array.from({ length: days }, (_, i) => {
          const day = `${month}-${String(i + 1).padStart(2, "0")}`;
          return row.daily[day];
        }),
        row.present,
        row.absent,
      ];

      const excelRow = sheet.addRow(rowData);

      excelRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center" };
        if (cell.value === "P") {
          cell.font = { bold: true, color: { argb: "FF2E7D32" } };
        }
        if (cell.value === "A") {
          cell.font = { bold: true, color: { argb: "FFC62828" } };
        }
      });
    });

    sheet.columns.forEach((c) => (c.width = 14));

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer]),
      `Attendance_Monthly_Report_${month}.xlsx`
    );
  };

  return (
    <Box p={4}>
      {/* TITLE */}
      <Typography variant="h5" fontWeight={700} mb={1}>
        <CalendarMonthIcon sx={{ mr: 1 }} />
        Attendance Monthly Report
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Full month attendance – all students
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* MONTH SELECT */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              type="month"
              size="small"
              fullWidth
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={loadReport}
            >
              Load Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* FILTERS – SHOW ONLY AFTER LOAD */}
      {loaded && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                <MenuItem value="">All Semesters</MenuItem>
                {semesterOptions.map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    {sem}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search by name / semester"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DownloadIcon />}
                onClick={exportExcel}
              >
                Export Excel
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* TABLE */}
      {filteredData.length > 0 && (
        <Paper sx={{ overflowX: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Room</TableCell>
                {[...Array(days)].map((_, i) => (
                  <TableCell key={i} align="center">
                    {i + 1}
                  </TableCell>
                ))}
                <TableCell>P</TableCell>
                <TableCell>A</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.map((row, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.semester}</TableCell>
                  <TableCell>{row.roomNo}</TableCell>

                  {[...Array(days)].map((_, i) => {
                    const day = `${month}-${String(i + 1).padStart(2, "0")}`;
                    const value = row.daily[day];
                    return (
                      <TableCell
                        key={i}
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color: value === "P" ? "green" : "red",
                        }}
                      >
                        {value}
                      </TableCell>
                    );
                  })}

                  <TableCell>{row.present}</TableCell>
                  <TableCell>{row.absent}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default AttendanceMonthlyReport;
