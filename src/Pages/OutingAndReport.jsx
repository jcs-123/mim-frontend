import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const API = "https://mim-backend-b5cd.onrender.com";

const OutingAndReport = () => {
  const [activeView, setActiveView] = useState("request");
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [parentStatusFilter, setParentStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate years (current year - 5 to current year + 1)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearList = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      yearList.push(i);
    }
    setYears(yearList);
  }, []);

  useEffect(() => {
    if (activeView === "request") fetchRequests();
    if (activeView === "report") fetchReports();
  }, [activeView, month, year]);

  // Reset pagination when view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeView]);

  // Filter requests based on search and filters
  useEffect(() => {
    if (activeView === "request") {
      let filtered = [...requests];
      
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(request => 
          request.studentName?.toLowerCase().includes(term) ||
          request.admissionNumber?.toLowerCase().includes(term) ||
          request.reason?.toLowerCase().includes(term)
        );
      }
      
      // Status filter
      if (statusFilter !== "ALL") {
        filtered = filtered.filter(request => request.adminStatus === statusFilter);
      }
      
      // Parent status filter
      if (parentStatusFilter !== "ALL") {
        filtered = filtered.filter(request => request.parentStatus === parentStatusFilter);
      }
      
      // Date filter
      if (dateFilter) {
        filtered = filtered.filter(request => {
          const requestDate = new Date(request.date).toISOString().split('T')[0];
          return requestDate === dateFilter;
        });
      }
      
      setFilteredRequests(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    }
  }, [requests, searchTerm, statusFilter, parentStatusFilter, dateFilter, activeView]);

  // Filter reports based on search
  useEffect(() => {
    if (activeView === "report") {
      let filtered = [...reports];
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(report => 
          report.studentName?.toLowerCase().includes(term) ||
          report._id?.toLowerCase().includes(term)
        );
      }
      
      setFilteredReports(filtered);
      setCurrentPage(1);
    }
  }, [reports, searchTerm, activeView]);

  /* ================= FETCH REQUESTS ================= */
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/outing/admin/all`);
      const sortedRequests = (res.data.data || []).sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );
      setRequests(sortedRequests);
      setFilteredRequests(sortedRequests);
    } catch {
      toast.error("Failed to load outing requests");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH REPORT ================= */
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/outing/admin/report`, {
        params: { month, year },
      });
      setReports(res.data.data || []);
      setFilteredReports(res.data.data || []);
    } catch {
      toast.error("Failed to load outing report");
    } finally {
      setLoading(false);
    }
  };

  /* ================= ADMIN DECISION ================= */
  const adminDecision = async (status) => {
    if (!selectedRequest) return;
    
    try {
      const response = await axios.put(`${API}/outing/admin/${selectedRequest._id}`, { 
        status,
        adminDecisionAt: new Date().toISOString()
      });
      
      if (response.data.success) {
        toast.success(response.data.message || `Request ${status.toLowerCase()} successfully!`);
        
        // Update the specific request in state
        setRequests(prevRequests => 
          prevRequests.map(req => 
            req._id === selectedRequest._id 
              ? { 
                ...req, 
                adminStatus: status, 
                adminDecisionAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
              : req
          )
        );
        
        setActionModal(false);
        setSelectedRequest(null);
      } else {
        toast.error(response.data.message || "Failed to update request");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${status.toLowerCase()} request`);
    }
  };

  /* ================= PAGINATION LOGIC ================= */
  const totalPages = useMemo(() => {
    const totalItems = activeView === "request" ? filteredRequests.length : filteredReports.length;
    return Math.ceil(totalItems / itemsPerPage);
  }, [filteredRequests.length, filteredReports.length, itemsPerPage, activeView]);

  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    if (activeView === "request") {
      return filteredRequests.slice(startIndex, endIndex);
    } else {
      return filteredReports.slice(startIndex, endIndex);
    }
  }, [currentPage, itemsPerPage, filteredRequests, filteredReports, activeView]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ================= EXPORT FUNCTIONS ================= */
  const exportToExcel = () => {
    const dataToExport = activeView === "request" ? filteredRequests : filteredReports;
    
    if (dataToExport.length === 0) {
      toast.warning("No data to export");
      return;
    }

    let worksheetData;
    
    if (activeView === "request") {
      worksheetData = dataToExport.map(item => ({
        "Student Name": item.studentName,
        "Admission Number": item.admissionNumber,
        "Date": new Date(item.date).toLocaleDateString(),
        "Leaving Time": item.leavingTime,
        "Returning Time": item.returningTime,
        "Reason": item.reason,
        "Parent Status": item.parentStatus,
        "Admin Status": item.adminStatus,
        "Created At": new Date(item.createdAt).toLocaleString(),
        "Updated At": item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-',
        "Admin Decision At": item.adminDecisionAt ? new Date(item.adminDecisionAt).toLocaleString() : '-'
      }));
    } else {
      worksheetData = dataToExport.map(item => ({
        "Student Name": item.studentName,
        "Admission Number": item._id,
        "Total Outings": item.totalOutings,
        "Month": month || "All Months",
        "Year": year,
        "Status": item.totalOutings > 0 ? "OUTING TAKEN" : "NO OUTINGS"
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeView === "request" ? "Outing Requests" : "Monthly Report");
    
    const fileName = activeView === "request" 
      ? `outing_requests_${new Date().toISOString().split('T')[0]}.xlsx`
      : `outing_report_${month || 'all'}_${year}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    toast.success("Data exported to Excel successfully!");
  };


  /* ================= GET STATUS STYLES ================= */
  const getStatusStyle = (status) => {
    const styles = {
      PENDING: {
        backgroundColor: "#fff3cd",
        color: "#856404",
        borderColor: "#ffeaa7",
        icon: "⏳"
      },
      APPROVED: {
        backgroundColor: "#d4edda",
        color: "#155724",
        borderColor: "#c3e6cb",
        icon: "✅"
      },
      REJECTED: {
        backgroundColor: "#f8d7da",
        color: "#721c24",
        borderColor: "#f5c6cb",
        icon: "❌"
      }
    };
    return styles[status] || styles.PENDING;
  };

  /* ================= GET STATUS BADGE ================= */
  const StatusBadge = ({ status, text }) => {
    const style = getStatusStyle(status);
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: isMobile ? "3px 8px" : "4px 12px",
        borderRadius: "20px",
        fontSize: isMobile ? "0.75rem" : "0.85rem",
        fontWeight: "600",
        border: `1px solid ${style.borderColor}`,
        backgroundColor: style.backgroundColor,
        color: style.color,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        whiteSpace: "nowrap"
      }}>
        <span>{style.icon}</span>
        <span>{text || status}</span>
      </div>
    );
  };

  /* ================= CLEAR FILTERS ================= */
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setParentStatusFilter("ALL");
    setDateFilter("");
    setCurrentPage(1);
  };

  /* ================= RESPONSIVE STYLES ================= */
  const styles = {
    container: {
      padding: isMobile ? "0.75rem" : "1.5rem",
      backgroundColor: "#f8f9fa",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflowX: "hidden"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: isMobile ? "1rem" : "1.5rem",
      paddingBottom: isMobile ? "0.5rem" : "0.75rem",
      borderBottom: "1px solid #dee2e6",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "0.5rem" : "0"
    },
    title: {
      color: "#2c3e50",
      fontSize: isMobile ? "1.2rem" : "1.5rem",
      fontWeight: "600",
      margin: "0",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    exportButtons: {
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
      justifyContent: isMobile ? "center" : "flex-end"
    },
    exportButton: {
      padding: isMobile ? "0.4rem 0.75rem" : "0.5rem 1rem",
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: isMobile ? "0.8rem" : "0.9rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem"
    },
    switchContainer: {
      display: "flex",
      gap: "0.5rem",
      marginBottom: isMobile ? "1rem" : "1.5rem",
      backgroundColor: "white",
      padding: isMobile ? "0.25rem" : "0.5rem",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      overflowX: "auto",
      whiteSpace: "nowrap",
      scrollbarWidth: "none",
      msOverflowStyle: "none"
    },
    switchButton: {
      padding: isMobile ? "0.5rem 1rem" : "0.75rem 1.5rem",
      border: "none",
      borderRadius: "6px",
      fontSize: isMobile ? "0.85rem" : "0.95rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      backgroundColor: "#e9ecef",
      color: "#6c757d",
      flexShrink: 0
    },
    activeSwitch: {
      backgroundColor: "#3498db",
      color: "white",
      boxShadow: "0 2px 4px rgba(52, 152, 219, 0.2)"
    },
    searchContainer: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "0.5rem" : "1rem",
      marginBottom: isMobile ? "1rem" : "1.5rem",
      alignItems: "stretch"
    },
    searchInput: {
      flex: 1,
      padding: isMobile ? "0.5rem 0.75rem" : "0.75rem 1rem",
      border: "2px solid #e9ecef",
      borderRadius: "6px",
      fontSize: isMobile ? "0.9rem" : "0.95rem",
      color: "#2c3e50",
      backgroundColor: "white",
      transition: "all 0.2s",
      outline: "none"
    },
    filterContainer: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "0.5rem" : "1rem",
      marginBottom: isMobile ? "1rem" : "1.5rem",
      alignItems: isMobile ? "stretch" : "center",
      flexWrap: "wrap"
    },
    filterGroup: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      gap: isMobile ? "0.25rem" : "0.5rem",
      minWidth: isMobile ? "100%" : "180px"
    },
    filterSelect: {
      padding: isMobile ? "0.5rem 0.75rem" : "0.6rem 0.8rem",
      border: "2px solid #e9ecef",
      borderRadius: "6px",
      fontSize: isMobile ? "0.85rem" : "0.9rem",
      color: "#2c3e50",
      backgroundColor: "white",
      cursor: "pointer",
      transition: "all 0.2s",
      outline: "none",
      width: isMobile ? "100%" : "auto",
      minWidth: "120px"
    },
    filterLabel: {
      color: "#495057",
      fontWeight: "600",
      fontSize: isMobile ? "0.85rem" : "0.9rem",
      marginBottom: isMobile ? "0.25rem" : "0",
      whiteSpace: "nowrap"
    },
    clearButton: {
      padding: isMobile ? "0.5rem 0.75rem" : "0.6rem 1rem",
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: isMobile ? "0.85rem" : "0.9rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem"
    },
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      border: "1px solid #e9ecef",
      overflowX: "auto",
      marginBottom: isMobile ? "1rem" : "1.5rem",
      WebkitOverflowScrolling: "touch"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: isMobile ? "0.8rem" : "0.9rem",
      minWidth: isMobile ? "800px" : "auto"
    },
    headerCell: {
      padding: isMobile ? "0.5rem" : "0.75rem",
      textAlign: "left",
      fontWeight: "600",
      fontSize: isMobile ? "0.75rem" : "0.85rem",
      color: "white",
      backgroundColor: "#2c3e50",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      whiteSpace: "nowrap"
    },
    tableCell: {
      padding: isMobile ? "0.5rem" : "0.75rem",
      textAlign: "left",
      borderBottom: "1px solid #e9ecef",
      verticalAlign: "top"
    },
    tableRow: {
      transition: "background-color 0.2s"
    },
    actionButtons: {
      display: "flex",
      gap: isMobile ? "0.25rem" : "0.5rem",
      flexWrap: "wrap"
    },
    approveButton: {
      padding: isMobile ? "0.3rem 0.6rem" : "0.4rem 0.8rem",
      backgroundColor: "#28a745",
      color: "white",
      border: "none",
      borderRadius: "4px",
      fontSize: isMobile ? "0.75rem" : "0.85rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      minWidth: isMobile ? "70px" : "90px",
      justifyContent: "center",
      flex: isMobile ? 1 : "none"
    },
    rejectButton: {
      padding: isMobile ? "0.3rem 0.6rem" : "0.4rem 0.8rem",
      backgroundColor: "#dc3545",
      color: "white",
      border: "none",
      borderRadius: "4px",
      fontSize: isMobile ? "0.75rem" : "0.85rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      minWidth: isMobile ? "70px" : "90px",
      justifyContent: "center",
      flex: isMobile ? 1 : "none"
    },
    changeButton: {
      padding: isMobile ? "0.3rem 0.6rem" : "0.4rem 0.8rem",
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "4px",
      fontSize: isMobile ? "0.75rem" : "0.85rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      minWidth: isMobile ? "90px" : "100px",
      justifyContent: "center"
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: isMobile ? "2rem" : "3rem",
      color: "#6c757d",
      fontSize: isMobile ? "0.9rem" : "1rem",
      textAlign: "center"
    },
    emptyState: {
      textAlign: "center",
      padding: isMobile ? "1.5rem" : "2rem",
      color: "#6c757d",
      fontStyle: "italic"
    },
    paginationContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "0.5rem",
      padding: isMobile ? "0.75rem" : "1rem",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      border: "1px solid #e9ecef"
    },
    paginationControls: {
      display: "flex",
      alignItems: "center",
      gap: "0.25rem",
      flexWrap: "wrap"
    },
    pageButton: {
      padding: isMobile ? "0.25rem 0.5rem" : "0.4rem 0.75rem",
      border: "1px solid #dee2e6",
      backgroundColor: "white",
      color: "#495057",
      borderRadius: "4px",
      fontSize: isMobile ? "0.8rem" : "0.9rem",
      cursor: "pointer",
      transition: "all 0.2s",
      minWidth: "32px",
      textAlign: "center"
    },
    activePageButton: {
      backgroundColor: "#3498db",
      color: "white",
      borderColor: "#3498db"
    },
    itemsPerPageSelect: {
      padding: isMobile ? "0.25rem 0.5rem" : "0.4rem 0.6rem",
      border: "1px solid #dee2e6",
      borderRadius: "4px",
      fontSize: isMobile ? "0.8rem" : "0.9rem",
      backgroundColor: "white",
      color: "#495057"
    },
    statsContainer: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
      gap: isMobile ? "0.5rem" : "1rem",
      marginBottom: isMobile ? "1rem" : "1.5rem"
    },
    statCard: {
      background: "white",
      padding: isMobile ? "0.75rem" : "1rem",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      border: "1px solid #e9ecef",
      transition: "transform 0.2s"
    },
    statNumber: {
      fontSize: isMobile ? "1.25rem" : "1.5rem",
      fontWeight: "700",
      color: "#2c3e50",
      margin: "0 0 0.25rem 0"
    },
    statLabel: {
      color: "#6c757d",
      margin: "0",
      fontSize: isMobile ? "0.75rem" : "0.85rem",
      fontWeight: "500"
    },
    // Modal styles (unchanged from original)
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      padding: isMobile ? "0.5rem" : "1rem"
    },
    modalContent: {
      backgroundColor: "white",
      padding: isMobile ? "1rem" : "1.5rem",
      borderRadius: "8px",
      maxWidth: isMobile ? "95vw" : "500px",
      width: "100%",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      maxHeight: "90vh",
      overflowY: "auto"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: isMobile ? "0.75rem" : "1rem",
      paddingBottom: isMobile ? "0.5rem" : "0.75rem",
      borderBottom: "1px solid #dee2e6"
    },
    modalTitle: {
      color: "#2c3e50",
      fontSize: isMobile ? "1rem" : "1.2rem",
      fontWeight: "600",
      margin: "0",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: isMobile ? "1.25rem" : "1.5rem",
      color: "#6c757d",
      cursor: "pointer",
      padding: "0",
      width: isMobile ? "24px" : "30px",
      height: isMobile ? "24px" : "30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      transition: "all 0.2s"
    },
    modalBody: {
      marginBottom: isMobile ? "0.75rem" : "1rem"
    },
    studentInfo: {
      backgroundColor: "#f8f9fa",
      padding: isMobile ? "0.75rem" : "1rem",
      borderRadius: "6px",
      marginBottom: isMobile ? "0.75rem" : "1rem"
    },
    studentInfoRow: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      marginBottom: isMobile ? "0.25rem" : "0.5rem",
      paddingBottom: isMobile ? "0.25rem" : "0.5rem",
      borderBottom: "1px solid #e9ecef"
    },
    infoLabel: {
      color: "#6c757d",
      fontWeight: "500",
      fontSize: isMobile ? "0.8rem" : "0.85rem",
      marginBottom: isMobile ? "0.1rem" : "0"
    },
    infoValue: {
      color: "#2c3e50",
      fontWeight: "600",
      fontSize: isMobile ? "0.85rem" : "0.9rem",
      textAlign: isMobile ? "left" : "right",
      flex: 1
    },
    modalActions: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "0.5rem" : "0.75rem",
      justifyContent: "flex-end",
      marginTop: isMobile ? "1rem" : "1.5rem",
      paddingTop: isMobile ? "0.75rem" : "1rem",
      borderTop: "1px solid #dee2e6"
    },
    cancelButton: {
      padding: isMobile ? "0.5rem 1rem" : "0.6rem 1.2rem",
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: isMobile ? "0.85rem" : "0.9rem",
      fontWeight: "600",
      cursor: "pointer",
      width: isMobile ? "100%" : "auto"
    }
  };

  /* ================= STATISTICS ================= */
  const getStats = () => {
    const total = filteredRequests.length;
    const approved = filteredRequests.filter(r => r.adminStatus === "APPROVED").length;
    const rejected = filteredRequests.filter(r => r.adminStatus === "REJECTED").length;
    const pending = filteredRequests.filter(r => r.adminStatus === "PENDING").length;
    
    return { total, approved, rejected, pending };
  };

  const stats = getStats();

  return (
    <div style={styles.container}>
      <ToastContainer 
        position={isMobile ? "top-center" : "top-right"}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      {/* ================= HEADER ================= */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span>🚶</span>
          {isMobile ? "Outing Admin" : "Outing Management"}
        </h1>
        <div style={styles.exportButtons}>
          <button
            style={{ ...styles.exportButton, backgroundColor: "#28a745" }}
            onClick={exportToExcel}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#218838"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#28a745"}
          >
            <span>📊</span>
            {isMobile ? "Excel" : "Export Excel"}
          </button>
        
        </div>
      </div>

      {/* ================= VIEW SWITCH ================= */}
      <div style={styles.switchContainer}>
        <button
          style={{
            ...styles.switchButton,
            ...(activeView === "request" ? styles.activeSwitch : {})
          }}
          onClick={() => setActiveView("request")}
        >
          <span>📝</span>
          {isMobile ? "Requests" : "Outing Requests"}
          {activeView === "request" && ` (${filteredRequests.length})`}
        </button>
        <button
          style={{
            ...styles.switchButton,
            ...(activeView === "report" ? styles.activeSwitch : {})
          }}
          onClick={() => setActiveView("report")}
        >
          <span>📊</span>
          {isMobile ? "Report" : "Monthly Report"}
          {activeView === "report" && ` (${filteredReports.length})`}
        </button>
      </div>

      {/* ================= SEARCH BAR ================= */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder={`Search ${activeView === "request" ? "students, admission no, reason..." : "students, admission no..."}`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
          onFocus={(e) => {
            e.target.style.borderColor = "#3498db";
            e.target.style.boxShadow = "0 0 0 2px rgba(52, 152, 219, 0.2)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e9ecef";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* ================= REQUEST VIEW ================= */}
      {activeView === "request" && (
        <>
          {/* ================= FILTERS ================= */}
          <div style={styles.filterContainer}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Admin Status:</label>
              <select
                style={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Parent Status:</label>
              <select
                style={styles.filterSelect}
                value={parentStatusFilter}
                onChange={(e) => setParentStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Date:</label>
              <input
                type="date"
                style={styles.filterSelect}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <button
              style={styles.clearButton}
              onClick={clearFilters}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5a6268"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#6c757d"}
            >
              <span>🗑️</span>
              Clear Filters
            </button>
          </div>

          {/* ================= STATISTICS ================= */}
          <div style={styles.statsContainer}>
            <div style={{ ...styles.statCard, borderTop: "4px solid #3498db" }}>
              <h3 style={styles.statNumber}>{stats.total}</h3>
              <p style={styles.statLabel}>Total Requests</p>
            </div>
            <div style={{ ...styles.statCard, borderTop: "4px solid #28a745" }}>
              <h3 style={styles.statNumber}>{stats.approved}</h3>
              <p style={styles.statLabel}>Approved</p>
            </div>
            <div style={{ ...styles.statCard, borderTop: "4px solid #dc3545" }}>
              <h3 style={styles.statNumber}>{stats.rejected}</h3>
              <p style={styles.statLabel}>Rejected</p>
            </div>
            <div style={{ ...styles.statCard, borderTop: "4px solid #f39c12" }}>
              <h3 style={styles.statNumber}>{stats.pending}</h3>
              <p style={styles.statLabel}>Pending</p>
            </div>
          </div>

          {/* ================= REQUESTS TABLE ================= */}
          {loading ? (
            <div style={styles.loadingContainer}>
              <span style={{ marginRight: "0.5rem" }}>⏳</span>
              Loading outing requests...
            </div>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.headerCell}>Student</th>
                      {!isMobile && <th style={styles.headerCell}>Adm. No</th>}
                      <th style={styles.headerCell}>Date/Time</th>
                      {!isMobile && <th style={styles.headerCell}>Reason</th>}
                      <th style={styles.headerCell}>Parent</th>
                      <th style={styles.headerCell}>Admin</th>
                      <th style={styles.headerCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={isMobile ? 5 : 6} style={styles.emptyState}>
                          <div style={{ fontSize: isMobile ? "2rem" : "3rem", marginBottom: "1rem" }}>📭</div>
                          No outing requests found
                          {(searchTerm || statusFilter !== "ALL" || parentStatusFilter !== "ALL" || dateFilter) && 
                            " with current filters"}
                        </td>
                      </tr>
                    ) : (
                      currentData.map((request) => (
                        <tr 
                          key={request._id} 
                          style={{
                            ...styles.tableRow,
                            backgroundColor: request.adminStatus === "PENDING" ? "#fffef6" : "white"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 
                              request.adminStatus === "PENDING" ? "#fffef6" : "white";
                          }}
                        >
                          <td style={styles.tableCell}>
                            <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                              {request.studentName}
                            </div>
                            {isMobile && (
                              <div style={{ fontSize: "0.75rem", color: "#6c757d", fontFamily: "monospace" }}>
                                {request.admissionNumber}
                              </div>
                            )}
                          </td>
                          {!isMobile && (
                            <td style={styles.tableCell}>
                              <div style={{ fontFamily: "monospace", color: "#495057" }}>
                                {request.admissionNumber}
                              </div>
                            </td>
                          )}
                          <td style={styles.tableCell}>
                            <div style={{ marginBottom: "0.25rem" }}>
                              <span style={{ color: "#6c757d", fontSize: "0.85em" }}>📅 </span>
                              {new Date(request.date).toLocaleDateString('en-IN')}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                              <span style={{ fontSize: "0.85em" }}>⏰ </span>
                              {request.leavingTime} - {request.returningTime}
                            </div>
                          </td>
                          {!isMobile && (
                            <td style={styles.tableCell}>
                              <div style={{ 
                                maxHeight: "60px", 
                                overflowY: "auto",
                                paddingRight: "0.5rem",
                                lineHeight: "1.4",
                                fontSize: "0.9em"
                              }}>
                                {request.reason}
                              </div>
                            </td>
                          )}
                          <td style={styles.tableCell}>
                            <StatusBadge status={request.parentStatus} />
                          </td>
                          <td style={styles.tableCell}>
                            <StatusBadge status={request.adminStatus} />
                          </td>
                          <td style={styles.tableCell}>
                            <div style={styles.actionButtons}>
                              {request.adminStatus === "PENDING" ? (
                                <>
                                  <button
                                    style={styles.approveButton}
                                    onClick={() => openActionModal(request)}
                                  >
                                    {isMobile ? "✓" : "Approve"}
                                  </button>
                                  <button
                                    style={styles.rejectButton}
                                    onClick={() => openActionModal(request)}
                                  >
                                    {isMobile ? "✗" : "Reject"}
                                  </button>
                                </>
                              ) : (
                                <button
                                  style={styles.changeButton}
                                  onClick={() => openActionModal(request)}
                                >
                                  {isMobile ? "🔄" : "Change"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ================= PAGINATION ================= */}
              {filteredRequests.length > 0 && (
                <div style={styles.paginationContainer}>
                  <div style={{ color: "#6c757d", fontSize: isMobile ? "0.85rem" : "0.9rem" }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} entries
                  </div>
                  <div style={styles.paginationControls}>
                    <select
                      style={styles.itemsPerPageSelect}
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value="5">5 per page</option>
                      <option value="10">10 per page</option>
                      <option value="20">20 per page</option>
                      <option value="50">50 per page</option>
                    </select>
                    
                    <button
                      style={styles.pageButton}
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      «
                    </button>
                    <button
                      style={styles.pageButton}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ‹
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          style={{
                            ...styles.pageButton,
                            ...(currentPage === pageNum ? styles.activePageButton : {})
                          }}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      style={styles.pageButton}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      ›
                    </button>
                    <button
                      style={styles.pageButton}
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ================= REPORT VIEW ================= */}
      {activeView === "report" && (
        <>
          {/* ================= FILTERS ================= */}
          <div style={styles.filterContainer}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Month:</label>
              <select
                style={styles.filterSelect}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Year:</label>
              <select
                style={styles.filterSelect}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ================= REPORTS TABLE ================= */}
          {loading ? (
            <div style={styles.loadingContainer}>
              <span style={{ marginRight: "0.5rem" }}>⏳</span>
              Loading reports...
            </div>
          ) : (
            <>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.headerCell}>Student</th>
                      <th style={styles.headerCell}>Adm. No</th>
                      {!isMobile && <th style={styles.headerCell}>Month/Year</th>}
                      <th style={styles.headerCell}>Outings</th>
                      <th style={styles.headerCell}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={isMobile ? 4 : 5} style={styles.emptyState}>
                          <div style={{ fontSize: isMobile ? "2rem" : "3rem", marginBottom: "1rem" }}>📭</div>
                          No reports found
                          {searchTerm && " with current search"}
                        </td>
                      </tr>
                    ) : (
                      currentData.map((report, index) => (
                        <tr 
                          key={index} 
                          style={styles.tableRow}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "white";
                          }}
                        >
                          <td style={styles.tableCell}>
                            <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                              {report.studentName}
                            </div>
                          </td>
                          <td style={styles.tableCell}>
                            <div style={{ fontFamily: "monospace", color: "#495057" }}>
                              {report._id}
                            </div>
                          </td>
                          {!isMobile && (
                            <td style={styles.tableCell}>
                              <div style={{ color: "#6c757d" }}>
                                {month !== "" 
                                  ? `${new Date(0, month).toLocaleString('default', { month: 'long' })} ${year}`
                                  : `All months in ${year}`
                                }
                              </div>
                            </td>
                          )}
                          <td style={styles.tableCell}>
                            <div style={{ 
                              fontSize: isMobile ? "1.1rem" : "1.25rem", 
                              fontWeight: "700",
                              color: report.totalOutings > 0 ? "#28a745" : "#6c757d"
                            }}>
                              {report.totalOutings}
                            </div>
                          </td>
                          <td style={styles.tableCell}>
                            <StatusBadge 
                              status={report.totalOutings > 0 ? "APPROVED" : "REJECTED"} 
                              text={isMobile 
                                ? (report.totalOutings > 0 ? "TAKEN" : "NONE")
                                : (report.totalOutings > 0 ? "OUTING TAKEN" : "NO OUTINGS")
                              }
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ================= PAGINATION ================= */}
              {filteredReports.length > 0 && (
                <div style={styles.paginationContainer}>
                  <div style={{ color: "#6c757d", fontSize: isMobile ? "0.85rem" : "0.9rem" }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} entries
                  </div>
                  <div style={styles.paginationControls}>
                    <select
                      style={styles.itemsPerPageSelect}
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value="5">5 per page</option>
                      <option value="10">10 per page</option>
                      <option value="20">20 per page</option>
                      <option value="50">50 per page</option>
                    </select>
                    
                    <button
                      style={styles.pageButton}
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      «
                    </button>
                    <button
                      style={styles.pageButton}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ‹
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          style={{
                            ...styles.pageButton,
                            ...(currentPage === pageNum ? styles.activePageButton : {})
                          }}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      style={styles.pageButton}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      ›
                    </button>
                    <button
                      style={styles.pageButton}
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ================= ACTION MODAL ================= */}
      {actionModal && selectedRequest && (
        <div style={styles.modalOverlay} onClick={() => setActionModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {selectedRequest.adminStatus === "PENDING" ? "🚶 Take Action" : "🔄 Change Status"}
              </h3>
              <button 
                style={styles.closeButton}
                onClick={() => {
                  setActionModal(false);
                  setSelectedRequest(null);
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.studentInfo}>
                <div style={styles.studentInfoRow}>
                  <span style={styles.infoLabel}>Student:</span>
                  <span style={styles.infoValue}>{selectedRequest.studentName}</span>
                </div>
                <div style={styles.studentInfoRow}>
                  <span style={styles.infoLabel}>Admission No:</span>
                  <span style={{...styles.infoValue, fontFamily: "monospace"}}>
                    {selectedRequest.admissionNumber}
                  </span>
                </div>
                <div style={styles.studentInfoRow}>
                  <span style={styles.infoLabel}>Date:</span>
                  <span style={styles.infoValue}>
                    {new Date(selectedRequest.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div style={styles.studentInfoRow}>
                  <span style={styles.infoLabel}>Time:</span>
                  <span style={styles.infoValue}>
                    {selectedRequest.leavingTime} - {selectedRequest.returningTime}
                  </span>
                </div>
                <div style={styles.studentInfoRow}>
                  <span style={styles.infoLabel}>Parent Status:</span>
                  <span style={styles.infoValue}>
                    <StatusBadge status={selectedRequest.parentStatus} />
                  </span>
                </div>
                <div style={styles.studentInfoRow}>
                  <span style={styles.infoLabel}>Current Status:</span>
                  <span style={styles.infoValue}>
                    <StatusBadge status={selectedRequest.adminStatus} />
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem", 
                  marginBottom: "0.5rem",
                  color: "#2c3e50",
                  fontWeight: "600"
                }}>
                  <span>📝</span>
                  <span>Reason:</span>
                </div>
                <div style={{ 
                  padding: "0.75rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                  lineHeight: "1.5",
                  border: "1px solid #e9ecef",
                  fontSize: isMobile ? "0.9rem" : "1rem"
                }}>
                  {selectedRequest.reason}
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  style={styles.cancelButton}
                  onClick={() => {
                    setActionModal(false);
                    setSelectedRequest(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  style={{ ...styles.approveButton, padding: isMobile ? "0.5rem 1rem" : "0.6rem 1.2rem" }}
                  onClick={() => adminDecision("APPROVED")}
                >
                  ✓ Approve
                </button>
                <button
                  style={{ ...styles.rejectButton, padding: isMobile ? "0.5rem 1rem" : "0.6rem 1.2rem" }}
                  onClick={() => adminDecision("REJECTED")}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutingAndReport;