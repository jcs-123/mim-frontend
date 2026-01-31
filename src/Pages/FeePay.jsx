import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = "https://mim-backend-b5cd.onrender.com";

const FeePay = () => {
  const [excelData, setExcelData] = useState([]);
  const [feeList, setFeeList] = useState([]);
  const [selected, setSelected] = useState([]);
  const fileInputRef = useRef(null);

  /* --------------------------------------------------
     FETCH ALL FEE DATA
  -------------------------------------------------- */
  const fetchFees = async () => {
    try {
      const res = await axios.get(`${API_URL}/fees/get`);
      if (res.data.success) {
        setFeeList(res.data.data);
      }
    } catch {
      toast.error("Failed to load fee records");
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  /* --------------------------------------------------
     SAMPLE EXCEL DOWNLOAD (NO totalFee)
  -------------------------------------------------- */
  const downloadSampleExcel = () => {
    const sampleData = [
      {
        admissionNumber: "124",
        name: "Dummy Student",
        branch: "Electronics and Communication Engineering",
        semester: "S3",
        phoneNumber: "9876500000",
        totalPaid: 27000,
        totalDue: 27000,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "FeeDueSample");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "Fee_Due_Sample.xlsx");
  };

  /* --------------------------------------------------
     EXCEL UPLOAD
  -------------------------------------------------- */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      setExcelData(data);
      toast.success(`Loaded ${data.length} records`);
    };
    reader.readAsBinaryString(file);
  };

  /* --------------------------------------------------
     BULK UPLOAD
  -------------------------------------------------- */
  const handleBulkUpload = async () => {
    try {
      const res = await axios.post(`${API_URL}/fees/bulk`, excelData);
      if (res.data.success) {
        toast.success("Bulk upload successful");
        setExcelData([]);
        fileInputRef.current.value = "";
        fetchFees();
      }
    } catch {
      toast.error("Bulk upload failed");
    }
  };

  /* --------------------------------------------------
     SELECT LOGIC
  -------------------------------------------------- */
  const handleSelectAll = (e) => {
    setSelected(e.target.checked ? feeList.map(f => f.admissionNumber) : []);
  };

  const handleSelect = (admissionNumber) => {
    setSelected((prev) =>
      prev.includes(admissionNumber)
        ? prev.filter((id) => id !== admissionNumber)
        : [...prev, admissionNumber]
    );
  };

  /* --------------------------------------------------
     BULK DELETE
  -------------------------------------------------- */
  const handleBulkDelete = async () => {
    if (!selected.length) {
      toast.warning("Select records to delete");
      return;
    }

    try {
      const res = await axios.delete(`${API_URL}/fees/bulk-delete`, {
        data: { admissionNumbers: selected },
      });

      if (res.data.success) {
        toast.success(`Deleted ${res.data.deletedCount} records`);
        setSelected([]);
        fetchFees();
      }
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5 }}>
      {/* ---------- BULK UPLOAD ---------- */}
      <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          Bulk Fee Upload
        </Typography>

        <Box display="flex" gap={2} mt={3} flexWrap="wrap">
          <Button variant="outlined" onClick={downloadSampleExcel}>
            Download Sample Excel
          </Button>

          <Button variant="contained" component="label">
            Upload Excel
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
            />
          </Button>

          <Button
            variant="contained"
            color="success"
            disabled={!excelData.length}
            onClick={handleBulkUpload}
          >
            Bulk Upload
          </Button>
        </Box>
      </Paper>

      {/* ---------- FEE TABLE ---------- */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            Fee Records
          </Typography>

          <IconButton color="error" onClick={handleBulkDelete}>
            <DeleteIcon />
          </IconButton>
        </Box>

        <TableContainer sx={{ maxHeight: 420 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.length === feeList.length && feeList.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Admission No</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Advance</TableCell>
                <TableCell>Due</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {feeList.map((row) => (
                <TableRow key={row._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(row.admissionNumber)}
                      onChange={() => handleSelect(row.admissionNumber)}
                    />
                  </TableCell>
                  <TableCell>{row.admissionNumber}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.branch}</TableCell>
                  <TableCell>{row.semester}</TableCell>
                  <TableCell>₹{row.totalPaid}</TableCell>
                  <TableCell>₹{row.totalDue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default FeePay;
