import React, { useEffect, useState, useMemo } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Badge,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Alert,
  Menu,
  MenuItem,
  Fade,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BadgeIcon from "@mui/icons-material/Badge";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import GroupIcon from "@mui/icons-material/Group";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import { motion } from "framer-motion";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const StudentDetails = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedAdmissionNo, setSelectedAdmissionNo] = useState(null);
  const [expandedAdmissionNos, setExpandedAdmissionNos] = useState({});
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [viewMode, setViewMode] = useState("grouped");
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

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

  // 🟣 Update Status (Approve/Reject)
  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/apology/update/${id}`, { status });
      fetchStudents();
    } catch (err) {
      console.error("❌ Error updating status:", err);
    }
  };

  // 🟡 Bulk Update Status
  const handleBulkStatusUpdate = async () => {
    try {
      const promises = selectedRequests.map(id =>
        axios.put(`${API_URL}/api/apology/update/${id}`, { status: bulkStatus })
      );
      await Promise.all(promises);
      fetchStudents();
      setSelectedRequests([]);
      setBulkActionDialog(false);
      setBulkStatus("");
    } catch (err) {
      console.error("❌ Error updating bulk status:", err);
    }
  };

  // 🔍 Filter Search
  const filtered = useMemo(() => {
    let result = students.filter(
      (s) =>
        s.admissionNo?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        s.roomNo?.toLowerCase().includes(search.toLowerCase()) ||
        s.reason?.toLowerCase().includes(search.toLowerCase())
    );

    if (filterStatus !== "all") {
      result = result.filter(s => s.status === filterStatus);
    }

    return result;
  }, [students, search, filterStatus]);

  // 📊 Group by Admission Number
  const groupedByAdmissionNo = useMemo(() => {
    const groups = {};
    filtered.forEach(student => {
      const key = student.admissionNo;
      if (!groups[key]) {
        groups[key] = {
          studentName: student.studentName,
          roomNo: student.roomNo,
          requests: [],
          counts: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          }
        };
      }
      groups[key].requests.push(student);
      groups[key].counts.total++;

      switch (student.status) {
        case 'Pending': groups[key].counts.pending++; break;
        case 'Approved': groups[key].counts.approved++; break;
        case 'Rejected': groups[key].counts.rejected++; break;
      }
    });
    return groups;
  }, [filtered]);

  // 📋 Get all grouped admission numbers
  const admissionNumbers = Object.keys(groupedByAdmissionNo);

  // 🔄 Toggle expand/collapse for admission number
  const toggleAdmissionNo = (admissionNo) => {
    setExpandedAdmissionNos(prev => ({
      ...prev,
      [admissionNo]: !prev[admissionNo]
    }));
  };

  // ✅ Select/Deselect all requests for admission number
  const toggleSelectAllRequests = (admissionNo) => {
    const group = groupedByAdmissionNo[admissionNo];
    const pendingIds = group.requests
      .filter(r => r.status === "Pending")
      .map(r => r._id);

    if (pendingIds.length === 0) return;

    if (pendingIds.every(id => selectedRequests.includes(id))) {
      setSelectedRequests(prev => prev.filter(id => !pendingIds.includes(id)));
    } else {
      setSelectedRequests(prev => [...new Set([...prev, ...pendingIds])]);
    }
  };

  // ✅ Select/Deselect single request
  const toggleSelectRequest = (id) => {
    setSelectedRequests(prev =>
      prev.includes(id)
        ? prev.filter(requestId => requestId !== id)
        : [...prev, id]
    );
  };

  // 🎨 Status Chip Colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return { bg: "#d4edda", color: "#155724", icon: <CheckCircleIcon /> };
      case "Rejected":
        return { bg: "#f8d7da", color: "#721c24", icon: <CancelIcon /> };
      default:
        return { bg: "#fff3cd", color: "#856404", icon: <PendingActionsIcon /> };
    }
  };

  // 📱 Open View Details Dialog
  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setViewDialog(true);
  };

  // 📊 Export to Excel
  const exportToExcel = async () => {
    if (!filtered.length) {
      alert("No data to export!");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Apology Requests');

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

          if (colIndex === 7) {
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
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: index % 2 === 0 ? 'F8F9FA' : 'FFFFFF' }
            };
          }
        });

        currentRow++;
      });

      worksheet.columns = [
        { width: 8 },
        { width: 18 },
        { width: 25 },
        { width: 12 },
        { width: 40 },
        { width: 20 },
        { width: 22 },
        { width: 15 }
      ];

      worksheet.views = [
        { state: 'frozen', ySplit: headerRowNum }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(blob, `Apology_Requests_${new Date().getTime()}.xlsx`);
      setExportMenuAnchor(null);

    } catch (error) {
      console.error('Excel export error:', error);
      alert('Failed to generate Excel file. Please try again.');
    }
  };

  // 📄 Export to PDF
  const exportToPDF = () => {
    if (!filtered.length) {
      alert("No data to export!");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.width;

    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, pageWidth, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("JYOTHI ENGINEERING COLLEGE", pageWidth / 2, 8, { align: "center" });

    doc.setFontSize(11);
    doc.text("Student Apology Management Report", pageWidth / 2, 15, { align: "center" });

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
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 55 },
        5: { cellWidth: 25 },
        6: { cellWidth: 30 },
        7: { cellWidth: 20 },
      },
      margin: { left: 10, right: 10 },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 200, { align: "center" });
      doc.text("Confidential — Jyothi Engineering College", 10, 200);
    }

    doc.save(`Apology_Requests_${new Date().toISOString().split("T")[0]}.pdf`);
    setExportMenuAnchor(null);
  };

  // ============================
  // 📱 RESPONSIVE CARD VIEW - GROUPED BY ADMISSION
  // ============================
  const MobileGroupCardView = ({ admissionNo, group }) => {
    const isExpanded = expandedAdmissionNos[admissionNo];
    const pendingCount = group.counts.pending;
    const pendingIds = group.requests.filter(r => r.status === "Pending").map(r => r._id);
    const allSelected = pendingIds.length > 0 && pendingIds.every(id => selectedRequests.includes(id));

    return (
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          border: pendingCount > 0 ? "2px solid #f59e0b" : "1px solid #e2e8f0",
          background: "#ffffff",
          overflow: 'hidden',
        }}
      >
        <CardContent>
          {/* Group Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleAdmissionNo(admissionNo)}
          >
            <Box flex={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BadgeIcon sx={{ fontSize: 20, color: "#0c5fbd" }} />
                <Box>
                  <Typography variant="h6" fontWeight="700" color="#1e293b">
                    {admissionNo}
                  </Typography>
                  <Typography variant="body2" color="#64748b">
                    {group.studentName} • Room: {group.roomNo}
                  </Typography>
                </Box>
              </Stack>

              {/* Status Counts */}
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={0.5}>
                <Chip
                  label={`Total: ${group.counts.total}`}
                  size="small"
                  sx={{ backgroundColor: '#e2e8f0', fontWeight: 600 }}
                />
                <Chip
                  label={`Pending: ${group.counts.pending}`}
                  size="small"
                  sx={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontWeight: 600
                  }}
                />
                <Chip
                  label={`Approved: ${group.counts.approved}`}
                  size="small"
                  sx={{
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    fontWeight: 600
                  }}
                />
                <Chip
                  label={`Rejected: ${group.counts.rejected}`}
                  size="small"
                  sx={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    fontWeight: 600
                  }}
                />
              </Stack>
            </Box>

            <IconButton size="small">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Selection Checkbox */}
          {pendingCount > 0 && (
            <Box display="flex" alignItems="center" mt={1}>
              <Checkbox
                checked={allSelected}
                onChange={() => toggleSelectAllRequests(admissionNo)}
                size="small"
                disabled={pendingCount === 0}
              />
              <Typography variant="body2" color="#64748b">
                {pendingCount} pending request{pendingCount > 1 ? 's' : ''} available
              </Typography>
            </Box>
          )}

          {/* Bulk Action Buttons */}
          {selectedRequests.filter(id =>
            group.requests.some(r => r._id === id)
          ).length > 0 && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1}>
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={() => {
                    setBulkStatus("Approved");
                    setBulkActionDialog(true);
                  }}
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Approve Selected
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  onClick={() => {
                    setBulkStatus("Rejected");
                    setBulkActionDialog(true);
                  }}
                  startIcon={<CancelIcon />}
                  sx={{
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Reject Selected
                </Button>
              </Stack>
            )}

          {/* Expanded List of Requests */}
          <Collapse in={isExpanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="#64748b" gutterBottom>
              All Apology Requests ({group.requests.length})
            </Typography>

            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {group.requests.map((request, index) => {
                const statusColor = getStatusColor(request.status);

                return (
                  <ListItem
                    key={request._id}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        {request.status === "Pending" && (
                          <Checkbox
                            checked={selectedRequests.includes(request._id)}
                            onChange={() => toggleSelectRequest(request._id)}
                            size="small"
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(request)}
                        >
                          <VisibilityIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    }
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#f8fafc' : 'transparent',
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                  >
                    <ListItemIcon>
                      <Badge
                        badgeContent={index + 1}
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.6rem',
                            height: 16,
                            minWidth: 16,
                          }
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="500" component="div">
                          {request.reason?.substring(0, 50) || 'No reason provided'}...
                        </Typography>
                      }
                      secondary={
                        <Box component="div" sx={{ mt: 0.5 }}>
                          <Stack direction="column" spacing={0.5}>
                            <Typography variant="caption" color="#64748b" component="div">
                              {request.submittedBy} • {request.submittedAt}
                            </Typography>
                            <Chip
                              label={request.status}
                              size="small"
                              sx={{
                                backgroundColor: statusColor.bg,
                                color: statusColor.color,
                                fontSize: '0.6rem',
                                height: 20,
                                width: 'fit-content'
                              }}
                            />
                          </Stack>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>

            {/* Individual Action Buttons for Pending Requests */}
            {group.requests.filter(r => r.status === "Pending").length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="#64748b" gutterBottom>
                  Quick Actions:
                </Typography>
                <Grid container spacing={1}>
                  {group.requests
                    .filter(r => r.status === "Pending")
                    .map(request => (
                      <Grid item xs={12} key={request._id}>
                        <Paper variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
                          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
                            <Typography variant="body2" sx={{ flex: 1, mr: 1 }}>
                              {request.reason?.substring(0, isMobile ? 30 : 40) || 'No reason'}...
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStatusUpdate(request._id, "Approved")}
                                startIcon={<CheckCircleIcon />}
                                sx={{
                                  background: "#10b981",
                                  textTransform: "none",
                                  fontSize: '0.7rem',
                                  minWidth: isMobile ? 70 : 80,
                                }}
                              >
                                {isMobile ? "Approve" : "Approve"}
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStatusUpdate(request._id, "Rejected")}
                                startIcon={<CancelIcon />}
                                sx={{
                                  background: "#ef4444",
                                  textTransform: "none",
                                  fontSize: '0.7rem',
                                  minWidth: isMobile ? 70 : 80,
                                }}
                              >
                                {isMobile ? "Reject" : "Reject"}
                              </Button>
                            </Stack>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                </Grid>
              </>
            )}
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  // ============================
  // 🖥️ DESKTOP TABLE VIEW - GROUPED
  // ============================
  const DesktopGroupedView = () => {
    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{
              background: 'linear-gradient(135deg, #0c5fbd 0%, #0889f3 100%)',
              '& th': {
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
                borderBottom: 'none',
                py: 2,
                textAlign: 'center'
              }
            }}>
              <TableCell>#</TableCell>
              <TableCell>Admission No & Student</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Total Requests</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>Approved</TableCell>
              <TableCell>Rejected</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admissionNumbers.map((admissionNo, index) => {
              const group = groupedByAdmissionNo[admissionNo];
              const isExpanded = expandedAdmissionNos[admissionNo];

              return (
                <React.Fragment key={admissionNo}>
                  {/* Group Row */}
                  <TableRow
                    hover
                    sx={{
                      backgroundColor: isExpanded ? '#f0f9ff' : 'transparent',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f8fafc' }
                    }}
                    onClick={() => toggleAdmissionNo(admissionNo)}
                  >
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body1" fontWeight="700" color="#0c5fbd">
                          {admissionNo}
                        </Typography>
                        <Typography variant="body2" color="#64748b">
                          {group.studentName}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={group.roomNo}
                        size="small"
                        sx={{ backgroundColor: '#e0f2fe', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Badge
                        badgeContent={group.counts.total}
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.75rem',
                            height: 24,
                            minWidth: 24,
                          }
                        }}
                      >
                        <GroupIcon sx={{ color: '#0c5fbd' }} />
                      </Badge>
                    </TableCell>
                    <TableCell align="center">
                      {group.counts.pending > 0 ? (
                        <Chip
                          label={group.counts.pending}
                          size="small"
                          sx={{
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 700
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="#94a3b8">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {group.counts.approved > 0 ? (
                        <Chip
                          label={group.counts.approved}
                          size="small"
                          sx={{
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            fontWeight: 700
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="#94a3b8">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {group.counts.rejected > 0 ? (
                        <Chip
                          label={group.counts.rejected}
                          size="small"
                          sx={{
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontWeight: 700
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="#94a3b8">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAdmissionNo(admissionNo);
                          }}
                          startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ textTransform: 'none' }}
                        >
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </Button>
                        {group.counts.pending > 0 && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              const pendingIds = group.requests
                                .filter(r => r.status === "Pending")
                                .map(r => r._id);
                              setSelectedRequests(prev => [...new Set([...prev, ...pendingIds])]);
                              setBulkStatus("Approved");
                              setBulkActionDialog(true);
                            }}
                            sx={{
                              background: "linear-gradient(135deg, #0c5fbd 0%, #0889f3 100%)",
                              textTransform: "none",
                            }}
                          >
                            Approve All
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Details Row */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ backgroundColor: '#f8fafc', py: 2 }}>
                        <Box sx={{ pl: 4 }}>
                          <Typography variant="subtitle2" color="#64748b" gutterBottom>
                            All Apology Requests for {admissionNo}:
                          </Typography>

                          {/* Selection Checkbox */}
                          {group.counts.pending > 0 && (
                            <Box display="flex" alignItems="center" mb={2}>
                              <Checkbox
                                checked={group.requests
                                  .filter(r => r.status === "Pending")
                                  .every(r => selectedRequests.includes(r._id))}
                                onChange={() => toggleSelectAllRequests(admissionNo)}
                                size="small"
                              />
                              <Typography variant="body2" color="#64748b">
                                Select all {group.counts.pending} pending requests
                              </Typography>
                            </Box>
                          )}

                          {/* Requests Table */}
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: '#e2e8f0' }}>
                                <TableCell width="50px">#</TableCell>
                                <TableCell>Reason</TableCell>
                                <TableCell width="120px">Submitted By</TableCell>
                                <TableCell width="150px">Submitted At</TableCell>
                                <TableCell width="100px">Status</TableCell>
                                <TableCell width="200px" align="center">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {group.requests.map((request, idx) => {
                                const statusColor = getStatusColor(request.status);

                                return (
                                  <TableRow key={request._id} hover>
                                    <TableCell>
                                      <Box display="flex" alignItems="center">
                                        {request.status === "Pending" && (
                                          <Checkbox
                                            checked={selectedRequests.includes(request._id)}
                                            onChange={() => toggleSelectRequest(request._id)}
                                            size="small"
                                          />
                                        )}
                                        <Typography variant="body2" ml={request.status === "Pending" ? 1 : 3}>
                                          {idx + 1}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Tooltip title={request.reason}>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                                          {request.reason}
                                        </Typography>
                                      </Tooltip>
                                    </TableCell>
                                    <TableCell>{request.submittedBy}</TableCell>
                                    <TableCell>{request.submittedAt}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label={request.status}
                                        size="small"
                                        sx={{
                                          backgroundColor: statusColor.bg,
                                          color: statusColor.color,
                                          fontWeight: 600,
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="center">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleViewDetails(request)}
                                          sx={{ color: '#0369a1' }}
                                        >
                                          <VisibilityIcon />
                                        </IconButton>
                                        {request.status === "Pending" && (
                                          <>
                                            <Button
                                              variant="contained"
                                              size="small"
                                              onClick={() => handleStatusUpdate(request._id, "Approved")}
                                              startIcon={<CheckCircleIcon />}
                                              sx={{
                                                background: "#10b981",
                                                textTransform: "none",
                                                fontSize: '0.75rem',
                                              }}
                                            >
                                              Approve
                                            </Button>
                                            <Button
                                              variant="contained"
                                              size="small"
                                              onClick={() => handleStatusUpdate(request._id, "Rejected")}
                                              startIcon={<CancelIcon />}
                                              sx={{
                                                background: "#ef4444",
                                                textTransform: "none",
                                                fontSize: '0.75rem',
                                              }}
                                            >
                                              Reject
                                            </Button>
                                          </>
                                        )}
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // ============================
  // 📱 ALL REQUESTS VIEW (Non-grouped)
  // ============================
  const AllRequestsView = () => {
    if (isMobile) {
      return (
        <Box>
          {filtered.map((student) => (
            <Card
              key={student._id}
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{
                mb: 2,
                border: `1px solid ${student.status === "Approved" ? "#c6f6d5" :
                    student.status === "Rejected" ? "#fed7d7" : "#fed7aa"
                  }`,
                background: student.status === "Approved" ? "#f0fff4" :
                  student.status === "Rejected" ? "#fff5f5" : "#fffaf0",
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" fontWeight="600">
                        {student.studentName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {student.admissionNo}
                      </Typography>
                    </Box>
                    <Chip
                      icon={getStatusColor(student.status).icon}
                      label={student.status}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(student.status).bg,
                        color: getStatusColor(student.status).color,
                        fontWeight: 600,
                      }}
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
                    flexDirection={{ xs: "column", sm: "row" }}
                    gap={1}
                  >
                    <Box display="flex" gap={1} alignItems="center">
                      <CalendarTodayIcon sx={{ fontSize: 16, color: "#64748b" }} />
                      <Typography variant="caption" color="text.secondary">
                        {student.submittedAt}
                      </Typography>
                    </Box>
                    {student.status === "Pending" && (
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} width={{ xs: "100%", sm: "auto" }}>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth={isMobile}
                          onClick={() =>
                            handleStatusUpdate(student._id, "Approved")
                          }
                          startIcon={<CheckCircleIcon />}
                          sx={{
                            background: "#10b981",
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth={isMobile}
                          onClick={() =>
                            handleStatusUpdate(student._id, "Rejected")
                          }
                          startIcon={<CancelIcon />}
                          sx={{
                            background: "#ef4444",
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: "linear-gradient(135deg, #0c5fbd 0%, #0889f3 100%)",
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
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row, index) => {
              const statusColor = getStatusColor(row.status);
              return (
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
                      sx={{
                        backgroundColor: statusColor.bg,
                        color: statusColor.color,
                        fontWeight: 600,
                      }}
                      icon={statusColor.icon}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(row)}
                        sx={{ color: '#0369a1' }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {row.status === "Pending" && (
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                              handleStatusUpdate(row._id, "Approved")
                            }
                            startIcon={<CheckCircleIcon />}
                            sx={{
                              background: "#10b981",
                              textTransform: "none",
                              fontSize: '0.75rem',
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                              handleStatusUpdate(row._id, "Rejected")
                            }
                            startIcon={<CancelIcon />}
                            sx={{
                              background: "#ef4444",
                              textTransform: "none",
                              fontSize: '0.75rem',
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // ============================
  // 📊 BULK ACTION DIALOG
  // ============================
  const BulkActionDialog = () => (
    <Dialog
      open={bulkActionDialog}
      onClose={() => setBulkActionDialog(false)}
      TransitionComponent={Fade}
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          {bulkStatus === "Approved" ? (
            <CheckCircleIcon sx={{ color: '#10b981' }} />
          ) : (
            <CancelIcon sx={{ color: '#ef4444' }} />
          )}
          <Typography variant="h6">
            {bulkStatus === "Approved" ? "Approve Selected" : "Reject Selected"} Requests
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          You are about to {bulkStatus.toLowerCase()} {selectedRequests.length} apology request(s).
          This action cannot be undone.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Selected Requests: {selectedRequests.length}
        </Typography>
        <List dense sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
          {selectedRequests.slice(0, 10).map((id, index) => {
            const request = students.find(s => s._id === id);
            return request ? (
              <ListItem key={id}>
                <ListItemText
                  primary={`${index + 1}. ${request.reason?.substring(0, 60) || 'No reason'}...`}
                  secondary={`${request.admissionNo} • ${request.studentName}`}
                />
              </ListItem>
            ) : null;
          })}
          {selectedRequests.length > 10 && (
            <ListItem>
              <ListItemText
                primary={`... and ${selectedRequests.length - 10} more`}
                sx={{ fontStyle: 'italic', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1 }}>
        <Button onClick={() => setBulkActionDialog(false)} fullWidth={isMobile}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleBulkStatusUpdate}
          color={bulkStatus === "Approved" ? "success" : "error"}
          fullWidth={isMobile}
        >
          Confirm {bulkStatus}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ============================
  // 📋 EXPORT MENU
  // ============================
  const ExportMenu = () => (
    <Menu
      anchorEl={exportMenuAnchor}
      open={Boolean(exportMenuAnchor)}
      onClose={() => setExportMenuAnchor(null)}
    >
      <MenuItem onClick={exportToExcel}>
        <FileDownloadIcon sx={{ mr: 1, color: '#0288d1' }} />
        Export to Excel
      </MenuItem>
      <MenuItem onClick={exportToPDF}>
        <PictureAsPdfIcon sx={{ mr: 1, color: '#d32f2f' }} />
        Export to PDF
      </MenuItem>
    </Menu>
  );

  // 📊 Statistics
  const totalPending = filtered.filter(s => s.status === "Pending").length;
  const totalApproved = filtered.filter(s => s.status === "Approved").length;
  const totalRejected = filtered.filter(s => s.status === "Rejected").length;

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
        variant={isMobile ? "h5" : isTablet ? "h4" : "h3"}
        textAlign="center"
        sx={{
          fontWeight: 800,
          background: "linear-gradient(135deg, #0c5fbd 0%, #0889f3 100%)",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          mb: 2,
        }}
      >
        Student Apology Management
      </Typography>

      {/* Statistics Bar */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Grid container spacing={2} textAlign="center">
          <Grid item xs={6} sm={3}>
            <Typography variant="h6" color="#0c5fbd" fontWeight="700">
              {admissionNumbers.length}
            </Typography>
            <Typography variant="caption" color="#64748b">
              Unique Students
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="h6" color="#0c5fbd" fontWeight="700">
              {filtered.length}
            </Typography>
            <Typography variant="caption" color="#64748b">
              Total Requests
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="h6" color="#f59e0b" fontWeight="700">
              {totalPending}
            </Typography>
            <Typography variant="caption" color="#64748b">
              Pending
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="h6" color="#10b981" fontWeight="700">
              {selectedRequests.length}
            </Typography>
            <Typography variant="caption" color="#64748b">
              Selected
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Card */}
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Search and Controls */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <Stack spacing={2}>
            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search by Admission No, Student Name, Room No, Reason..."
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#64748b" }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 1, backgroundColor: "white" },
              }}
            />

            {/* Control Buttons */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Button
                  variant={viewMode === "grouped" ? "contained" : "outlined"}
                  onClick={() => setViewMode("grouped")}
                  startIcon={<GroupIcon />}
                  sx={{
                    textTransform: "none",
                    minWidth: { xs: "100%", sm: "auto" }
                  }}
                  fullWidth={isMobile}
                >
                  {isMobile ? "Grouped" : "Grouped View"}
                </Button>
                <Button
                  variant={viewMode === "all" ? "contained" : "outlined"}
                  onClick={() => setViewMode("all")}
                  startIcon={<FilterListIcon />}
                  sx={{
                    textTransform: "none",
                    minWidth: { xs: "100%", sm: "auto" }
                  }}
                  fullWidth={isMobile}
                >
                  {isMobile ? "All" : "All Requests"}
                </Button>

                {/* Status Filter - Responsive */}
                <Box display="flex" gap={0.5} flexWrap="wrap">
                  <Chip
                    label="All"
                    variant={filterStatus === "all" ? "filled" : "outlined"}
                    onClick={() => setFilterStatus("all")}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label="Pending"
                    variant={filterStatus === "Pending" ? "filled" : "outlined"}
                    onClick={() => setFilterStatus("Pending")}
                    color="warning"
                    size="small"
                  />
                  <Chip
                    label="Approved"
                    variant={filterStatus === "Approved" ? "filled" : "outlined"}
                    onClick={() => setFilterStatus("Approved")}
                    color="success"
                    size="small"
                  />
                  <Chip
                    label="Rejected"
                    variant={filterStatus === "Rejected" ? "filled" : "outlined"}
                    onClick={() => setFilterStatus("Rejected")}
                    color="error"
                    size="small"
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} width={{ xs: "100%", sm: "auto" }}>
                {selectedRequests.length > 0 && (
                  <>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setBulkStatus("Approved");
                        setBulkActionDialog(true);
                      }}
                      startIcon={<CheckCircleIcon />}
                      sx={{
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        textTransform: "none",
                        width: { xs: "100%", sm: "auto" }
                      }}
                    >
                      {isMobile ? `Approve (${selectedRequests.length})` : `Approve (${selectedRequests.length})`}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setBulkStatus("Rejected");
                        setBulkActionDialog(true);
                      }}
                      startIcon={<CancelIcon />}
                      sx={{
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        textTransform: "none",
                        width: { xs: "100%", sm: "auto" }
                      }}
                    >
                      {isMobile ? `Reject (${selectedRequests.length})` : `Reject (${selectedRequests.length})`}
                    </Button>
                  </>
                )}
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                  sx={{
                    textTransform: "none",
                    width: { xs: "100%", sm: "auto" }
                  }}
                >
                  {isMobile ? "Export" : "Export"}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchStudents}
                  sx={{
                    textTransform: "none",
                    width: { xs: "100%", sm: "auto" }
                  }}
                >
                  {isMobile ? "Refresh" : "Refresh"}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Content Area */}
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          {loading ? (
            <Box textAlign="center" py={8}>
              <CircularProgress size={60} sx={{ color: '#0c5fbd' }} />
              <Typography mt={2} color="#64748b">
                Loading apology requests...
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Box textAlign="center" py={6}>
              <SearchIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
              <Typography variant="h6" color="#64748b">
                No apology requests found
              </Typography>
              <Typography variant="body2" color="#94a3b8" mt={1}>
                Try adjusting your search or filter
              </Typography>
            </Box>
          ) : viewMode === "grouped" ? (
            isMobile ? (
              <Box>
                <Typography variant="subtitle1" color="#64748b" mb={2}>
                  Showing {admissionNumbers.length} student(s) with {filtered.length} total requests
                </Typography>
                {admissionNumbers.map(admissionNo => (
                  <MobileGroupCardView
                    key={admissionNo}
                    admissionNo={admissionNo}
                    group={groupedByAdmissionNo[admissionNo]}
                  />
                ))}
              </Box>
            ) : (
              <DesktopGroupedView />
            )
          ) : (
            <AllRequestsView />
          )}
        </Box>
      </Paper>

      {/* Dialogs */}
      <BulkActionDialog />
      <ExportMenu />
    </Box>
  );
};

export default StudentDetails;