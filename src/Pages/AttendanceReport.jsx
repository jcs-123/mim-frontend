import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { motion } from "framer-motion";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const AttendanceReport = () => {
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState("none"); // none | published

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  /* ================= LOAD DATA ================= */
  const handleLoadData = async () => {
    if (!date) {
      showToast("Please select a date!", "warning");
      return;
    }

    try {
      const attendanceRes = await axios.get(
        `${API_URL}/attendance?date=${date}`
      );
      let baseList = attendanceRes.data.data || [];

      const messcutRes = await axios.get(
        `${API_URL}/api/messcut/by-date?date=${date}`
      );
      const messcutList = messcutRes.data.data || [];

      const messcutMap = {};
      messcutList.forEach((m) => {
        messcutMap[m.admissionNumber] = true;
      });

      baseList = baseList.map((item) => ({
        ...item,
        messcut: messcutMap[item.admissionNumber] === true,
        attendance: item.attendance === true, // ✅ default ABSENT
      }));

      setPublished(baseList.length > 0 ? baseList[0].published || "none" : "none");
      setData(baseList);
      setIsLoaded(true);
      showToast("Data loaded successfully!");
    } catch (err) {
      console.error(err);
      showToast("Error loading data", "error");
    }
  };

  /* ================= TOGGLE ================= */
  const toggleAttendance = (index) => {
    const updated = [...data];
    updated[index].attendance = !updated[index].attendance;
    setData(updated);
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/attendance/save`, {
        date,
        records: data.map((d) => ({
          admissionNumber: d.admissionNumber,
          attendance: d.attendance,
        })),
      });
      showToast("Attendance saved successfully!");
    } catch (err) {
      console.error(err);
      showToast("Save failed", "error");
    }
    setSaving(false);
  };

  /* ================= PUBLISH ================= */
  const handlePublish = async () => {
    try {
      await axios.post(`${API_URL}/attendance/publish`, { date });
      setPublished("published");
      showToast("Attendance published (visible to parents)");
    } catch (err) {
      console.error(err);
      showToast("Publish failed", "error");
    }
  };

  /* ================= EXCEL EXPORT ================= */
const handleExportExcel = async () => {
  if (data.length === 0) {
    showToast("No data to export", "warning");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance");

  /* ================= TITLE ROW ================= */
  sheet.mergeCells("A1:G1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `TODAY ATTENDANCE - ${date}`;
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1E4FA3" },
  };
  sheet.getRow(1).height = 32;

  /* ================= COLUMN HEADERS ================= */
  sheet.getRow(2).values = [
    "Sl.No",
    "Admission No",
    "Name",
    "Semester",
    "Room No",
    "MessCut",
    "Attendance",
  ];

  const headerRow = sheet.getRow(2);
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "00B4D8" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  /* ================= COLUMN WIDTHS ================= */
  sheet.columns = [
    { key: "sl", width: 8 },
    { key: "adm", width: 18 },
    { key: "name", width: 25 },
    { key: "sem", width: 12 },
    { key: "room", width: 12 },
    { key: "mess", width: 12 },
    { key: "att", width: 14 },
  ];

  /* ================= DATA ROWS ================= */
  data.forEach((d, i) => {
    const row = sheet.addRow([
      i + 1,
      d.admissionNumber,
      d.name,
      d.semester,
      d.roomNo,
      d.messcut ? "Yes" : "No",
      d.attendance ? "Present" : "Absent",
    ]);

    row.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Attendance color
      if (colNumber === 7) {
        cell.font = {
          bold: true,
          color: { argb: d.attendance ? "FF2E7D32" : "FFC62828" },
        };
      }
    });
  });

  /* ================= AUTO FILTER ================= */
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: sheet.rowCount, column: 7 },
  };

  /* ================= DOWNLOAD ================= */
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Attendance_Report_${date}.xlsx`);

  showToast("Excel downloaded successfully!", "success");
};



  /* ================= PDF EXPORT ================= */
  const handleExportPDF = () => {
    if (data.length === 0) return showToast("No data to export", "warning");

    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text(`Attendance Report - ${date}`, 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [[
        "Sl.No",
        "Admission No",
        "Name",
        "Semester",
        "Room No",
        "MessCut",
        "Attendance",
      ]],
      body: data.map((d, i) => [
        i + 1,
        d.admissionNumber,
        d.name,
        d.semester,
        d.roomNo,
        d.messcut ? "Yes" : "No",
        d.attendance ? "Present" : "Absent",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 79, 163] },
    });

    doc.save(`Attendance_${date}.pdf`);
  };

  /* ================= FILTER ================= */
  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.semester.toLowerCase().includes(search.toLowerCase()) ||
      item.roomNo.toString().includes(search)
      
  );
