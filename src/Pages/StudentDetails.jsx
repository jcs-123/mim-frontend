import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
  TableContainer,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Stack,
  Grid,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import axios from "axios";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ must import default
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";



const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const StudentDetails = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 🟢 Fetch all apology requests
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/apology/all`);
      if (res.data?.success) {
        setStudents(res.data.data || []);
      } else setStudents([]);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 🟣 Update Status (Approve)
  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/apology/update/${id}`, { status });
      fetchStudents();
    } catch (err) {
      console.error("❌ Error updating status:", err);
    }
  };

  // 🔍 Filter Search
  const filtered = students.filter(
    (s) =>
      s.admissionNo?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      s.roomNo?.toLowerCase().includes(search.toLowerCase()) ||
      s.reason?.toLowerCase().includes(search.toLowerCase())
  );

const exportToExcel = async () => {
  if (!filtered.length) {
    alert("No data to export!");
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Apology Requests');

    // 🏫 HEADER SECTION
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'JYOTHI ENGINEERING COLLEGE';
    titleCell.font = { 
      bold: true, 
      size: 18, 
      color: { argb: '2C3E50' } 
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E8F4FD' }
    };

    worksheet.mergeCells('A2:H2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = 'Student Apology Management System';
    subtitleCell.font = { bold: true, size: 14, color: { argb: '34495E' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A3:H3');
    const reportCell = worksheet.getCell('A3');
    reportCell.value = 'APOLOGY REQUESTS REPORT';
    reportCell.font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    reportCell.alignment = { horizontal: 'center', vertical: 'middle' };
    reportCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2980B9' }
    };

    // 📊 REPORT INFO SECTION
    const infoStartRow = 5;
    const infoData = [
      { label: 'Generated On', value: new Date().toLocaleString('en-IN') },
      { label: 'Total Records', value: filtered.length },
      { label: 'Report Type', value: 'Student Apology Requests' }
    ];

    infoData.forEach((info, index) => {
      const rowNum = infoStartRow + index;
      worksheet.getCell(`A${rowNum}`).value = info.label;
      worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 11 };
      worksheet.getCell(`B${rowNum}`).value = info.value;
      worksheet.getCell(`B${rowNum}`).font = { size: 11 };
    });

    // 📋 TABLE HEADERS
    const headerRowNum = infoStartRow + infoData.length + 2;
    const headers = [
      'S.No', 'Admission No', 'Student Name', 'Room No', 
      'Reason', 'Submitted By', 'Submitted At', 'Status'
    ];

    const headerRow = worksheet.getRow(headerRowNum);
    headers.forEach((header, colIndex) => {
      const cell = headerRow.getCell(colIndex + 1);
      cell.value = header;
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFF' },
        size: 12
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2C3E50' }
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '1A2530' } },
        left: { style: 'thin', color: { argb: '1A2530' } },
        bottom: { style: 'thin', color: { argb: '1A2530' } },
        right: { style: 'thin', color: { argb: '1A2530' } },
      };
    });

    // 📝 DATA ROWS
    let currentRow = headerRowNum + 1;
    filtered.forEach((row, index) => {
      const dataRow = worksheet.getRow(currentRow);
      const rowData = [
        index + 1,
        row.admissionNo || '-',
        row.studentName || '-',
        row.roomNo || '-',
        row.reason || '-',
        row.submittedBy || '-',
        row.submittedAt || '-',
        row.status || '-'
      ];

      rowData.forEach((value, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        cell.value = value;
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E0E0E0' } },
          left: { style: 'thin', color: { argb: 'E0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
          right: { style: 'thin', color: { argb: 'E0E0E0' } },
        };
        
        // Status color coding
        if (colIndex === 7) { // Status column
          if (value === 'Approved') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4EDDA' } };
            cell.font = { color: { argb: '155724' }, bold: true };
          } else if (value === 'Rejected') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8D7DA' } };
            cell.font = { color: { argb: '721C24' }, bold: true };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3CD' } };
            cell.font = { color: { argb: '856404' }, bold: true };
          }
        } else {
          // Alternating row colors
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: index % 2 === 0 ? 'F8F9FA' : 'FFFFFF' }
          };
        }
      });
      
      currentRow++;
    });

    // 📏 COLUMN WIDTHS
    worksheet.columns = [
      { width: 8 },   // S.No
      { width: 18 },  // Admission No
      { width: 25 },  // Student Name
      { width: 12 },  // Room No
      { width: 40 },  // Reason
      { width: 20 },  // Submitted By
      { width: 22 },  // Submitted At
      { width: 15 }   // Status
    ];

    // 🔒 FREEZE HEADERS
    worksheet.views = [
      { state: 'frozen', ySplit: headerRowNum }
    ];

    // 💾 SAVE FILE
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, `Apology_Requests_Professional_${new Date().getTime()}.xlsx`);

  } catch (error) {
    console.error('Excel export error:', error);
    alert('Failed to generate Excel file. Please try again.');
  }
};

// ======================================
// 🧾 EXPORT TO PDF (professional layout)
// ======================================
const exportToPDF = () => {
  if (!filtered.length) {
    alert("No data to export!");
    return;
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.width;

  // 🔷 Header with college name
  doc.setFillColor(25, 118, 210);
  doc.rect(0, 0, pageWidth, 20, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("JYOTHI ENGINEERING COLLEGE", pageWidth / 2, 8, { align: "center" });

  doc.setFontSize(11);
  doc.text("Student Apology Management Report", pageWidth / 2, 15, { align: "center" });

  // 🧮 Table data
  const tableData = filtered.map((row, i) => [
    i + 1,
    row.admissionNo,
    row.studentName,
    row.roomNo,
    row.reason,
    row.submittedBy,
    row.submittedAt,
    row.status,
  ]);

  autoTable(doc, {
    startY: 28,
    head: [
      [
        "S.No",
        "Admission No",
        "Student Name",
        "Room No",
        "Reason",
        "Submitted By",
        "Submitted At",
        "Status",
      ],
    ],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
      halign: "center",
      valign: "middle",
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 10 },  // S.No
      1: { cellWidth: 25 },  // Admission No
      2: { cellWidth: 40 },  // Student Name
      3: { cellWidth: 20 },  // Room No
      4: { cellWidth: 55 },  // Reason (wraps)
      5: { cellWidth: 25 },  // Submitted By
      6: { cellWidth: 30 },  // Submitted At
      7: { cellWidth: 20 },  // Status
    },
    margin: { left: 10, right: 10 },
  });

  // 📄 Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 200, { align: "center" });
    doc.text("Confidential — Jyothi Engineering College", 10, 200);
  }

  doc.save(`Apology_Requests_${new Date().toISOString().split("T")[0]}.pdf`);
};


  // 📱 Mobile Card
  const MobileCardView = ({ student }) => (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        mb: 2,
        border: `1px solid ${
          student.status === "Approved" ? "#c6f6d5" : "#fed7d7"
        }`,
        background: student.status === "Approved" ? "#f0fff4" : "#fff5f5",
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight="600">
                {student.studentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {student.admissionNo}
              </Typography>
            </Box>
            <Chip
              icon={
                student.status === "Approved" ? (
                  <CheckCircleIcon />
                ) : (
                  <PendingActionsIcon />
                )
              }
              label={student.status}
              size="small"
              color={
                student.status === "Approved" ? "success" : "warning"
              }
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            Room: <b>{student.roomNo}</b>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submitted By: <b>{student.submittedBy}</b>
          </Typography>
          <Typography variant="body2">{student.reason}</Typography>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" gap={1} alignItems="center">
              <CalendarTodayIcon sx={{ fontSize: 16, color: "#64748b" }} />
              <Typography variant="caption" color="text.secondary">
                {student.submittedAt}
              </Typography>
            </Box>
            {student.status === "Pending" && (
              <Button
                variant="contained"
                size="small"
                onClick={() =>
                  handleStatusUpdate(student._id, "Approved")
                }
                startIcon={<CheckCircleIcon />}
                sx={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Approve
              </Button>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // 💻 Desktop Table
  const DesktopTableView = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow
            sx={{
              background: "linear-gradient(135deg, #0c5fbdff, #0889f3ff)",
              "& th": {
                color: "white",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderBottom: "none",
                py: 1.5,
              },
            }}
          >
            <TableCell>#</TableCell>
            <TableCell>Admission No</TableCell>
            <TableCell>Student Name</TableCell>
            <TableCell>Room No</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Submitted By</TableCell>
            <TableCell>Submitted At</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((row, index) => (
            <TableRow
              key={row._id}
              component={motion.tr}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              hover
              sx={{
                "&:hover": {
                  backgroundColor: "#f8fafc",
                  transform: "translateY(-1px)",
                  transition: "0.2s",
                },
              }}
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell>{row.admissionNo}</TableCell>
              <TableCell>{row.studentName}</TableCell>
              <TableCell>{row.roomNo}</TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Tooltip title={row.reason}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ color: "#334155" }}
                  >
                    {row.reason}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>{row.submittedBy}</TableCell>
              <TableCell>{row.submittedAt}</TableCell>
              <TableCell>
                <Chip
                  label={row.status}
                  color={
                    row.status === "Approved"
                      ? "success"
                      : row.status === "Rejected"
                      ? "error"
                      : "warning"
                  }
                  icon={
                    row.status === "Approved" ? (
                      <CheckCircleIcon />
                    ) : (
                      <PendingActionsIcon />
                    )
                  }
                />
              </TableCell>
              <TableCell align="center">
                <Box display="flex" gap={1} justifyContent="center">
                  <Tooltip title="View Details">
                  
                  </Tooltip>
                  {row.status === "Pending" && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        handleStatusUpdate(row._id, "Approved")
                      }
                      startIcon={<CheckCircleIcon />}
                      sx={{
                        background:
                          "linear-gradient(135deg, #10b981, #059669)",
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Approve
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Typography
        variant={isMobile ? "h5" : "h4"}
        textAlign="center"
        sx={{
          fontWeight: 700,
          background: "linear-gradient(135deg, #0c5fbdff, #0889f3ff)",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          mb: 2,
        }}
      >
        Student Apology Management
      </Typography>

      {/* Main Card */}
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* Search + Export Buttons */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            placeholder="Search students..."
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#64748b" }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, backgroundColor: "#f8fafc" },
            }}
          />

          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportToExcel}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#0288d1",
                color: "#0288d1",
                "&:hover": { backgroundColor: "#e1f5fe" },
              }}
            >
              Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={exportToPDF}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#d32f2f",
                color: "#d32f2f",
                "&:hover": { backgroundColor: "#ffebee" },
              }}
            >
              PDF
            </Button>
          </Box>
        </Box>

        {/* Table or Card View */}
        {loading ? (
          <Box textAlign="center" py={6}>
            <CircularProgress />
            <Typography mt={2} color="#64748b">
              Loading data...
            </Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box textAlign="center" py={6}>
            <SearchIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
            <Typography variant="h6" color="#64748b">
              No records found
            </Typography>
          </Box>
        ) : isMobile ? (
          <Box p={2}>
            {filtered.map((student) => (
              <MobileCardView key={student._id} student={student} />
            ))}
          </Box>
        ) : (
          <DesktopTableView />
        )}
      </Paper>
    </Box>
  );
};

export default StudentDetails;
