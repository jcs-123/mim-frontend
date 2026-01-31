import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

/* ================= API CONFIG ================= */
const STUDENT_API = "https://mim-backend-b5cd.onrender.com/studentprofile/api";
const ADMIN_API = "https://mim-backend-b5cd.onrender.com";

const AdminOutingPage = () => {
  /* ================= STATE ================= */
  const [students, setStudents] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [eligibility, setEligibility] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  /* ================= STYLES ================= */
  const styles = {
    container: {
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#f8f9fa",
      minHeight: "100vh"
    },
    pageHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2rem",
      paddingBottom: "1rem",
      borderBottom: "1px solid #e9ecef"
    },
    headerTitle: {
      color: "#2c3e50",
      fontSize: "1.8rem",
      fontWeight: "600",
      margin: "0",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    statsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem"
    },
    statCard: {
      background: "white",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      border: "1px solid #e9ecef",
      transition: "all 0.2s ease"
    },
    statNumber: {
      fontSize: "2rem",
      fontWeight: "700",
      color: "#2c3e50",
      margin: "0 0 0.5rem 0"
    },
    statLabel: {
      color: "#6c757d",
      margin: "0",
      fontSize: "0.9rem",
      fontWeight: "500"
    },
    actionBar: {
      background: "white",
      padding: "1.5rem",
      borderRadius: "12px",
      marginBottom: "2rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      border: "1px solid #e9ecef"
    },
    actionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem"
    },
    actionTitle: {
      color: "#2c3e50",
      fontSize: "1.2rem",
      fontWeight: "600",
      margin: "0"
    },
    bulkActions: {
      display: "flex",
      gap: "1rem",
      alignItems: "center"
    },
    select: {
      padding: "0.75rem 1rem",
      border: "2px solid #e9ecef",
      borderRadius: "8px",
      fontSize: "1rem",
      color: "#2c3e50",
      background: "white",
      cursor: "pointer",
      transition: "all 0.2s",
      minWidth: "200px",
      outline: "none"
    },
    submitButton: {
      padding: "0.75rem 2rem",
      background: "linear-gradient(135deg, #3498db, #2980b9)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    searchContainer: {
      marginBottom: "2rem",
      background: "white",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      border: "1px solid #e9ecef"
    },
    searchHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem"
    },
    searchTitle: {
      color: "#2c3e50",
      fontSize: "1.2rem",
      fontWeight: "600",
      margin: "0",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    searchInputContainer: {
      position: "relative",
      width: "100%"
    },
    searchInput: {
      width: "100%",
      padding: "0.75rem 1rem 0.75rem 3rem",
      border: "2px solid #e9ecef",
      borderRadius: "8px",
      fontSize: "1rem",
      color: "#2c3e50",
      background: "white",
      outline: "none",
      transition: "all 0.2s"
    },
    searchIcon: {
      position: "absolute",
      left: "1rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#6c757d",
      fontSize: "1.2rem"
    },
    searchResultsInfo: {
      marginTop: "0.5rem",
      color: "#6c757d",
      fontSize: "0.9rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    clearSearchButton: {
      background: "none",
      border: "none",
      color: "#3498db",
      cursor: "pointer",
      fontSize: "0.9rem",
      padding: "0.25rem 0.5rem",
      borderRadius: "4px",
      transition: "all 0.2s"
    },
    sectionHeader: {
      color: "#2c3e50",
      fontSize: "1.3rem",
      fontWeight: "600",
      margin: "2rem 0 1rem 0",
      paddingBottom: "0.5rem",
      borderBottom: "2px solid #3498db",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem"
    },
    tableContainer: {
      background: "white",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      border: "1px solid #e9ecef",
      overflowX: "auto"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.95rem",
      minWidth: "600px"
    },
    tableHeader: {
      background: "linear-gradient(135deg, #2c3e50, #34495e)",
      color: "white"
    },
    tableCell: {
      padding: "1rem",
      textAlign: "left"
    },
    headerCell: {
      padding: "1rem",
      textAlign: "left",
      fontWeight: "600",
      fontSize: "0.9rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    tableRow: {
      borderBottom: "1px solid #e9ecef",
      transition: "background-color 0.2s"
    },
    checkboxContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    checkbox: {
      width: "18px",
      height: "18px",
      border: "2px solid #bdc3c7",
      borderRadius: "4px",
      cursor: "pointer"
    },
    statusBadge: {
      padding: "0.25rem 0.75rem",
      borderRadius: "20px",
      fontSize: "0.8rem",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "3rem",
      color: "#6c757d"
    },
    emptyState: {
      textAlign: "center",
      padding: "3rem",
      color: "#6c757d",
      fontStyle: "italic"
    },
    /* ================= RESPONSIVE STYLES ================= */
    mobile: {
      statsContainer: {
        gridTemplateColumns: "1fr"
      },
      bulkActions: {
        flexDirection: "column"
      },
      select: {
        width: "100%"
      },
      submitButton: {
        width: "100%",
        justifyContent: "center"
      }
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    fetchStudents();
    fetchEligibleStudents();
  }, []);

  /* ================= FETCH ALL STUDENTS ================= */
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(STUDENT_API);
      setStudents(res.data.data || []);
      setSearchResults(res.data.data || []);
    } catch {
      alert("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH ELIGIBLE STUDENTS ================= */
  const fetchEligibleStudents = async () => {
    try {
      const res = await axios.get(`${ADMIN_API}/admin/outing/eligible`);
      setEligibleStudents(res.data.data || []);
    } catch {
      console.error("Failed to fetch eligible students");
    }
  };

  /* ================= SEARCH FUNCTIONALITY ================= */
  const performSearch = useCallback((term) => {
    if (!term.trim()) {
      setSearchResults(students);
      setSearchLoading(false);
      return;
    }

    const searchTermLower = term.toLowerCase().trim();
    
    const filtered = students.filter(student => {
      return (
        student.name?.toLowerCase().includes(searchTermLower) ||
        student.admissionNumber?.toLowerCase().includes(searchTermLower)
      );
    });

    setSearchResults(filtered);
    setSearchLoading(false);
  }, [students]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchLoading(true);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debouncing (300ms delay)
    const timeout = setTimeout(() => {
      performSearch(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults(students);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  /* ================= HELPERS ================= */
  const isEligibleStudent = (admissionNumber) => {
    return eligibleStudents.some(
      (e) => e.admissionNumber === admissionNumber
    );
  };

  /* ================= CHECKBOX HANDLERS ================= */
  const toggleStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const visibleStudents = searchResults.filter(
      (s) => !isEligibleStudent(s.admissionNumber)
    );

    setSelectedStudents(
      selectedStudents.length === visibleStudents.length
        ? []
        : visibleStudents.map((s) => s._id)
    );
  };

  /* ================= SUBMIT ELIGIBILITY ================= */
  const submitEligibility = async () => {
    if (!eligibility || selectedStudents.length === 0) {
      alert("Please select students and set eligibility status");
      return;
    }

    const payload = students
      .filter((s) => selectedStudents.includes(s._id))
      .map((s) => ({
        admissionNumber: s.admissionNumber,
        studentName: s.name,
        isEligible: eligibility, // YES / NO
      }));

    try {
      await axios.post(`${ADMIN_API}/admin/eligibility`, {
        students: payload,
      });

      alert("✅ Eligibility saved successfully!");
      setSelectedStudents([]);
      setEligibility("");
      fetchEligibleStudents(); // refresh eligible list
      fetchStudents(); // refresh student list
    } catch {
      alert("❌ Failed to save eligibility");
    }
  };

  /* ================= UI ================= */
  return (
    <div style={styles.container}>
      {/* ================= HEADER ================= */}
      <div style={styles.pageHeader}>
        <h1 style={styles.headerTitle}>
          <span style={{ fontSize: "1.5rem" }}>🎓</span>
          Student Eligibility – Admin Panel
        </h1>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div style={styles.statsContainer}>
        <div style={{ ...styles.statCard, borderTop: "4px solid #3498db" }}>
          <h3 style={styles.statNumber}>{students.length}</h3>
          <p style={styles.statLabel}>Total Students</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: "4px solid #2ecc71" }}>
          <h3 style={styles.statNumber}>{eligibleStudents.length}</h3>
          <p style={styles.statLabel}>Already Eligible</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: "4px solid #f39c12" }}>
          <h3 style={styles.statNumber}>{selectedStudents.length}</h3>
          <p style={styles.statLabel}>Currently Selected</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: "4px solid #9b59b6" }}>
          <h3 style={styles.statNumber}>{searchResults.length}</h3>
          <p style={styles.statLabel}>Search Results</p>
        </div>
      </div>

      {/* ================= SEARCH BAR ================= */}
      <div style={styles.searchContainer}>
        <div style={styles.searchHeader}>
          <h3 style={styles.searchTitle}>
            <span>🔍</span>
            Search Students
          </h3>
          {searchTerm && (
            <button
              style={styles.clearSearchButton}
              onClick={clearSearch}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
            >
              Clear Search
            </button>
          )}
        </div>
        <div style={styles.searchInputContainer}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by student name or admission number..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              ...styles.searchInput,
              borderColor: searchTerm ? "#3498db" : "#e9ecef",
              boxShadow: searchTerm ? "0 0 0 3px rgba(52, 152, 219, 0.1)" : "none"
            }}
          />
        </div>
        {searchTerm && (
          <div style={styles.searchResultsInfo}>
            {searchLoading ? (
              <span>Searching...</span>
            ) : (
              <>
                <span>
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  {searchResults.length !== students.length && ` (filtered from ${students.length})`}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ================= ACTION BAR ================= */}
      <div style={styles.actionBar}>
        <div style={styles.actionHeader}>
          <h3 style={styles.actionTitle}>Bulk Eligibility Actions</h3>
        </div>
        <div style={styles.bulkActions}>
          <select
            style={styles.select}
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
          >
            <option value="">Set Eligibility Status</option>
            <option value="YES">✅ Mark as Eligible</option>
            <option value="NO">❌ Mark as Not Eligible</option>
          </select>

          <button
            style={{
              ...styles.submitButton,
              ...(!eligibility || selectedStudents.length === 0 ? {
                background: "#95a5a6",
                cursor: "not-allowed",
                opacity: 0.6
              } : {})
            }}
            onClick={submitEligibility}
            disabled={!eligibility || selectedStudents.length === 0}
          >
            📤 Submit ({selectedStudents.length})
          </button>
        </div>
      </div>

      {/* ================= ALL STUDENTS ================= */}
      <h3 style={styles.sectionHeader}>
        <span style={{ fontSize: "1.2rem" }}>📋</span>
        {searchTerm ? `Search Results (${searchResults.length})` : "All Students"}
      </h3>

      {loading ? (
        <div style={styles.loadingContainer}>
          ⏳ Loading students...
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.headerCell, width: "50px" }}>
                  <div style={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      checked={
                        searchResults.filter(
                          (s) => !isEligibleStudent(s.admissionNumber)
                        ).length > 0 &&
                        selectedStudents.length ===
                          searchResults.filter(
                            (s) => !isEligibleStudent(s.admissionNumber)
                          ).length
                      }
                      onChange={toggleAll}
                    />
                  </div>
                </th>
                <th style={styles.headerCell}>Student Name</th>
                <th style={styles.headerCell}>Admission Number</th>
                <th style={styles.headerCell}>Status</th>
              </tr>
            </thead>

            <tbody>
              {searchResults
                .filter((s) => !isEligibleStudent(s.admissionNumber))
                .length === 0 ? (
                <tr style={styles.tableRow}>
                  <td colSpan="4" style={styles.emptyState}>
                    {searchTerm 
                      ? `📭 No students found matching "${searchTerm}"`
                      : "📭 No students available for eligibility update"
                    }
                  </td>
                </tr>
              ) : (
                searchResults
                  .filter((s) => !isEligibleStudent(s.admissionNumber))
                  .map((s) => (
                    <tr 
                      key={s._id} 
                      style={styles.tableRow}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "white";
                      }}
                    >
                      <td style={styles.tableCell}>
                        <div style={styles.checkboxContainer}>
                          <input
                            type="checkbox"
                            style={{
                              ...styles.checkbox,
                              ...(selectedStudents.includes(s._id) ? {
                                backgroundColor: "#3498db",
                                borderColor: "#3498db",
                                position: "relative"
                              } : {})
                            }}
                            checked={selectedStudents.includes(s._id)}
                            onChange={() => toggleStudent(s._id)}
                          />
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        {searchTerm && s.name.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                          <span>
                            {s.name.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                              part.toLowerCase() === searchTerm.toLowerCase() ? (
                                <span key={i} style={{backgroundColor: '#fff3cd', fontWeight: 'bold'}}>
                                  {part}
                                </span>
                              ) : (
                                part
                              )
                            )}
                          </span>
                        ) : (
                          s.name
                        )}
                      </td>
                      <td style={styles.tableCell}>
                        {searchTerm && s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                          <span>
                            {s.admissionNumber.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                              part.toLowerCase() === searchTerm.toLowerCase() ? (
                                <span key={i} style={{backgroundColor: '#fff3cd', fontWeight: 'bold'}}>
                                  {part}
                                </span>
                              ) : (
                                part
                              )
                            )}
                          </span>
                        ) : (
                          s.admissionNumber
                        )}
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: "#fff3cd",
                          color: "#856404"
                        }}>
                          Pending
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= ELIGIBLE STUDENTS ================= */}
      <div style={{ marginTop: "2rem" }}>
        <h3 style={styles.sectionHeader}>
          <span style={{ fontSize: "1.2rem" }}>✅</span>
          Eligible Students
        </h3>
        
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.headerCell}>Student Name</th>
                <th style={styles.headerCell}>Admission Number</th>
                <th style={styles.headerCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {eligibleStudents.length === 0 ? (
                <tr style={styles.tableRow}>
                  <td colSpan="3" style={styles.emptyState}>
                    📭 No eligible students found
                  </td>
                </tr>
              ) : (
                eligibleStudents.map((e, i) => (
                  <tr 
                    key={i} 
                    style={styles.tableRow}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                  >
                    <td style={styles.tableCell}>{e.studentName}</td>
                    <td style={styles.tableCell}>{e.admissionNumber}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: "#d5f4e6",
                        color: "#27ae60"
                      }}>
                        Eligible
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOutingPage;