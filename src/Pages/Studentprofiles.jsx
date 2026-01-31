import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./StudentProfiles.css";

const API = "https://mim-backend-b5cd.onrender.com/studentprofile/api";

function StudentProfiles() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFilters, setShowFilters] = useState(false);
  const [yearFilter, setYearFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [exportLoading, setExportLoading] = useState({ excel: false, pdf: false });
  const fileInputRef = useRef({});

  const [form, setForm] = useState({
    name: "",
    admissionNumber: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    branch: "",
    roomNo: "",
    year: "",
    sem: "",
    parentName: "",
    Role: "student",
    gmail: "",
    password: "",
  });

  // Dropdown options
  const roles = [
    { value: "student", label: "Student" },
    { value: "admin", label: "Admin" },
  ];

  const branches = [
    "Computer Science & Engineering",
    "Information Technology",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical Engineering",
    "Civil Engineering",
    "Automobile Engineering",
    "Mechatronics",
    "Artificial Intelligence",
    "Data Science"
  ];

  const yearOptions = [
    "First Year",
    "Second Year", 
    "Third Year",
    "Fourth Year",
  ];

  // All semester options
  const semesterOptions = [
    "Semester 1", "Semester 2", "Semester 3", "Semester 4",
    "Semester 5", "Semester 6", "Semester 7", "Semester 8"
  ];

  // Year-Semester mapping
  const yearSemesterMap = {
    "First Year": ["Semester 1", "Semester 2"],
    "Second Year": ["Semester 3", "Semester 4"],
    "Third Year": ["Semester 5", "Semester 6"],
    "Fourth Year": ["Semester 7", "Semester 8"],
  };

  // Get available semesters based on selected year
  const getSemesterOptions = () => {
    return yearSemesterMap[form.year] || semesterOptions;
  };

  /* ================= EXPORT FUNCTIONS ================= */
  
  // Export to Excel function
  const exportToExcel = () => {
    setExportLoading(prev => ({ ...prev, excel: true }));
    
    try {
      const exportData = filtered.map(student => ({
        "Name": student.name || "",
        "Admission Number": student.admissionNumber || "",
        "Email": student.gmail || "",
        "Phone Number": student.phoneNumber || "",
        "Parent Phone Number": student.parentPhoneNumber || "",
        "Branch": student.branch || "",
        "Year": student.year || "",
        "Semester": student.sem || "",
        "Room No": student.roomNo || "",
        "Parent Name": student.parentName || "",
        "Role": student.Role || "",
        "Profile Photo": student.profilePhoto ? "Yes" : "No",
        "Last Updated": student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : ""
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      
      // Auto-size columns
      const maxWidth = exportData.reduce((w, r) => Math.max(w, r.Name.length), 10);
      worksheet['!cols'] = [{ wch: maxWidth }];
      
      XLSX.writeFile(workbook, `Students_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification("Excel file exported successfully!", "success");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showNotification("Error exporting to Excel", "error");
    } finally {
      setExportLoading(prev => ({ ...prev, excel: false }));
    }
  };

  // Export to PDF function
  const exportToPDF = () => {
    setExportLoading(prev => ({ ...prev, pdf: true }));

    try {
      // Landscape A4
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const title = "Student Profiles Report";
      const exportDate = new Date().toLocaleString();

      /* ================= HEADER ================= */
      doc.setFontSize(18);
      doc.setTextColor(33);
      doc.text(title, pageWidth / 2, 40, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Generated on: ${exportDate}`, 40, 65);
      doc.text(`Total Students: ${filtered.length}`, pageWidth - 40, 65, {
        align: "right"
      });

      /* ================= TABLE ================= */
      autoTable(doc, {
        startY: 90,

        head: [[
          "#",
          "Name",
          "Admission No",
          "Branch",
          "Year",
          "Semester",
          "Room",
          "Email",
          "Student Phone",
          "Parent Phone",
          "Role"
        ]],

        body: filtered.map((s, i) => ([
          i + 1,
          s.name || "—",
          s.admissionNumber || "—",
          s.branch || "—",
          s.year || "—",
          s.sem || "—",
          s.roomNo || "—",
          s.gmail || "—",
          s.phoneNumber || "—",
          s.parentPhoneNumber || "—",
          s.Role || "—"
        ])),

        theme: "striped",

        styles: {
          fontSize: 9,
          cellPadding: 6,
          valign: "middle",
          overflow: "linebreak"
        },

        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: "bold",
          halign: "center"
        },

        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },

        columnStyles: {
          0: { cellWidth: 30, halign: "center" },
          1: { cellWidth: 80 },
          2: { cellWidth: 80 },
          3: { cellWidth: 120 },
          4: { cellWidth: 60, halign: "center" },
          5: { cellWidth: 70, halign: "center" },
          6: { cellWidth: 55, halign: "center" },
          7: { cellWidth: "auto" },
          8: { cellWidth: 80 },
          9: { cellWidth: 80 },
          10: { cellWidth: 60, halign: "center" }
        },

        margin: { left: 30, right: 30 },

        didDrawPage: () => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(120);
          doc.text(
            `Page ${pageCount}`,
            pageWidth / 2,
            pageHeight - 20,
            { align: "center" }
          );
        }
      });

      doc.save(
        `Students_Report_${new Date().toISOString().split("T")[0]}.pdf`
      );

      showNotification("PDF exported successfully!", "success");

    } catch (error) {
      console.error("PDF export error:", error);
      showNotification("Error generating PDF", "error");
    } finally {
      setExportLoading(prev => ({ ...prev, pdf: false }));
    }
  };

  // Export filtered data
  const exportFilteredData = (format) => {
    if (filtered.length === 0) {
      showNotification("No data to export", "warning");
      return;
    }
    
    if (format === 'excel') {
      exportToExcel();
    } else if (format === 'pdf') {
      exportToPDF();
    }
  };

  // Export all data
  const exportAllData = (format) => {
    if (students.length === 0) {
      showNotification("No data to export", "warning");
      return;
    }
    
    // Create a temporary filtered array with all students
    const allStudents = students;
    
    if (format === 'excel') {
      exportToExcel();
    } else if (format === 'pdf') {
      exportToPDF();
    }
  };

  /* ================= RESPONSIVE HANDLER ================= */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ================= GET ALL ================= */
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API);
      setStudents(res.data.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      showNotification("Error fetching students", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* ================= ADD ================= */
  const addStudent = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name || !form.admissionNumber || !form.gmail || !form.branch || !form.year || !form.sem) {
      showNotification("Please fill all required fields", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(API, form);
      if (response.data.success) {
        fetchStudents();
        resetForm();
        setShowAddForm(false);
        showNotification("Student added successfully!", "success");
      } else {
        showNotification(response.data.message || "Failed to add student", "error");
      }
    } catch (error) {
      console.error("Error adding student:", error);
      showNotification(error.response?.data?.message || "Error adding student", "error");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const startEditStudent = (student) => {
    setEditingStudent(student);
    setForm({
      name: student.name || "",
      admissionNumber: student.admissionNumber || "",
      phoneNumber: student.phoneNumber || "",
      parentPhoneNumber: student.parentPhoneNumber || "",
      branch: student.branch || "",
      roomNo: student.roomNo || "",
      year: student.year || "",
      sem: student.sem || "",
      parentName: student.parentName || "",
      Role: student.Role || "student",
      gmail: student.gmail || "",
      password: "",
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const updateStudent = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updateData = { ...form };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await axios.put(`${API}/${editingStudent._id}`, updateData);
      if (response.data.success) {
        fetchStudents();
        resetForm();
        setShowEditForm(false);
        setEditingStudent(null);
        showNotification("Student updated successfully!", "success");
      } else {
        showNotification(response.data.message || "Failed to update student", "error");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      showNotification(error.response?.data?.message || "Error updating student", "error");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const confirmDelete = (student) => {
    setShowDeleteConfirm(student);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const deleteStudent = async () => {
    if (!showDeleteConfirm) return;
    
    const studentId = showDeleteConfirm._id;
    setIsLoading(true);
    try {
      const response = await axios.delete(`${API}/${studentId}`);
      if (response.data.success) {
        fetchStudents();
        setShowDeleteConfirm(null);
        showNotification("Student deleted successfully!", "success");
      } else {
        showNotification(response.data.message || "Failed to delete student", "error");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      showNotification(error.response?.data?.message || "Error deleting student", "error");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= UPLOAD PHOTO ================= */
  const uploadPhoto = async (id) => {
    const fileInput = fileInputRef.current[id];
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showNotification("Please select a photo first", "warning");
      return;
    }

    const file = fileInput.files[0];
    
    if (!file.type.startsWith('image/')) {
      showNotification("Please select an image file (JPG, PNG, etc.)", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification("Image size should be less than 5MB", "error");
      return;
    }

    setUploadingPhotoId(id);
    const fd = new FormData();
    fd.append("photo", file);

    try {
      const response = await axios.put(`${API}/profile-photo/${id}`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        fetchStudents();
        showNotification("Photo uploaded successfully!", "success");
      } else {
        showNotification(response.data.message || "Failed to upload photo", "error");
      }
      
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      if (error.response?.status === 413) {
        showNotification("File too large. Max size is 5MB", "error");
      } else {
        showNotification(error.response?.data?.message || "Error uploading photo", "error");
      }
    } finally {
      setUploadingPhotoId(null);
    }
  };

  /* ================= SEARCH & FILTER ================= */
  const filtered = students.filter((student) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      !search ||
      student.name?.toLowerCase().includes(searchLower) ||
      student.admissionNumber?.toLowerCase().includes(searchLower) ||
      student.branch?.toLowerCase().includes(searchLower) ||
      student.roomNo?.toLowerCase().includes(searchLower) ||
      student.gmail?.toLowerCase().includes(searchLower) ||
      student.year?.toLowerCase().includes(searchLower) ||
      student.sem?.toLowerCase().includes(searchLower) ||
      student.phoneNumber?.toLowerCase().includes(searchLower) ||
      student.parentPhoneNumber?.toLowerCase().includes(searchLower) ||
      student.parentName?.toLowerCase().includes(searchLower);
    
    const matchesYear = !yearFilter || student.year === yearFilter;
    const matchesBranch = !branchFilter || student.branch === branchFilter;
    const matchesRole = !roleFilter || student.Role === roleFilter;
    const matchesSemester = !semesterFilter || student.sem === semesterFilter;
    
    return matchesSearch && matchesYear && matchesBranch && matchesRole && matchesSemester;
  });

  // Clear all filters
  const clearFilters = () => {
    setYearFilter("");
    setBranchFilter("");
    setRoleFilter("");
    setSemesterFilter("");
    setShowFilters(false);
  };

  /* ================= HELPER FUNCTIONS ================= */
  const handleFormChange = (field, value) => {
    setForm({ ...form, [field]: value });
    
    // Reset semester when year changes
    if (field === "year" && value !== form.year) {
      setForm(prev => ({ ...prev, sem: "" }));
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      admissionNumber: "",
      phoneNumber: "",
      parentPhoneNumber: "",
      branch: "",
      roomNo: "",
      year: "",
      sem: "",
      parentName: "",
      Role: "student",
      gmail: "",
      password: "",
    });
  };

  const showNotification = (message, type = "success") => {
    setShowSuccess({ message, type });
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const handleFileSelect = (id) => {
    const fileInput = fileInputRef.current[id];
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileChange = (id) => {
    uploadPhoto(id);
  };

  // Get year color for UI
  const getYearColor = (year) => {
    const yearColors = {
      "First Year": "#1976d2",
      "Second Year": "#388e3c",
      "Third Year": "#f57c00",
      "Fourth Year": "#d32f2f",
      "Fifth Year": "#7b1fa2",
      "Sixth Year": "#00796b",
      "Seventh Year": "#5d4037",
      "Eighth Year": "#455a64"
    };
    return yearColors[year] || "#757575";
  };

  // Get role display
  const getRoleDisplay = (role) => {
    switch(role) {
      case "admin": return { emoji: "👑", label: "Admin" };
      case "student": return { emoji: "👨‍🎓", label: "Student" };
      default: return { emoji: "👨‍🎓", label: "Student" };
    }
  };

  // Get semester color
  const getSemesterColor = (sem) => {
    const semColors = {
      "Semester 1": "#2196f3",
      "Semester 2": "#1976d2",
      "Semester 3": "#388e3c",
      "Semester 4": "#2e7d32",
      "Semester 5": "#f57c00",
      "Semester 6": "#ef6c00",
      "Semester 7": "#d32f2f",
      "Semester 8": "#c2185b",
      "Semester 9": "#7b1fa2",
      "Semester 10": "#512da8",
      "Semester 11": "#00796b",
      "Semester 12": "#004d40",
      "Semester 13": "#5d4037",
      "Semester 14": "#3e2723",
      "Semester 15": "#455a64",
      "Semester 16": "#263238"
    };
    return semColors[sem] || "#9e9e9e";
  };

  return (
    <div className="student-profiles-container">
      {/* Notification Toast */}
      {showSuccess && (
        <div className={`notification-toast slide-in ${showSuccess.type}`}>
          <div className="toast-icon">
            {showSuccess.type === "success" ? "✅" : 
             showSuccess.type === "error" ? "❌" : "⚠️"}
          </div>
          <div className="toast-content">
            <div className="toast-title">
              {showSuccess.type === "success" ? "Success!" : 
               showSuccess.type === "error" ? "Error!" : "Warning!"}
            </div>
            <div className="toast-message">{showSuccess.message}</div>
          </div>
          <button 
            className="toast-close" 
            onClick={() => setShowSuccess(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-content">
              <div className="delete-modal-header">
                <h3>🗑️ Delete Student</h3>
                <button className="close-modal-btn" onClick={cancelDelete}>✕</button>
              </div>
              <div className="delete-modal-body">
                <div className="delete-warning-icon">⚠️</div>
                <p>Are you sure you want to delete this student?</p>
                <div className="student-info-preview">
                  <div className="preview-avatar">
                    {showDeleteConfirm.profilePhoto ? (
                      <img 
                        src={`https://mim-backend-b5cd.onrender.com/uploads/students/profile/${showDeleteConfirm.profilePhoto}`}
                        alt={showDeleteConfirm.name}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {showDeleteConfirm.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="preview-details">
                    <strong>{showDeleteConfirm.name}</strong>
                    <div>Admission: {showDeleteConfirm.admissionNumber}</div>
                    <div>Branch: {showDeleteConfirm.branch}</div>
                    <div>Year: {showDeleteConfirm.year} - {showDeleteConfirm.sem}</div>
                    <div>Parent: {showDeleteConfirm.parentName || "N/A"}</div>
                  </div>
                </div>
                <p className="delete-warning-text">This action cannot be undone!</p>
              </div>
              <div className="delete-modal-actions">
                <button 
                  className="cancel-delete-btn" 
                  onClick={cancelDelete}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-delete-btn" 
                  onClick={deleteStudent}
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div className="header-main">
          <h1 className="animated-title">🎓 Student Profiles</h1>
          <p className="subtitle">Manage student information and profiles</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Total Students:</span>
            <span className="stat-value">{students.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Showing:</span>
            <span className="stat-value">{filtered.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="controls-container">
        {/* Main Search Bar */}
        <div className="search-section">
          <div className="search-box">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              placeholder="Search by name, admission, branch, room, semester, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Export Buttons */}
          <div className="export-buttons">
            <button
              className="export-btn excel-btn"
              onClick={() => exportFilteredData('excel')}
              disabled={exportLoading.excel || filtered.length === 0}
              title="Export filtered data to Excel"
            >
              {exportLoading.excel ? (
                <span className="export-spinner"></span>
              ) : (
                "📊 Excel"
              )}
            </button>
            <button
              className="export-btn pdf-btn"
              onClick={() => exportFilteredData('pdf')}
              disabled={exportLoading.pdf || filtered.length === 0}
              title="Export filtered data to PDF"
            >
              {exportLoading.pdf ? (
                <span className="export-spinner"></span>
              ) : (
                "📄 PDF"
              )}
            </button>
          </div>

          {/* Mobile Control Buttons */}
          <div className="mobile-controls">
            <button
              className="filter-btn-mobile"
              onClick={() => setShowFilters(!showFilters)}
              title="Show filters"
            >
              {showFilters ? "✕" : "⚙️"}
            </button>
            <button
              className={`add-btn-mobile ${showAddForm || showEditForm ? "active" : ""}`}
              onClick={() => {
                if (showEditForm) {
                  setShowEditForm(false);
                  setEditingStudent(null);
                  resetForm();
                } else {
                  setShowAddForm(!showAddForm);
                  resetForm();
                }
              }}
              title={showAddForm ? "Cancel" : "Add Student"}
            >
              {showAddForm ? "✕" : "➕"}
            </button>
          </div>

          {/* Desktop Add Button */}
          <button
            className={`add-btn-desktop ${showAddForm || showEditForm ? "active" : ""}`}
            onClick={() => {
              if (showEditForm) {
                setShowEditForm(false);
                setEditingStudent(null);
                resetForm();
              } else {
                setShowAddForm(!showAddForm);
                resetForm();
              }
            }}
          >
            {showAddForm || showEditForm ? "✕ Cancel" : "➕ Add New Student"}
          </button>
        </div>

        {/* Filters Section */}
        {(showFilters || !isMobile) && (
          <div className="filters-section">
            <div className="filters-header">
              <h4>🔍 Filters</h4>
              <div className="export-all-buttons">
                <button
                  className="export-all-btn"
                  onClick={() => exportAllData('excel')}
                  disabled={exportLoading.excel || students.length === 0}
                  title="Export all data to Excel"
                >
                  📊 All Excel
                </button>
                <button
                  className="export-all-btn"
                  onClick={() => exportAllData('pdf')}
                  disabled={exportLoading.pdf || students.length === 0}
                  title="Export all data to PDF"
                >
                  📄 All PDF
                </button>
                {(yearFilter || branchFilter || roleFilter || semesterFilter) && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Clear All
                  </button>
                )}
              </div>
            </div>
            <div className="filter-grid">
              <div className="filter-group">
                <label>Year</label>
                <select 
                  value={yearFilter} 
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Years</option>
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Branch</label>
                <select 
                  value={branchFilter} 
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Semester</label>
                <select 
                  value={semesterFilter} 
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Semesters</option>
                  {semesterOptions.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Role</label>
                <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(yearFilter || branchFilter || roleFilter || semesterFilter) && (
              <div className="active-filters">
                {yearFilter && (
                  <span className="active-filter-tag">
                    Year: {yearFilter}
                    <button onClick={() => setYearFilter("")}>✕</button>
                  </span>
                )}
                {branchFilter && (
                  <span className="active-filter-tag">
                    Branch: {branchFilter}
                    <button onClick={() => setBranchFilter("")}>✕</button>
                  </span>
                )}
                {semesterFilter && (
                  <span className="active-filter-tag">
                    Sem: {semesterFilter}
                    <button onClick={() => setSemesterFilter("")}>✕</button>
                  </span>
                )}
                {roleFilter && (
                  <span className="active-filter-tag">
                    Role: {roles.find(r => r.value === roleFilter)?.label}
                    <button onClick={() => setRoleFilter("")}>✕</button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || showEditForm) && (
        <div className="form-modal-overlay">
          <div className="form-modal">
            <div className="form-modal-content">
              <div className="modal-header">
                <h3>
                  {showEditForm ? `✏️ Edit Student` : "📝 Add New Student"}
                  {showEditForm && editingStudent && (
                    <span className="edit-student-name">{editingStudent.name}</span>
                  )}
                </h3>
                <button 
                  className="close-modal-btn" 
                  onClick={() => {
                    setShowAddForm(false);
                    setShowEditForm(false);
                    setEditingStudent(null);
                    resetForm();
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={showEditForm ? updateStudent : addStudent} className="add-form">
                <div className="form-grid">
                  {/* Row 1 */}
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={form.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Admission Number *</label>
                    <input
                      type="text"
                      placeholder="Enter admission number"
                      value={form.admissionNumber}
                      onChange={(e) => handleFormChange("admissionNumber", e.target.value)}
                      required
                      disabled={showEditForm}
                    />
                    {showEditForm && (
                      <small className="field-note">Cannot be changed</small>
                    )}
                  </div>

                  {/* Row 2 */}
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      placeholder="student@college.edu"
                      value={form.gmail}
                      onChange={(e) => handleFormChange("gmail", e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Student Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={form.phoneNumber}
                      onChange={(e) => handleFormChange("phoneNumber", e.target.value)}
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="form-group">
                    <label>Parent Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={form.parentPhoneNumber}
                      onChange={(e) => handleFormChange("parentPhoneNumber", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Parent Name</label>
                    <input
                      type="text"
                      placeholder="Parent/Guardian name"
                      value={form.parentName}
                      onChange={(e) => handleFormChange("parentName", e.target.value)}
                    />
                  </div>

                  {/* Row 4 */}
                  <div className="form-group">
                    <label>Branch *</label>
                    <select
                      value={form.branch}
                      onChange={(e) => handleFormChange("branch", e.target.value)}
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Year *</label>
                    <select
                      value={form.year}
                      onChange={(e) => handleFormChange("year", e.target.value)}
                      required
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 5 */}
                  <div className="form-group">
                    <label>Semester *</label>
                    <select
                      value={form.sem}
                      onChange={(e) => handleFormChange("sem", e.target.value)}
                      required
                      disabled={!form.year}
                    >
                      <option value="">Select Semester</option>
                      {getSemesterOptions().map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                    {!form.year && (
                      <small className="field-note">Select year first</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Room Number</label>
                    <input
                      type="text"
                      placeholder="e.g., A-101"
                      value={form.roomNo}
                      onChange={(e) => handleFormChange("roomNo", e.target.value)}
                    />
                  </div>

                  {/* Row 6 */}
                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={form.Role}
                      onChange={(e) => handleFormChange("Role", e.target.value)}
                      required
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 7 */}
                  <div className="form-group full-width">
                    <label>Password {!showEditForm && "*"}</label>
                    <input
                      type="password"
                      placeholder={showEditForm ? "Leave empty to keep current" : "Minimum 6 characters"}
                      value={form.password}
                      onChange={(e) => handleFormChange("password", e.target.value)}
                      required={!showEditForm}
                      minLength="6"
                    />
                    <small className="field-note">
                      {showEditForm 
                        ? "Leave empty to keep current password" 
                        : "Set password for login access"}
                    </small>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setShowEditForm(false);
                      setEditingStudent(null);
                      resetForm();
                    }}
                    className="cancel-btn"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="loading-spinner"></span>
                    ) : showEditForm ? "Update Student" : "Add Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && students.length === 0 && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading students data...</p>
        </div>
      )}

      {/* Main Content - Students List */}
      {!isLoading && (
        <div className="students-list-container">
          {/* Results Summary */}
          <div className="results-summary">
            <span className="results-count">
              {filtered.length} student{filtered.length !== 1 ? 's' : ''} found
              {(search || yearFilter || branchFilter || roleFilter || semesterFilter) && ' with current filters'}
            </span>
            {filtered.length > 0 && (
              <div className="quick-export">
                <button
                  className="quick-export-btn"
                  onClick={() => exportFilteredData('excel')}
                  disabled={exportLoading.excel}
                >
                  {exportLoading.excel ? (
                    <span className="export-spinner-small"></span>
                  ) : (
                    "📊 Export Excel"
                  )}
                </button>
                <button
                  className="quick-export-btn"
                  onClick={() => exportFilteredData('pdf')}
                  disabled={exportLoading.pdf}
                >
                  {exportLoading.pdf ? (
                    <span className="export-spinner-small"></span>
                  ) : (
                    "📄 Export PDF"
                  )}
                </button>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No students found</h3>
              <p>
                {search || yearFilter || branchFilter || roleFilter || semesterFilter
                  ? "Try adjusting your filters or search term" 
                  : "Start by adding your first student"}
              </p>
              {!showAddForm && (
                <button 
                  className="add-first-btn"
                  onClick={() => setShowAddForm(true)}
                >
                  ➕ Add First Student
                </button>
              )}
            </div>
          ) : isMobile ? (
            /* ================= MOBILE CARDS VIEW ================= */
            <div className="mobile-cards-view">
              {filtered.map((student) => {
                const roleDisplay = getRoleDisplay(student.Role);
                return (
                  <div key={student._id} className="student-card-mobile">
                    {/* Card Header */}
                    <div className="card-header-mobile">
                      <div className="student-avatar-mobile">
                        {student.profilePhoto ? (
                          <img
                            src={`https://mim-backend-b5cd.onrender.com/uploads/students/profile/${student.profilePhoto}?t=${new Date().getTime()}`}
                            alt={student.name}
                            className="profile-img-mobile"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentElement.querySelector('.avatar-placeholder-mobile').style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`avatar-placeholder-mobile ${student.profilePhoto ? 'hidden' : ''}`}
                          style={{ backgroundColor: getYearColor(student.year) }}
                        >
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="student-info-mobile">
                        <div className="student-name-mobile">
                          <h4>{student.name}</h4>
                          <span 
                            className="year-badge-mobile"
                            style={{ backgroundColor: getYearColor(student.year) }}
                          >
                            {student.year}
                          </span>
                        </div>
                        <div className="admission-mobile">{student.admissionNumber}</div>
                        <div className="branch-mobile">{student.branch}</div>
                      </div>

                      <div className="role-badge-mobile">
                        {roleDisplay.emoji} {roleDisplay.label}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body-mobile">
                      <div className="info-row-mobile">
                        <span className="label-mobile">Semester:</span>
                        <span 
                          className="value-mobile semester-badge-mobile"
                          style={{ backgroundColor: getSemesterColor(student.sem) }}
                        >
                          {student.sem || 'N/A'}
                        </span>
                      </div>
                      <div className="info-row-mobile">
                        <span className="label-mobile">Room:</span>
                        <span className="value-mobile">{student.roomNo || 'N/A'}</span>
                      </div>
                      <div className="info-row-mobile">
                        <span className="label-mobile">Student Phone:</span>
                        <span className="value-mobile">{student.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="info-row-mobile">
                        <span className="label-mobile">Parent Phone:</span>
                        <span className="value-mobile">{student.parentPhoneNumber || 'N/A'}</span>
                      </div>
                      <div className="info-row-mobile">
                        <span className="label-mobile">Email:</span>
                        <span className="value-mobile email-mobile">{student.gmail}</span>
                      </div>
                      {student.parentName && (
                        <div className="info-row-mobile">
                          <span className="label-mobile">Parent:</span>
                          <span className="value-mobile">{student.parentName}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer - Actions */}
                    <div className="card-footer-mobile">
                      <div className="photo-upload-section">
                        <input
                          type="file"
                          id={`photo-mobile-${student._id}`}
                          ref={el => fileInputRef.current[student._id] = el}
                          className="file-input-mobile"
                          onChange={() => handleFileChange(student._id)}
                          accept="image/*"
                        />
                        <button
                          type="button"
                          className="upload-btn-mobile"
                          onClick={() => handleFileSelect(student._id)}
                          disabled={uploadingPhotoId === student._id}
                          title="Upload Photo"
                        >
                          {uploadingPhotoId === student._id ? (
                            <span className="upload-spinner-small"></span>
                          ) : (
                            "📷"
                          )}
                        </button>
                      </div>
                      
                      <div className="action-buttons-mobile">
                        <button
                          onClick={() => startEditStudent(student)}
                          className="edit-btn-mobile"
                          title="Edit"
                          disabled={isLoading}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => confirmDelete(student)}
                          className="delete-btn-mobile"
                          title="Delete"
                          disabled={isLoading}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= DESKTOP TABLE VIEW ================= */
            <div className="desktop-table-view">
              <div className="table-container">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th width="70px">Profile</th>
                      <th>Student Details</th>
                      <th>Academic Info</th>
                      <th>Contact Info</th>
                      <th>Parent Info</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student) => {
                      const roleDisplay = getRoleDisplay(student.Role);
                      return (
                        <tr key={student._id} className="student-row">
                          {/* Profile Column */}
                          <td>
                            <div className="profile-cell">
                              <div className="avatar-container">
                                {student.profilePhoto ? (
                                  <img
                                    src={`https://mim-backend-b5cd.onrender.com/uploads/students/profile/${student.profilePhoto}?t=${new Date().getTime()}`}
                                    alt={student.name}
                                    className="profile-img-table"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                      e.target.parentElement.querySelector('.avatar-placeholder-table').style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`avatar-placeholder-table ${student.profilePhoto ? 'hidden' : ''}`}
                                  style={{ backgroundColor: getYearColor(student.year) }}
                                >
                                  {student.name?.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="upload-photo-btn"
                                onClick={() => handleFileSelect(student._id)}
                                disabled={uploadingPhotoId === student._id}
                              >
                                {uploadingPhotoId === student._id ? (
                                  <span className="upload-spinner-small"></span>
                                ) : (
                                  "📷 Upload"
                                )}
                              </button>
                              <input
                                type="file"
                                ref={el => fileInputRef.current[student._id] = el}
                                className="file-input-hidden"
                                onChange={() => handleFileChange(student._id)}
                                accept="image/*"
                              />
                            </div>
                          </td>

                          {/* Student Details Column */}
                          <td>
                            <div className="student-details">
                              <div className="student-name">
                                <strong>{student.name}</strong>
                                <span 
                                  className="role-badge"
                                  data-role={student.Role}
                                >
                                  {roleDisplay.emoji} {roleDisplay.label}
                                </span>
                              </div>
                              <div className="admission-info">
                                <span className="admission-number">
                                  {student.admissionNumber}
                                </span>
                              </div>
                              <div className="student-phone-info">
                                <small>📱 {student.phoneNumber || 'No phone'}</small>
                              </div>
                            </div>
                          </td>

                          {/* Academic Info Column */}
                          <td>
                            <div className="academic-info">
                              <div className="branch-info">
                                <span className="branch-tag">{student.branch}</span>
                              </div>
                              <div className="year-sem-info">
                                <span 
                                  className="year-badge"
                                  style={{ backgroundColor: getYearColor(student.year) }}
                                >
                                  {student.year}
                                </span>
                                <span 
                                  className="semester-badge"
                                  style={{ backgroundColor: getSemesterColor(student.sem) }}
                                >
                                  {student.sem || 'N/A'}
                                </span>
                              </div>
                              <div className="room-info">
                                <span className="room-badge">
                                  {student.roomNo ? `Room ${student.roomNo}` : 'No Room'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Column */}
                          <td>
                            <div className="contact-info">
                              <div className="email-info">
                                <strong>Email:</strong>
                                <div className="email-text">{student.gmail}</div>
                              </div>
                            </div>
                          </td>

                          {/* Parent Info Column */}
                          <td>
                            <div className="parent-info-column">
                              {student.parentName ? (
                                <>
                                  <div className="parent-name">
                                    <strong>👨‍👩‍👧‍👦 {student.parentName}</strong>
                                  </div>
                                  <div className="parent-phone">
                                    <small>📞 {student.parentPhoneNumber || 'No phone'}</small>
                                  </div>
                                </>
                              ) : (
                                <div className="no-parent-info">
                                  <small>No parent info</small>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => startEditStudent(student)}
                                className="edit-btn"
                                disabled={isLoading}
                                title="Edit student"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => confirmDelete(student)}
                                className="delete-btn"
                                disabled={isLoading}
                                title="Delete student"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Footer */}
      {!isLoading && students.length > 0 && (
        <div className="summary-footer">
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Students:</span>
              <span className="summary-value">{students.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Showing:</span>
              <span className="summary-value">{filtered.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Filters Active:</span>
              <span className="summary-value">
                {(yearFilter || branchFilter || roleFilter || semesterFilter) ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Export Ready:</span>
              <span className="summary-value">
                {filtered.length > 0 ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          {filtered.length > 0 && (
            <div className="footer-export-buttons">
              <button
                className="footer-export-btn"
                onClick={() => exportFilteredData('excel')}
                disabled={exportLoading.excel}
              >
                {exportLoading.excel ? (
                  <span className="export-spinner-small"></span>
                ) : (
                  "📊 Export Current View to Excel"
                )}
              </button>
              <button
                className="footer-export-btn"
                onClick={() => exportAllData('pdf')}
                disabled={exportLoading.pdf}
              >
                {exportLoading.pdf ? (
                  <span className="export-spinner-small"></span>
                ) : (
                  "📄 Export All Data to PDF"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentProfiles;