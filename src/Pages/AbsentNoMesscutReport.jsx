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

const AbsentNoMesscutReport = () => {
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /* =====================================================
        LOAD LIVE DATA
  ===================================================== */
  const handleLoadData = async () => {
    if (!date) return alert("Please select a date!");

    try {
      // 1️⃣ Get ATTENDANCE list
      const attendanceRes = await axios.get(`${API_URL}/attendance?date=${date}`);
      const attendanceList = attendanceRes.data.data || [];

      // 2️⃣ Get messcut list
      const messcutRes = await axios.get(`${API_URL}/api/messcut/by-date?date=${date}`);
      const messcutList = messcutRes.data.data || [];

      // Messcut lookup
      const messcutMap = {};
      messcutList.forEach((m) => {
        messcutMap[m.admissionNumber] = true;
      });

      /* =====================================================
            LOGIC:
            Absent (attendance=false) AND NOT messcut
      ===================================================== */
      const filtered = attendanceList
        .filter((a) => a.attendance === false && !messcutMap[a.admissionNumber])
        .map((a, index) => ({
          slno: index + 1,
          semester: a.semester,
          roomNo: a.roomNo,
          name: a.name,
        }));

      setData(filtered);
      setIsLoaded(true);
    } catch (err) {
      console.log(err);
      alert("Error loading data");
    }
  };

  /* =====================================================
        EXCEL EXPORT (Styled)
  ===================================================== */
  const handleExcelExport = async () => {
    if (data.length === 0) return alert("No data available to export!");

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Absent No Messcut");

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

      const rowStyle = {
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };

      sheet.columns = [
        { header: "Sl.No", key: "slno", width: 10 },
        { header: "Semester", key: "semester", width: 15 },
        { header: "Room No", key: "roomNo", width: 15 },
        { header: "Name", key: "name", width: 35 },
      ];

      sheet.getRow(1).eachCell((cell) => (cell.style = headerStyle));

      data.forEach((item) => {
        const row = sheet.addRow(item);
        row.eachCell((cell) => (cell.style = rowStyle));
      });

      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: 4 },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `AbsentNoMesscut_${date}.xlsx`);

      alert("Excel created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to export excel!");
    }
  };

  /* =====================================================
        SEARCH
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
      {/* HEADER */}
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, color: "#1e4fa3", mb: 3, textAlign: "center" }}
      >
        Absent No-Messcut Report
      </Typography>

      {/* DATE + BUTTONS */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="Select Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: "100%", sm: 250 } }}
        />

        <Button
          variant="contained"
          sx={{
            background: "#1e4fa3",
            fontWeight: 600,
            textTransform: "none",
          }}
          onClick={handleLoadData}
        >
          Load Data
        </Button>

        <Button
          variant="contained"
          sx={{
            background: "#00b4d8",
            fontWeight: 600,
            textTransform: "none",
          }}
          onClick={handleExcelExport}
        >
          Create Excel
        </Button>
      </Box>

      {/* SEARCH BAR */}
      {isLoaded && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
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
        </Box>
      )}

      {/* CONTENT */}
      {!isLoaded ? (
        <Typography
          variant="h6"
          sx={{ color: "#1e4fa3", textAlign: "center", mt: 5 }}
        >
          NO DATA FOUND
        </Typography>
      ) : (
        <Paper
          component={motion.div}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{
            p: 3,
            borderRadius: 3,
            background: "#fff",
            boxShadow: "0 8px 25px rgba(30,79,163,0.1)",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead sx={{ background: "#f4f7fc" }}>
                <TableRow>
                  <TableCell><strong>Sl.No.</strong></TableCell>
                  <TableCell><strong>Semester</strong></TableCell>
                  <TableCell><strong>Room No.</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
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
                    <TableCell colSpan={4} align="center" sx={{ color: "#6c757d" }}>
                      No matching data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default AbsentNoMesscutReport;
