import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Grid,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Chip,
  Checkbox,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  InputAdornment,
} from "@mui/material";
import { motion } from "framer-motion";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchIcon from "@mui/icons-material/Search";

/* 🔹 Toast Config */
const toastConfig = {
  position: "top-center",
  autoClose: 2500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/* 🔹 Compare ONLY Dates */
const isWithinDateRange = (req, fromDate, toDate) => {
  if (!fromDate || !toDate) return false;

  const reqDate = new Date(req.leavingDate);
  const start = new Date(fromDate);
  const end = new Date(toDate);

  // normalize time
  reqDate.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return reqDate >= start && reqDate <= end;
};

function RequestBulkApproval() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [data, setData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [loadingMap, setLoadingMap] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Search input state

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com/messcut";
  const USER_API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

  const getParentStatusChip = (status) => {
    switch (status) {
      case "APPROVE":
        return <Chip label="Approved" color="success" size="small" />;
      case "REJECT":
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label="Pending" color="warning" size="small" variant="outlined" />;
    }
  };

  /* 🟢 Fetch ALL Students Map */
  const fetchAllStudentsMap = async () => {
    try {
      setLoadingMap(true);
      const res = await axios.get(`${USER_API_URL}/users/map`);
      
      if (res.data && res.data.success) {
        setStudentsMap(res.data.data || {});
        toast.success(`✅ Loaded ${res.data.count} students data`, {
          ...toastConfig,
          autoClose: 2000,
        });
      }
    } catch (error) {
      console.error("❌ Error fetching students map:", error);
      toast.error("❌ Failed to load students data", toastConfig);
    } finally {
      setLoadingMap(false);
    }
  };

  /* 🟢 Fetch Pending Requests */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/all`);
        toast.dismiss();

        if (res.data.success) {
          const pending = (res.data.data || []).filter((r) => r.status === "Pending");
          setData(pending);
          await fetchAllStudentsMap();

          if (pending.length > 0) {
            toast.info(`📦 ${pending.length} pending requests loaded`, {
              ...toastConfig,
            });
          }
        }
      } catch (err) {
        console.error("❌ Fetch Error:", err);
        toast.error("🚨 Server connection failed", toastConfig);
      }
    };

    fetchData();
  }, []);

  /* 🔸 Filter Data by Date Range */
  const handleLoadData = () => {
    toast.dismiss();

    if (!fromDate || !toDate)
      return toast.warn("⚠️ Please select From Date and To Date", toastConfig);

    if (new Date(fromDate) > new Date(toDate))
      return toast.error("🚫 From Date cannot be after To Date!", toastConfig);

    const result = data.filter((req) =>
      isWithinDateRange(req, fromDate, toDate)
    );

    // Apply search filter if search term exists
    const finalResult = searchTerm ? filterBySearch(result) : result;

    setFiltered(finalResult);
    setSelectedIds([]);

    if (finalResult.length > 0) {
      toast.success(`✅ ${finalResult.length} record(s) found`, toastConfig);
    } else {
      toast.warning("ℹ️ No requests found", toastConfig);
    }
  };

  /* 🔸 Filter by Search Term */
  const filterBySearch = (requests) => {
    if (!searchTerm.trim()) return requests;

    const term = searchTerm.toLowerCase().trim();
    
    return requests.filter(req => {
      const admissionNumber = req.admissionNumber || req.admissionNo;
      const student = studentsMap[admissionNumber];
      
      // Search in messcut request fields
      const nameMatch = req.name?.toLowerCase().includes(term);
      const admissionMatch = admissionNumber?.toLowerCase().includes(term);
      
      // Search in student database fields
      const semMatch = student?.sem?.toLowerCase().includes(term);
      const roomMatch = student?.roomNo?.toLowerCase().includes(term);
      const branchMatch = student?.branch?.toLowerCase().includes(term);
      
      return nameMatch || admissionMatch || semMatch || roomMatch || branchMatch;
    });
  };

  /* 🔸 Handle Search */
  const handleSearch = () => {
    if (!fromDate || !toDate) {
      toast.warn("⚠️ Please select date range first", toastConfig);
      return;
    }

    const result = data.filter((req) =>
      isWithinDateRange(req, fromDate, toDate)
    );

    const filteredResults = filterBySearch(result);
    setFiltered(filteredResults);
    setSelectedIds([]);

    if (filteredResults.length > 0) {
      toast.success(`🔍 Found ${filteredResults.length} record(s)`, toastConfig);
    } else {
      toast.warning("🔍 No matching records found", toastConfig);
    }
  };

  /* 🔸 Clear All Filters */
  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setSearchTerm("");
    setFiltered([]);
    setSelectedIds([]);
    toast.info("🧹 All filters cleared", toastConfig);
  };

  /* 🔸 Refresh students map */
  const handleRefreshMap = async () => {
    toast.info("🔄 Refreshing students data...", toastConfig);
    await fetchAllStudentsMap();
  };

  /* 🔸 Select Handlers */
  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map((r) => r._id));
  };

  /* 🔸 Get Student Details */
  const getStudentDetails = (req) => {
    const admissionNumber = req.admissionNumber || req.admissionNo;
    
    if (!admissionNumber) {
      return {
        name: req.name,
        sem: "No Adm No",
        branch: "No Adm No",
        year: "No Adm No",
        roomNo: "No Adm No",
        found: false,
        noAdmission: true
      };
    }

    if (loadingMap) {
      return {
        name: req.name,
        sem: <CircularProgress size={16} />,
        branch: <CircularProgress size={16} />,
        year: <CircularProgress size={16} />,
        roomNo: <CircularProgress size={16} />,
        loading: true,
        found: false,
        noAdmission: false
      };
    }

    const student = studentsMap[admissionNumber];
    
    if (!student) {
      return {
        name: req.name,
        sem: "Not Found",
        branch: "Not Found",
        year: "Not Found",
        roomNo: "Not Found",
        found: false,
        noAdmission: false
      };
    }

    return {
      name: student.name || req.name,
      sem: student.sem || "N/A",
      branch: student.branch || "N/A",
      year: student.year || "N/A",
      roomNo: student.roomNo || "N/A",
      found: true,
      noAdmission: false
    };
  };

  /* 🔸 Bulk Update */
  const handleBulkUpdate = async (status) => {
    if (selectedIds.length === 0)
      return toast.warning("⚠️ No records selected", toastConfig);

    toast.info(
      <div style={{ textAlign: "center" }}>
        <p style={{ fontWeight: 600, marginBottom: "8px" }}>
          Are you sure you want to <b>{status}</b> {selectedIds.length} request(s)?
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <Button
            variant="contained"
            color={status === "ACCEPT" ? "success" : "error"}
            size="small"
            onClick={async () => {
              toast.dismiss();
              try {
                for (const id of selectedIds) {
                  await axios.put(`${API_URL}/status/${id}`, { status });
                }
                toast.success(
                  `✅ ${selectedIds.length} request(s) ${status}ED successfully!`,
                  toastConfig
                );
                const updated = filtered.filter((req) => !selectedIds.includes(req._id));
                setFiltered(updated);
                setData((prev) => prev.filter((req) => !selectedIds.includes(req._id)));
                setSelectedIds([]);
              } catch (err) {
                console.error("❌ Bulk update error:", err);
                toast.error("❌ Failed to update status", toastConfig);
              }
            }}
          >
            Yes
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={() => toast.dismiss()}
          >
            No
          </Button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        position: "top-center",
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <ToastContainer />
      <Box
        sx={{
          bgcolor: "#f8fafc",
          minHeight: "100vh",
          p: { xs: 2, sm: 3, md: 4 },
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          textAlign="center"
          sx={{
            mb: 4,
            background: "linear-gradient(135deg, #1e3c72, #2a5298)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Mess cut Bulk Approval
        </Typography>

        {/* ===== Search and Filter Section ===== */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Date Filters */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Grid>

            {/* Search Field */}
            <Grid item xs={12} sm={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by Name, Admission, Sem, Room, Branch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={6} sm={4} md={1}>
              <Button fullWidth variant="contained" onClick={handleLoadData}>
                Load
              </Button>
            </Grid>

            <Grid item xs={6} sm={4} md={1}>
              <Button fullWidth variant="outlined" onClick={handleClearFilters}>
                Clear
              </Button>
            </Grid>
          </Grid>

          {/* Search Tips */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            💡 Search by: Name, Admission Number, Semester, Room No, or Branch
          </Typography>
        </Paper>

        {/* ===== Status Info ===== */}
        {filtered.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Typography variant="body2">
                  Showing <strong>{filtered.length}</strong> requests
                </Typography>
              </Grid>
              <Grid item>
                <Chip 
                  label={`${Object.keys(studentsMap).length} students loaded`} 
                  size="small" 
                  color="success"
                  variant="outlined"
                />
              </Grid>
              <Grid item>
                <Button 
                  size="small" 
                  variant="text" 
                  onClick={handleRefreshMap}
                  disabled={loadingMap}
                >
                  {loadingMap ? <CircularProgress size={16} /> : "⟳ Refresh Data"}
                </Button>
              </Grid>
            </Grid>
          </Alert>
        )}

        {/* ===== Data Table ===== */}
        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f0f4ff" }}>
                  <TableCell align="center">
                    <Checkbox
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < filtered.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  {[
                    "#",
                    "Name",
                    "Admission No",
                    "Sem",
                    "Branch",
                    "Year",
                    "Room No",
                    "Leaving Date",
                    "Leaving Time",
                    "Returning Date",
                    "Returning Time",
                    "Parent Status",
                    "Admin Status",
                  ].map((head) => (
                    <TableCell key={head} align="center" sx={{ fontWeight: "bold" }}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((req, index) => {
                    const admissionNumber = req.admissionNumber || req.admissionNo;
                    const studentDetails = getStudentDetails(req);
                    
                    return (
                      <TableRow 
                        key={req._id} 
                        hover
                        sx={{ 
                          bgcolor: studentDetails.found ? '#f8f9fa' : 
                                  studentDetails.noAdmission ? '#fff5f5' : 
                                  '#fff8dd'
                        }}
                      >
                        <TableCell align="center">
                          <Checkbox
                            checked={selectedIds.includes(req._id)}
                            onChange={() => handleSelect(req._id)}
                          />
                        </TableCell>
                        <TableCell align="center">{index + 1}</TableCell>
                        
                        {/* Name */}
                        <TableCell align="center">
                          <Typography fontWeight="medium">
                            {req.name}
                          </Typography>
                          {studentDetails.found && studentDetails.name !== req.name && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              DB: {studentDetails.name}
                            </Typography>
                          )}
                        </TableCell>
                        
                        {/* Admission Number */}
                        <TableCell align="center">
                          <Chip 
                            label={admissionNumber || "N/A"} 
                            color={
                              studentDetails.found ? "primary" :
                              studentDetails.noAdmission ? "error" : "warning"
                            } 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        
                        {/* Semester */}
                        <TableCell align="center">
                          {typeof studentDetails.sem === 'string' ? (
                            <Chip 
                              label={studentDetails.sem} 
                              color={
                                studentDetails.found ? "success" :
                                studentDetails.noAdmission ? "error" : "warning"
                              } 
                              size="small"
                            />
                          ) : (
                            studentDetails.sem
                          )}
                        </TableCell>

                        {/* Branch */}
                        <TableCell align="center">
                          <Typography 
                            color={
                              studentDetails.found ? "text.primary" :
                              studentDetails.noAdmission ? "error.main" : "warning.main"
                            }
                            fontWeight={studentDetails.found ? "medium" : "normal"}
                          >
                            {studentDetails.branch}
                          </Typography>
                        </TableCell>

                        {/* Year */}
                        <TableCell align="center">
                          <Typography 
                            color={
                              studentDetails.found ? "text.primary" :
                              studentDetails.noAdmission ? "error.main" : "warning.main"
                            }
                          >
                            {studentDetails.year}
                          </Typography>
                        </TableCell>

                        {/* Room No */}
                        <TableCell align="center">
                          <Typography 
                            color={
                              studentDetails.found ? "text.primary" :
                              studentDetails.noAdmission ? "error.main" : "warning.main"
                            }
                          >
                            {studentDetails.roomNo}
                          </Typography>
                        </TableCell>

                        {/* Messcut Details */}
                        <TableCell align="center">{req.leavingDate}</TableCell>
                        <TableCell align="center">{req.leavingTime}</TableCell>
                        <TableCell align="center">{req.returningDate}</TableCell>
                        <TableCell align="center">{req.returningTime}</TableCell>
                        
                        {/* Parent Status */}
                        <TableCell align="center">
                          {getParentStatusChip(req.parentStatus)}
                        </TableCell>
                        
                        {/* Admin Status */}
                        <TableCell align="center">
                          <Chip
                            label={req.status}
                            color={
                              req.status === "ACCEPT"
                                ? "success"
                                : req.status === "REJECT"
                                ? "error"
                                : "warning"
                            }
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell align="center" colSpan={14}>
                      {loadingMap ? (
                        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                          <CircularProgress />
                          <Typography mt={2}>Loading data...</Typography>
                        </Box>
                      ) : (
                        <Box textAlign="center" py={4}>
                          <Typography color="text.secondary">
                            No requests found
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Select date range and click "Load" or use search
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ===== Action Buttons ===== */}
        {filtered.length > 0 && (
          <Box mt={3} display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              color="success"
              onClick={() => handleBulkUpdate("ACCEPT")}
              disabled={selectedIds.length === 0}
              startIcon={<span>✅</span>}
              size="large"
            >
              Accept Selected ({selectedIds.length})
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleBulkUpdate("REJECT")}
              disabled={selectedIds.length === 0}
              startIcon={<span>❌</span>}
              size="large"
            >
              Reject Selected ({selectedIds.length})
            </Button>
          </Box>
        )}

        {/* ===== Quick Stats ===== */}
        {filtered.length > 0 && (
          <Paper sx={{ p: 1.5, mt: 3, bgcolor: '#f8f9fa' }}>
            <Grid container spacing={1} justifyContent="center">
              <Grid item>
                <Chip label={`Total: ${data.length}`} size="small" />
              </Grid>
              <Grid item>
                <Chip label={`Showing: ${filtered.length}`} size="small" color="primary" />
              </Grid>
              <Grid item>
                <Chip label={`Selected: ${selectedIds.length}`} size="small" color="secondary" />
              </Grid>
              <Grid item>
                <Chip 
                  label={`Students DB: ${Object.keys(studentsMap).length}`} 
                  size="small" 
                  color="success" 
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </motion.div>
  );
}

export default RequestBulkApproval;