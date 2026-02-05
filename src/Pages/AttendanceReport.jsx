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
  Grid,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";
import TableChartIcon from "@mui/icons-material/TableChart";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import RoomIcon from "@mui/icons-material/Hotel";
import { motion } from "framer-motion";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

// Short semester format
const formatSemesterShort = (sem) => {
  if (!sem) return "N/A";
  const semNum = sem.toString().replace(/[^0-9]/g, '');
  return `Sem ${semNum}`;
};

const AttendanceReport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState("none");
  
  // Mobile dialog states
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [publishDialog, setPublishDialog] = useState(false);
  
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
        attendance: item.attendance === true,
        semesterShort: formatSemesterShort(item.semester),
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
    if (data.length === 0) {
      showToast("No data to save!", "warning");
      return;
    }

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
      setPublishDialog(false);
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
        d.semesterShort,
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
        d.semesterShort,
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
      item.semesterShort.toLowerCase().includes(search.toLowerCase()) ||
      item.roomNo.toString().includes(search)
  );

  const presentCount = data.filter((d) => d.attendance === true).length;
  const absentCount = data.filter((d) => d.attendance === false).length;
  const totalCount = data.length;

  /* ================= MOBILE CARD VIEW ================= */
  const MobileCardView = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
      {filteredData.map((row, i) => (
        <Card
          key={i}
          component={motion.div}
          whileHover={{ scale: 1.02 }}
          elevation={2}
          sx={{
            borderLeft: `4px solid ${row.attendance ? '#4caf50' : '#f44336'}`,
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 2 }}>
            {/* Student Info Row */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon fontSize="small" color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  {row.name}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                #{i + 1}
              </Typography>
            </Box>

            {/* Details Grid */}
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <SchoolIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.primary">
                    <strong>Sem:</strong> {row.semesterShort}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <RoomIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.primary">
                    <strong>Room:</strong> {row.roomNo}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="body2" color="text.primary">
                    <strong>MessCut:</strong>
                  </Typography>
                  {row.messcut ? 
                    <CheckIcon fontSize="small" color="success" /> : 
                    <CloseIcon fontSize="small" color="error" />
                  }
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.primary">
                    <strong>Attendance:</strong>
                  </Typography>
                  <Checkbox
                    size="small"
                    checked={row.attendance}
                    onChange={() => toggleAttendance(i)}
                    color="primary"
                    sx={{ p: 0 }}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* Status Badge */}
            <Box sx={{ 
              mt: 1.5, 
              pt: 1, 
              borderTop: 1, 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 10,
                  bgcolor: row.attendance ? '#e8f5e9' : '#ffebee',
                  color: row.attendance ? '#2e7d32' : '#c62828',
                  fontWeight: 'bold'
                }}
              >
                {row.attendance ? 'PRESENT' : 'ABSENT'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  /* ================= MOBILE FRIENDLY COMPONENTS ================= */

  // Mobile Stats Cards Component
  const MobileStatsCards = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
      <Card
        component={motion.div}
        whileHover={{ scale: 1.02 }}
        sx={{ bgcolor: "#e3f2fd" }}
      >
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Total Students
          </Typography>
          <Typography variant="h5" fontWeight="bold" textAlign="center">
            {totalCount}
          </Typography>
        </CardContent>
      </Card>
      
      <Card
        component={motion.div}
        whileHover={{ scale: 1.02 }}
        sx={{ bgcolor: "#e8f5e9" }}
      >
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Present
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="success.main" textAlign="center">
            {presentCount}
          </Typography>
        </CardContent>
      </Card>
      
      <Card
        component={motion.div}
        whileHover={{ scale: 1.02 }}
        sx={{ bgcolor: "#ffebee" }}
      >
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Absent
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="error.main" textAlign="center">
            {absentCount}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  // Desktop Stats Cards Component
  const DesktopStatsCards = () => (
    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", justifyContent: "center" }}>
      <Paper
        component={motion.div}
        whileHover={{ scale: 1.05 }}
        sx={{ px: 3, py: 2, minWidth: 160, textAlign: "center", bgcolor: "#e3f2fd" }}
      >
        <Typography variant="subtitle2" color="text.secondary">Total Students</Typography>
        <Typography variant="h4" fontWeight="bold">{totalCount}</Typography>
      </Paper>
      
      <Paper
        component={motion.div}
        whileHover={{ scale: 1.05 }}
        sx={{ px: 3, py: 2, minWidth: 160, textAlign: "center", bgcolor: "#e8f5e9" }}
      >
        <Typography variant="subtitle2" color="text.secondary">Present</Typography>
        <Typography variant="h4" fontWeight="bold" color="success.main">{presentCount}</Typography>
      </Paper>
      
      <Paper
        component={motion.div}
        whileHover={{ scale: 1.05 }}
        sx={{ px: 3, py: 2, minWidth: 160, textAlign: "center", bgcolor: "#ffebee" }}
      >
        <Typography variant="subtitle2" color="text.secondary">Absent</Typography>
        <Typography variant="h4" fontWeight="bold" color="error.main">{absentCount}</Typography>
      </Paper>
    </Box>
  );

  // Semester Badge Component (for desktop table)
  const SemesterBadge = ({ semester }) => (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.5,
        py: 0.5,
        bgcolor: "#f0f4ff",
        border: "1px solid #d1d9ff",
        borderRadius: 20,
      }}
    >
      <SchoolIcon fontSize="small" color="primary" />
      <Typography variant="body2" fontWeight="bold" color="primary">
        {semester}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: isMobile ? 2 : 4 }}>
      <Typography variant={isMobile ? "h5" : "h4"} textAlign="center" mb={3}>
        Attendance Report
      </Typography>

      {/* DATE SELECTION */}
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
          size={isMobile ? "small" : "medium"}
        />
        <Button 
          fullWidth 
          sx={{ mt: 2 }} 
          variant="contained" 
          onClick={handleLoadData}
          size={isMobile ? "medium" : "large"}
        >
          Load Data
        </Button>
      </Box>

      {!isLoaded ? null : (
        <Paper sx={{ p: isMobile ? 2 : 3 }}>
          {/* SUMMARY CARDS */}
          {isMobile ? <MobileStatsCards /> : <DesktopStatsCards />}

          {/* ACTION BAR */}
          <Box sx={{ mb: 2 }}>
            {/* SEARCH BAR */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, semester, or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize={isMobile ? "small" : "medium"} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* ACTION BUTTONS */}
            {isMobile ? (
              // MOBILE ACTION BUTTONS
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  startIcon={<PublishIcon />}
                  onClick={() => setPublishDialog(true)}
                  disabled={published === "published"}
                >
                  Publish
                </Button>
                
                <Button
                  variant="contained"
                  onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
                  sx={{ minWidth: "auto", px: 1 }}
                >
                  <MoreVertIcon />
                </Button>
              </Box>
            ) : (
              // DESKTOP ACTION BUTTONS
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PublishIcon />}
                  onClick={() => setPublishDialog(true)}
                  disabled={published === "published"}
                >
                  {published === "published" ? "Already Published" : "Publish"}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<TableChartIcon />}
                  onClick={handleExportExcel}
                >
                  Excel
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleExportPDF}
                >
                  PDF
                </Button>
              </Box>
            )}
          </Box>

          {/* CONTENT - TABLE FOR DESKTOP, CARDS FOR MOBILE */}
          {isMobile ? (
            <MobileCardView />
          ) : (
            <TableContainer sx={{ maxHeight: 500, overflow: "auto" }}>
              <Table size="medium" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", width: "5%" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "35%" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "15%" }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "10%" }}>Room</TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "15%", textAlign: "center" }}>MessCut</TableCell>
                    <TableCell sx={{ fontWeight: "bold", width: "20%", textAlign: "center" }}>Attendance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body1">
                          {row.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <SemesterBadge semester={row.semesterShort} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="bold" color="text.primary">
                          {row.roomNo}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {row.messcut ? 
                          <CheckIcon fontSize="medium" color="success" /> : 
                          <CloseIcon fontSize="medium" color="error" />
                        }
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          size="medium"
                          checked={row.attendance}
                          onChange={() => toggleAttendance(i)}
                          color="primary"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* EMPTY STATE */}
          {filteredData.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No students found matching your search.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* MOBILE ACTION MENU */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={() => setMobileMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          handleExportExcel();
          setMobileMenuAnchor(null);
        }}>
          <TableChartIcon sx={{ mr: 1 }} /> Export Excel
        </MenuItem>
        <MenuItem onClick={() => {
          handleExportPDF();
          setMobileMenuAnchor(null);
        }}>
          <PictureAsPdfIcon sx={{ mr: 1 }} /> Export PDF
        </MenuItem>
      </Menu>

      {/* PUBLISH DIALOG FOR MOBILE */}
      <Dialog
        open={publishDialog}
        onClose={() => setPublishDialog(false)}
        fullScreen={isMobile}
      >
        <DialogTitle>Publish Attendance</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Publish attendance records to make them visible to parents. Make sure you have saved first.
          </Typography>
          {published === "published" && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Attendance is already published for this date.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: isMobile ? "column" : "row", gap: 1 }}>
          <Button
            fullWidth={isMobile}
            variant="contained"
            color="secondary"
            startIcon={<PublishIcon />}
            onClick={handlePublish}
            disabled={published === "published"}
          >
            {published === "published" ? "Already Published" : "Confirm Publish"}
          </Button>
          
          <Button
            fullWidth={isMobile}
            onClick={() => setPublishDialog(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* TOAST NOTIFICATION */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceReport;