import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  InputGroup,
} from "react-bootstrap";
import { motion } from "framer-motion";
import { Search } from "react-bootstrap-icons";
import * as XLSX from "xlsx";

const API_URL = "https://mim-backend-b5cd.onrender.com"; // Change when deploying

const AbsenteesReport = () => {
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load absentees from backend
  const handleLoadData = async () => {
    if (!date) {
      alert("Please select a date!");
      return;
    }

    try {
      setIsLoaded(false);

      const res = await fetch(`${API_URL}/attendance/absentees?date=${date}`);
      const json = await res.json();

      if (!json.success) {
        alert("Failed to load data!");
        return;
      }

      setData(json.data);
      setIsLoaded(true);
    } catch (err) {
      alert("Error loading data!");
    }
  };

  // Search Filter
  const filteredData = data.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.semester.toLowerCase().includes(search.toLowerCase()) ||
      item.roomNo.toString().includes(search)
  );

  // Excel Export
  const handleExportExcel = () => {
    if (data.length === 0) {
      alert("No data available to export!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AbsenteesReport");
    XLSX.writeFile(workbook, `AbsenteesReport_${date}.xlsx`);
  };

  return (
    <Container fluid className="py-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      {/* Header */}
      <Row className="mb-4">
        <Col className="text-center">
          <h2 style={{ fontWeight: "700", color: "#1e4fa3" }}>Absentees Report</h2>
          <p style={{ color: "#6c757d" }}>View all absent students for a selected date</p>
        </Col>
      </Row>

      {/* Date + Buttons */}
      <Row className="justify-content-center mb-4">
        <Col xs={12} md={3} className="mb-2">
          <Form.Control
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Col>
        <Col xs="auto" className="mb-2">
          <Button onClick={handleLoadData} variant="primary">
            Load Data
          </Button>
        </Col>
        <Col xs="auto" className="mb-2">
          <Button onClick={handleExportExcel} variant="info" style={{ color: "#fff" }}>
            Export Excel
          </Button>
        </Col>
      </Row>

      {/* No Data */}
      {!isLoaded ? (
        <Row className="mt-5">
          <Col className="text-center">
            <h5 style={{ color: "#1e4fa3", fontWeight: 600 }}>NO DATA FOUND</h5>
          </Col>
        </Row>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-sm p-3">
            {/* Search */}
            <Row className="mb-3 justify-content-end">
              <Col xs={12} md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <Search />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <Table striped bordered hover responsive>
                <thead style={{ background: "#e9eef9" }}>
                  <tr>
                    <th>Sl.No</th>
                    <th>Semester</th>
                    <th>Room No.</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.slno}</td>
                        <td>{row.semester}</td>
                        <td>{row.roomNo}</td>
                        <td>{row.name}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No matching records
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            <div className="text-start text-muted mt-2">
              Showing {filteredData.length} of {data.length} entries
            </div>
          </Card>
        </motion.div>
      )}
    </Container>
  );
};

export default AbsenteesReport;
