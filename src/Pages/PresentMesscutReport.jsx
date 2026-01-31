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
  InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import { motion } from "framer-motion";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const PresentMesscutReport = () => {
  const [date, setDate] = useState("");
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  /* =====================================================
       LOAD DATA
  ===================================================== */
  const handleLoadData = async () => {
    if (!date) {
      alert("Please select a date!");
      return;
    }

    try {
      const attendanceRes = await axios.get(`${API_URL}/attendance?date=${date}`);
      const attendanceList = attendanceRes.data.data || [];

      const messcutRes = await axios.get(`${API_URL}/api/messcut/by-date?date=${date}`);
      const messcutList = messcutRes.data.data || [];

      const messcutMap = {};
      messcutList.forEach((m) => {
        messcutMap[m.admissionNumber] = true;
      });

      const presentMesscut = attendanceList
        .filter((a) => messcutMap[a.admissionNumber] && a.attendance === true)
        .map((a, index) => ({
          slno: index + 1,
          semester: a.semester,
          roomNo: a.roomNo,
          name: a.name,
        }));

      setData(presentMesscut);
    } catch (err) {
      console.log(err);
      alert("Error loading data!");
    }
  };

  /* =====================================================
       EXPORT EXCEL (STYLED)
  ===================================================== */
  const handleExportExcel = async () => {
    if (data.length === 0) return alert("No data to export!");

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Present Messcut Report");

      /* ------ HEADER STYLE ------ */
      const headerStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" }, size: 12 },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "1E4FA3" } },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };

      /* ------ ROW STYLE ------ */
      const rowStyle = {
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };

      /* ------ COLUMNS ------ */
      sheet.columns = [
        { header: "Sl.No", key: "slno", width: 10 },
        { header: "Semester", key: "semester", width: 15 },
        { header: "Room No", key: "roomNo", width: 15 },
        { header: "Name", key: "name", width: 35 },
      ];

      /* ------ APPLY HEADER STYLE ------ */
      sheet.getRow(1).eachCell((cell) => (cell.style = headerStyle));

      /* ------ ADD DATA ROWS ------ */
      data.forEach((item) => {
        const row = sheet.addRow(item);
        row.eachCell((cell) => (cell.style = rowStyle));
      });

      /* ------ AUTO FILTER ------ */
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: 4 },
      };

      /* ------ EXPORT FILE ------ */
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `PresentMesscut_${date}.xlsx`);

      alert("Excel created successfully!");
    } catch (err) {
      console.error(err);
      alert("Excel export failed");
    }
  };

  /* =====================================================
       SEARCH FILTER
  ===================================================== */
  const filteredData = data.filter(
    (row) =>
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      row.semester.toLowerCase().includes(search.toLowerCase()) ||
      row.roomNo.toString().includes(search)
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fbff 0%, #eef3fb 100%)",
        p: { xs: 2, md: 5 },
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, color: "#1e4fa3", mb: 3, textAlign: "center" }}
      >
        Present Messcut Report
      </Typography>

      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        sx={{
          p: 3,
          borderRadius: 3,
          background: "#ffffff",
          boxShadow: "0 8px 25px rgba(30,79,163,0.1)",
        }}
      >
        {/* TOP CONTROLS */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            type="date"
            label="Select Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: "100%", sm: 250 } }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleLoadData}
              sx={{ background: "#1e4fa3", textTransform: "none", fontWeight: 600 }}
            >
              Load Data
            </Button>

            <Button
              variant="contained"
              onClick={handleExportExcel}
              sx={{ background: "#00b4d8", textTransform: "none", fontWeight: 600 }}
            >
              Create Excel
            </Button>
          </Box>
        </Box>

        {/* SEARCH */}
        <TextField
          variant="outlined"
          placeholder="Search..."
          fullWidth
          sx={{ mb: 3 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#1e4fa3" }} />
              </InputAdornment>
            ),
          }}
        />

        {/* TABLE */}
        <TableContainer>
          <Table>
            <TableHead sx={{ background: "#f4f7fc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#1e4fa3" }}>Sl.No.</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#1e4fa3" }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#1e4fa3" }}>Room No.</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#1e4fa3" }}>Name</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <TableRow key={row.slno} hover>
                    <TableCell>{row.slno}</TableCell>
                    <TableCell>{row.semester}</TableCell>
                    <TableCell>{row.roomNo}</TableCell>
                    <TableCell>{row.name}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default PresentMesscutReport;