const presentCount = data.filter((d) => d.attendance === true).length;
const absentCount = data.filter((d) => d.attendance === false).length;
const totalCount = data.length;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" textAlign="center" mb={3}>
        Attendance Report
      </Typography>

      {/* DATE */}
      <Box sx={{ maxWidth: 500, mx: "auto", mb: 3 }}>
        <TextField
          fullWidth
          type="date"
          label="Select Date"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPublished("none");
            setIsLoaded(false);
            setData([]);
          }}
        />
        <Button fullWidth sx={{ mt: 2 }} variant="contained" onClick={handleLoadData}>
          Load Data
        </Button>
      </Box>

      {!isLoaded ? null : (
        <Paper sx={{ p: 3 }}>
        {/* ================= SUMMARY ================= */}
<Box
  sx={{
    display: "flex",
    gap: 2,
    mb: 3,
    flexWrap: "wrap",
    justifyContent: "center",
  }}
>
  {/* TOTAL */}
  <Paper
    component={motion.div}
    whileHover={{ scale: 1.05 }}
    sx={{
      px: 3,
      py: 2,
      minWidth: 160,
      textAlign: "center",
      bgcolor: "#e3f2fd",
    }}
  >
    <Typography variant="subtitle2" color="text.secondary">
      Total Students
    </Typography>
    <Typography variant="h4" fontWeight="bold">
      {totalCount}
    </Typography>
  </Paper>

  {/* PRESENT */}
  <Paper
    component={motion.div}
    whileHover={{ scale: 1.05 }}
    sx={{
      px: 3,
      py: 2,
      minWidth: 160,
      textAlign: "center",
      bgcolor: "#e8f5e9",
    }}
  >
    <Typography variant="subtitle2" color="text.secondary">
      Present
    </Typography>
    <Typography variant="h4" fontWeight="bold" color="success.main">
      {presentCount}
    </Typography>
  </Paper>

  {/* ABSENT */}
  <Paper
    component={motion.div}
    whileHover={{ scale: 1.05 }}
    sx={{
      px: 3,
      py: 2,
      minWidth: 160,
      textAlign: "center",
      bgcolor: "#ffebee",
    }}
  >
    <Typography variant="subtitle2" color="text.secondary">
      Absent
    </Typography>
    <Typography variant="h4" fontWeight="bold" color="error.main">
      {absentCount}
    </Typography>
  </Paper>
</Box>

          {/* ACTION BAR */}
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search..."
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

            <Button variant="contained" color="success" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={22} /> : "Save"}
            </Button>

            <Button variant="contained" color="secondary" onClick={handlePublish} disabled={published === "published"}>
              Publish
            </Button>

            <Button variant="contained" onClick={handleExportExcel}>
              Excel
            </Button>

            <Button variant="contained" color="error" onClick={handleExportPDF}>
              PDF
            </Button>
          </Box>

          {/* TABLE */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>MessCut</TableCell>
                  <TableCell>Attendance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.semester}</TableCell>
                    <TableCell>{row.roomNo}</TableCell>
                    <TableCell align="center">
                      {row.messcut ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox checked={row.attendance} onChange={() => toggleAttendance(i)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceReport;
