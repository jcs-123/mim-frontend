import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Fade,
  useMediaQuery,
} from "@mui/material";
import { Check, Close } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axios from "axios";

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const NameWiseReport = () => {
  const [semesters, setSemesters] = useState([]);
  const [semester, setSemester] = useState("");
  const [students, setStudents] = useState([]);
  const [student, setStudent] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [month, setMonth] = useState("");
  const [rows, setRows] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* =========================================================
      LOAD SEMESTERS
  ========================================================= */
  useEffect(() => {
    loadSemesterList();
  }, []);

  const loadSemesterList = async () => {
    try {
      const res = await axios.get(`${API_URL}/sem-list`);
      setSemesters(res.data.data || []);
    } catch {
      alert("Failed to load semesters");
    }
  };

  /* =========================================================
      LOAD STUDENTS BY SEM
  ========================================================= */
  const loadStudentsBySemester = async (sem) => {
    try {
      const res = await axios.get(`${API_URL}/by-sem?sem=${sem}`);
      setStudents(res.data.data || []);
    } catch {
      alert("Failed to load students");
    }
  };

  /* =========================================================
      LOAD STUDENT INFO
  ========================================================= */
  const loadStudentInfo = async (adm) => {
    try {
      const res = await axios.get(`${API_URL}/user?admissionNumber=${adm}`);
      setStudentInfo(res.data.data);
    } catch {
      setStudentInfo(null);
    }
  };

  /* =========================================================
      GENERATE MONTH DATES (India Safe)
  ========================================================= */
  const generateMonthDates = (yyyyMM) => {
    const [year, month] = yyyyMM.split("-").map(Number);
    const last = new Date(year, month, 0).getDate();

    return Array.from({ length: last }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      return `${year}-${String(month).padStart(2, "0")}-${d}`;
    });
  };

  /* =========================================================
      LOAD REPORT
  ========================================================= */
  const handleLoadData = async () => {
    if (!semester || !student || !month) {
      alert("Select Semester + Student + Month");
      return;
    }

    try {
      const dates = generateMonthDates(month);

      const res = await axios.get(
        `${API_URL}/api/messcut/month-wise?admissionNumber=${student}&month=${month}`
      );

      const messcutMap = {};
      res.data.data.forEach((d) => (messcutMap[d.date] = d));

      const formatted = dates.map((date, idx) => {
        const safeDate = new Date(date + "T00:00:00"); // ⛔ Fix timezone skipping

        const x = messcutMap[date];
        return {
          id: idx + 1,
          date,
          name: studentInfo?.name || "",
          sem: studentInfo?.sem || "",
          room: studentInfo?.roomNo || "",
          breakfast: x ? (x.breakfast ? "Yes" : "No") : "Yes",
          lunch: x ? (x.lunch ? "Yes" : "No") : "Yes",
          tea: x ? (x.tea ? "Yes" : "No") : "Yes",
          dinner: x ? (x.dinner ? "Yes" : "No") : "Yes",
        };
      });

      setRows(formatted);
      setPage(0);
    } catch {
      alert("Failed to load report");
    }
  };

  /* =========================================================
      STATUS ICON
  ========================================================= */
  const StatusIcon = ({ value }) => (
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        backgroundColor: value === "Yes" ? "#e8f5e8" : "#ffebee",
        color: value === "Yes" ? "green" : "red",
        border: `2px solid ${value === "Yes" ? "green" : "red"}`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {value === "Yes" ? <Check /> : <Close />}
    </Box>
  );

  /* =========================================================
      EXPORT EXCEL
  ========================================================= */
  const handleExportExcel = async () => {
    if (!rows.length) return alert("No data");
    if (!studentInfo) return alert("Student info not loaded");

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("MessReport");

    sheet.mergeCells("A1", "I1"); // ⭐ FIXED (9 columns)
    sheet.getCell("A1").value = `Mess Report (${studentInfo.name}) - ${month}`;
    sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFF" } };
    sheet.getCell("A1").alignment = { horizontal: "center" };
    sheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1976D2" },
    };

    const head = [
      "Sl.No",
      "Name",
      "Semester",
      "Room No",
      "Date",
      "Breakfast",
      "Lunch",
      "Tea",
      "Dinner",
    ];

    const headerRow = sheet.addRow(head);
    headerRow.eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "42A5F5" } };
      c.alignment = { horizontal: "center" };
    });

    rows.forEach((r) =>
      sheet.addRow([
        r.id,
        r.name,
        r.sem,
        r.room,
        r.date,
        r.breakfast,
        r.lunch,
        r.tea,
        r.dinner,
      ])
    );

    sheet.columns.forEach((col) => (col.width = 15));

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf]);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `MessReport_${studentInfo.name}_${month}.xlsx`;
    link.click();
  };

  /* =========================================================
      EXPORT PDF
  ========================================================= */
  const handleExportPDF = () => {
    if (!rows.length) return alert("No data");
    if (!studentInfo) return alert("Student info not loaded");

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Mess Report - ${studentInfo.name}`, 14, 15);
    doc.setFontSize(12);
    doc.text(`Month: ${month}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [["Sl.No", "Name", "Sem", "Room", "Date", "B", "L", "T", "D"]],
      body: rows.map((r) => [
        r.id,
        r.name,
        r.sem,
        r.room,
        r.date,
        r.breakfast === "Yes" ? "✔" : "✘",
        r.lunch === "Yes" ? "✔" : "✘",
        r.tea === "Yes" ? "✔" : "✘",
        r.dinner === "Yes" ? "✔" : "✘",
      ]),
      theme: "grid",
      styles: { halign: "center" },
      headStyles: { fillColor: [25, 118, 210], textColor: 255 },
    });

    doc.save(`MessReport_${studentInfo.name}_${month}.pdf`);
  };

  /* =========================================================
      RENDER UI
  ========================================================= */
  return (
    <Fade in timeout={700}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" textAlign="center" fontWeight="bold" sx={{ mb: 4 }}>
          Name Wise Mess Report
        </Typography>

        {/* FILTERS */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={2}>
            {/* SEM */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Select Semester"
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  setStudent("");
                  setStudentInfo(null);
                  setRows([]);
                  loadStudentsBySemester(e.target.value);
                }}
              >
                <MenuItem value="">Select</MenuItem>
                {semesters.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* STUDENT */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                disabled={!semester}
                label="Select Student"
                value={student}
                onChange={(e) => {
                  setStudent(e.target.value);
                  loadStudentInfo(e.target.value);
                }}
              >
                <MenuItem value="">Select</MenuItem>
                {students.map((s) => (
                  <MenuItem key={s.admissionNumber} value={s.admissionNumber}>
                    {s.name} ({s.admissionNumber})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* MONTH */}
            <Grid item xs={12} sm={4}>
              <TextField
                type="month"
                fullWidth
                label="Select Month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </Grid>

            {/* LOAD */}
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                disabled={!semester || !student || !month}
                onClick={async () => {
                  await loadStudentInfo(student); // ⭐ ensure info loaded
                  handleLoadData();
                }}
              >
                Load Data
              </Button>
            </Grid>

            {/* EXPORT BUTTONS */}
            <Grid item xs={12} sx={{ display: "flex", gap: 2 }}>
              <Button fullWidth variant="outlined" color="success" onClick={handleExportExcel}>
                Export Excel
              </Button>
              <Button fullWidth variant="outlined" color="error" onClick={handleExportPDF}>
                Export PDF
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* TABLE */}
        {rows.length > 0 && (
          <Paper>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      "Sl.No",
                      "Name",
                      "Sem",
                      "Room",
                      "Date",
                      "Breakfast",
                      "Lunch",
                      "Tea",
                      "Dinner",
                    ].map((h) => (
                      <TableCell key={h} align="center" sx={{ fontWeight: "bold" }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((r) => (
                      <TableRow key={r.id}>
                        <TableCell align="center">{r.id}</TableCell>
                        <TableCell align="center">{r.name}</TableCell>
                        <TableCell align="center">{r.sem}</TableCell>
                        <TableCell align="center">{r.room}</TableCell>
                        <TableCell align="center">{r.date}</TableCell>

                        <TableCell align="center">
                          <StatusIcon value={r.breakfast} />
                        </TableCell>
                        <TableCell align="center">
                          <StatusIcon value={r.lunch} />
                        </TableCell>
                        <TableCell align="center">
                          <StatusIcon value={r.tea} />
                        </TableCell>
                        <TableCell align="center">
                          <StatusIcon value={r.dinner} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Paper>
        )}
      </Box>
    </Fade>
  );
};

export default NameWiseReport;
