import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import axios from "axios";

/* ================= API BASE ================= */
const API = "https://mim-backend-b5cd.onrender.com";


const semesters = [
  "Sem1",
  "Sem2",
  "Sem3",
  "Sem4",
  "Sem5",
  "Sem6",
  "Sem7",
  "Sem8",
];

function SemesterBulkChange() {
  const [students, setStudents] = useState([]);
  const [fromSem, setFromSem] = useState("");
  const [toSem, setToSem] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  /* ================= LOAD STUDENTS ================= */
  useEffect(() => {
    axios
      .get(`${API}/students/bulk-sem`)
      .then((res) => setStudents(res.data.data || []))
      .catch(() => setError("Failed to load students"));
  }, []);

  /* ================= BULK UPDATE ================= */
  const handleBulkUpdate = async () => {
    setError("");
    setResult(null);

    if (!fromSem || !toSem) {
      setError("Please select both FROM and TO semester");
      return;
    }

    if (fromSem === toSem) {
      setError("FROM and TO semester cannot be same");
      return;
    }

    if (
      !window.confirm(
        `⚠️ Change ALL students from ${fromSem} → ${toSem}?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API}/students/bulk-sem-update`, {
        fromSem,
        toSem,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          🎓 Bulk Semester Change
        </Typography>

        <Divider sx={{ my: 2 }} />

        {error && <Alert severity="error">{error}</Alert>}
        {result && (
          <Alert severity="success">
            {result.message}
            <br />
            Students Updated: <b>{result.modified}</b>
          </Alert>
        )}

        {/* ================= DROPDOWNS ================= */}
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Select
            fullWidth
            value={fromSem}
            onChange={(e) => setFromSem(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">FROM Semester</MenuItem>
            {semesters.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>

          <Select
            fullWidth
            value={toSem}
            onChange={(e) => setToSem(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">TO Semester</MenuItem>
            {semesters.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </Box>

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleBulkUpdate}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: "#fff" }} />
          ) : (
            "Apply Bulk Semester Change"
          )}
        </Button>

        {/* ================= STUDENT TABLE ================= */}
        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" fontWeight={600}>
          👨‍🎓 Student List ({students.length})
        </Typography>

        <Table size="small" sx={{ mt: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Admission No</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Semester</TableCell>
              <TableCell>Room</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.admissionNumber}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.admissionNumber}</TableCell>
                <TableCell>{s.branch}</TableCell>
                <TableCell>{s.sem}</TableCell>
                <TableCell>{s.roomNo || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default SemesterBulkChange;
