

import React, { useState, useMemo, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  Badge,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FileEarmarkExcel,
  FileEarmarkPdf,
  ArrowClockwise,
  Search,
} from "react-bootstrap-icons";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const MesscutReport = () => {
  const [summary, setSummary] = useState([]);
  const [details, setDetails] = useState([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);
const [feeDueMap, setFeeDueMap] = useState({});
const [feeLoading, setFeeLoading] = useState(false);
useEffect(() => {
  const fetchAllFees = async () => {
    setFeeLoading(true);
    try {
      const res = await axios.get("https://mim-backend-b5cd.onrender.com/fees/get");
      if (res.data.success) {
        const map = {};
        res.data.data.forEach((fee) => {
          map[fee.admissionNumber] = fee.totalDue || 0;
        });
        setFeeDueMap(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFeeLoading(false);
    }
  };

  fetchAllFees();
}, []);

const isMesscutBlocked = (admissionNumber) =>
  (feeDueMap[admissionNumber] || 0) >= 10000;

const calculateMesscutWithFeeCheck = (adm, leave, ret) => {
  if (isMesscutBlocked(adm)) return 0;
  return calculateMesscut(leave, ret);
};

const calculateDurationWithFeeCheck = (adm, leave, ret) => {
  if (isMesscutBlocked(adm)) return "0 days";
  return calculateDuration(leave, ret);
};


  // ===============================
  // CALCULATIONS
  // ===============================
const calculateMesscut = (leave, ret) => {
  try {
    const d1 = new Date(leave);
    const d2 = new Date(ret);

    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)); 
    const effective = diff - 1; // exclude leaving day

    // ⭐ RULE: Minimum 2 days required for messcut
    if (effective < 2) return 0;

    return effective;
  } catch {
    return 0;
  }
};

const calculateDuration = (leave, ret) => {
  try {
    const d1 = new Date(leave);
    const d2 = new Date(ret);

    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    const effective = diff - 1;

    // ⭐ RULE: If below 2 days, duration is 0 days
    if (effective < 2) return "0 days";

    return `${effective} day${effective !== 1 ? "s" : ""}`;
  } catch {
    return "0 days";
  }
};



  // ===============================
  // FETCH DATA
  // ===============================
const fetchReport = async () => {
  setLoading(true);
  try {
    const summaryRes = await axios.get(`${API_URL}/api/messcut/report`);
    const detailsRes = await axios.get(`${API_URL}/api/messcut/all-details`);

    setSummary(summaryRes.data.data || []);

    // ⭐ FILTER ONLY ACCEPTED RECORDS ⭐
    const accepted = (detailsRes.data.data || []).filter(
      (d) => d.status === "ACCEPT"
    );

    setDetails(accepted);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchReport();
  }, []);

  // ===============================
  // SUMMARY FILTER
  // ===============================
  const filteredSummary = useMemo(() => {
    const s = search.toLowerCase();

    return summary.filter((r) => {
      const textMatch =
        r.name?.toLowerCase().includes(s) ||
        r.admissionNumber?.toLowerCase().includes(s);

      const fromMatch =
        fromDate === "" || new Date(r.lastDate) >= new Date(fromDate);

      const toMatch =
        toDate === "" || new Date(r.lastDate) <= new Date(toDate);

      return textMatch && fromMatch && toMatch;
    });
  }, [summary, search, fromDate, toDate]);

  // ===============================
  // FULL DETAILS FILTER
  // ===============================
  const filteredDetails = useMemo(() => {
    const s = search.toLowerCase();
    let data = [...details];

    // search
    data = data.filter(
      (d) =>
        d.name?.toLowerCase().includes(s) ||
        d.admissionNumber?.toLowerCase().includes(s)
    );

    // date
    if (fromDate)
      data = data.filter(
        (d) => new Date(d.returningDate) >= new Date(fromDate)
      );

    if (toDate)
      data = data.filter(
        (d) => new Date(d.returningDate) <= new Date(toDate)
      );

    return data;
  }, [details, search, fromDate, toDate]);

  // ===============================
  // TOTAL STUDENT MESSCUT
  // ===============================
  const getStudentTotalMesscut = (adm) => {
    const recs = details.filter((x) => x.admissionNumber === adm);
    return recs.reduce(
      (acc, d) => acc + calculateMesscut(d.leavingDate, d.returningDate),
      0
    );
  };

  const getBadgeVariant = (v) => {
    if (v === 0) return "success";
    if (v >= 5) return "danger";
    return "warning";
  };

  // ===============================
  // EXPORTS
  // ===============================
const prepareDetails = () =>
  filteredDetails.map((d, i) => ({
    "#": i + 1,
    Name: d.name,
    "Admission No": d.admissionNumber,
    "Leaving Date": d.leavingDate,
    "Returning Date": d.returningDate,

    // ✅ APPLY FEE CHECK HERE
   Duration: calculateDuration(d.leavingDate, d.returningDate),

    Messcut: calculateMesscutWithFeeCheck(
      d.admissionNumber,
      d.leavingDate,
      d.returningDate
    ),

    // ✅ OPTIONAL (VERY USEFUL IN EXPORT)
    "Fee Due": feeDueMap[d.admissionNumber] || 0,

    Reason: d.reason,
    Status: d.status,
    "Parent Status": d.parentStatus || "PENDING",
  }));

 const exportExcel = async (rows, filename) => {
  if (!rows.length) return alert("No data!");

  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");

    const headers = Object.keys(rows[0]);

    // ----------------------------------------------------
    // ADD TITLE ROW (MERGED)
    // ----------------------------------------------------
    const title = "Messcut Report";

    // Merge cells for title across all header columns
    sheet.mergeCells(1, 1, 1, headers.length);

    const titleCell = sheet.getCell("A1");
    titleCell.value = title;

    // Title styling
    titleCell.font = {
      bold: true,
      size: 16,
      color: { argb: "FFFFFFFF" },
    };

    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2E75B6" }, // Blue background
    };

    // Increase title row height
    sheet.getRow(1).height = 25;

    // ----------------------------------------------------
    // HEADER ROW (Row 2)
    // ----------------------------------------------------
    const headerRow = sheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E78" }, // Dark blue header
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // ----------------------------------------------------
    // DATA ROWS
    // ----------------------------------------------------
    rows.forEach((row, index) => {
      const newRow = sheet.addRow(Object.values(row));

      newRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center" };

        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Alternate row color (light gray)
      if (index % 2 === 0) {
        newRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
          };
        });
      }
    });

    // ----------------------------------------------------
    // AUTO COLUMN WIDTH
    // ----------------------------------------------------
    sheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString().length : 10;
        if (val > maxLength) maxLength = val;
      });
      col.width = maxLength + 5;
    });

    // ----------------------------------------------------
    // EXPORT FILE
    // ----------------------------------------------------
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${filename}.xlsx`);

  } catch (error) {
    console.error("Excel export error:", error);
  }
};


  const exportPDF = (rows, filename) => {
    if (!rows.length) return alert("No data!");

    const doc = new jsPDF();
    autoTable(doc, {
      head: [Object.keys(rows[0])],
      body: rows.map((r) => Object.values(r)),
    });
    doc.save(`${filename}.pdf`);
  };
const getParentStatusBadge = (status) => {
  if (status === "APPROVE") {
    return <Badge bg="success">APPROVED</Badge>;
  }
  if (status === "REJECT") {
    return <Badge bg="danger">REJECTED</Badge>;
  }
  return <Badge bg="warning" text="dark">PENDING</Badge>;
};

  // ===============================
  // UI
  // ===============================
  return (
    <Container fluid className="py-4 bg-light">

      <h2 className="fw-bold text-primary text-center mb-4">Messcut Report</h2>

      {/* FILTERS */}
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-primary text-white">
          <Search className="me-2" /> Filters
        </Card.Header>

        <Card.Body>
          <Row className="g-3">

            <Col md={3}>
              <Form.Label>From Date</Form.Label>
              <Form.Control
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Col>

            <Col md={3}>
              <Form.Label>To Date</Form.Label>
              <Form.Control
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Col>

            <Col md={6}>
              <Form.Label>Search</Form.Label>
              <InputGroup>
                <Form.Control
                  placeholder="Search Name / Admission No"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSearch("");
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear
                </Button>
              </InputGroup>
            </Col>

          </Row>
        </Card.Body>
      </Card>


      {/* FULL DETAILS TABLE */}
      <Card>
        <Card.Header className="fw-bold d-flex justify-content-between">
          <span>All Leave Records</span>

          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() => exportExcel(prepareDetails(), "Messcut_Details")}
            >
              <FileEarmarkExcel className="me-2" /> Excel
            </Button>

            <Button
              size="sm"
              variant="danger"
              onClick={() => exportPDF(prepareDetails(), "Messcut_Details")}
            >
              <FileEarmarkPdf className="me-2" /> PDF
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table bordered hover size="sm">

              <thead style={{ background: "#f1f1f1" }}>
                <tr className="text-center">
                  <th>#</th>
                  <th>Name</th>
                  <th>Admission No</th>
                  <th>Leaving</th>
                  <th>Returning</th>
                  <th>Duration</th>
                  <th>Messcut</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Parent Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredDetails.map((d, i) => (
                  <tr key={i}>
                    <td className="text-center">{i + 1}</td>
                    <td>{d.name}</td>
                    <td>{d.admissionNumber}</td>
                    <td>{d.leavingDate}</td>
                    <td>{d.returningDate}</td>
                    <td className="text-center">{calculateDuration(d.leavingDate, d.returningDate)}</td>
                  
<td className="text-center fw-bold">
  {calculateMesscutWithFeeCheck(
    d.admissionNumber,
    d.leavingDate,
    d.returningDate
  )}

  {isMesscutBlocked(d.admissionNumber) && (
    <div className="mt-1">
      <Badge bg="danger">
        Fee Due ₹{feeDueMap[d.admissionNumber]}
      </Badge>
    </div>
  )}
</td>
                    <td>{d.reason}</td>
                    <td className="text-center">
                      <Badge bg="secondary">{d.status}</Badge>
                    </td>
                    <td className="text-center">
  {getParentStatusBadge(d.parentStatus)}
</td>
                  </tr>
                ))}
              </tbody>

            </Table>
          </div>
        </Card.Body>
      </Card>

    </Container>
  );
};

export default MesscutReport;
