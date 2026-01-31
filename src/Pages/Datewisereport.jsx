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
  Pagination
} from "react-bootstrap";

import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL =
  import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

function DateWiseReport() {
  const [selectedDate, setSelectedDate] = useState("");
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // ✅ MEAL CUT COUNTS
  const [breakfastCut, setBreakfastCut] = useState(0);
  const [lunchCut, setLunchCut] = useState(0);
  const [teaCut, setTeaCut] = useState(0);
  const [dinnerCut, setDinnerCut] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // ✅ FOR EACH ROW COUNTS
  const [mealStats, setMealStats] = useState({
    breakfast: { cut: 0, count: 0, total: 0 },
    lunch: { cut: 0, count: 0, total: 0 },
    tea: { cut: 0, count: 0, total: 0 },
    dinner: { cut: 0, count: 0, total: 0 }
  });

  /* ======================================================
       LOAD DATA (Attendance + Messcut + User)
  ====================================================== */
  const handleLoadData = async () => {
    if (!selectedDate) return alert("Please select a date!");

    try {
      const attendanceRes = await axios.get(
        `${API_URL}/attendance?date=${selectedDate}`
      );
      let list = attendanceRes.data.data || [];

      const messcutRes = await axios.get(
        `${API_URL}/api/messcut/by-datereport?date=${selectedDate}`
      );

      const messcutMap = {};
      messcutRes.data.data.forEach((m) => {
        messcutMap[m.admissionNumber] = m;
      });

      let bCut = 0, lCut = 0, tCut = 0, dCut = 0;
      let bCount = 0, lCount = 0, tCount = 0, dCount = 0;

      const finalList = await Promise.all(
        list
          .filter((s) => s.semester && s.semester !== "N/A")
          .map(async (student) => {
            let branch = "N/A";

            try {
              const userRes = await axios.get(
                `${API_URL}/user?admissionNumber=${student.admissionNumber}`
              );
              branch = userRes.data?.data?.branch || "N/A";
            } catch {}

            const mess = messcutMap[student.admissionNumber];
            const meals = mess
              ? mess.meals
              : { B: true, L: true, T: true, D: true };

            // Count cuts
            if (!meals.B) bCut++; else bCount++;
            if (!meals.L) lCut++; else lCount++;
            if (!meals.T) tCut++; else tCount++;
            if (!meals.D) dCut++; else dCount++;

            return {
              name: student.name,
              sem: student.semester,
              room: student.roomNo,
              branch,
              breakfast: meals.B,
              lunch: meals.L,
              tea: meals.T,
              dinner: meals.D
            };
          })
      );

      setBreakfastCut(bCut);
      setLunchCut(lCut);
      setTeaCut(tCut);
      setDinnerCut(dCut);
      setTotalCount(finalList.length);

      // Set meal stats
      setMealStats({
        breakfast: { cut: bCut, count: bCount, total: finalList.length },
        lunch: { cut: lCut, count: lCount, total: finalList.length },
        tea: { cut: tCut, count: tCount, total: finalList.length },
        dinner: { cut: dCut, count: dCount, total: finalList.length }
      });

      setData(finalList);
      setPage(1);

    } catch (err) {
      console.log(err);
      alert("Failed to load data.");
    }
  };

  /* ======================================================
       SEARCH & PAGINATION
  ====================================================== */
  const filteredData = data.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  /* ======================================================
       EXPORT EXCEL
  ====================================================== */
const exportExcel = async () => {
  if (!data.length) return alert("No data to export");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Date Wise Mess Report");

  // ============ TITLE SECTION ============
  sheet.mergeCells("A1", "I1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `📅 DATE WISE MESS REPORT`;
  titleCell.font = { 
    bold: true, 
    size: 18, 
    color: { argb: "000000" }
  };
  titleCell.alignment = { 
    horizontal: "center", 
    vertical: "middle" 
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: "E8F4FD" } // Light blue
  };

  // ============ DATE SECTION ============
  sheet.mergeCells("A2", "I2");
  const dateCell = sheet.getCell("A2");
  dateCell.value = `Date: ${selectedDate}`;
  dateCell.font = { 
    bold: true, 
    size: 14, 
    color: { argb: "2E75B6" }
  };
  dateCell.alignment = { 
    horizontal: "center", 
    vertical: "middle" 
  };

  // ============ STATISTICS SECTION ============
  sheet.mergeCells("A3", "I3");
  const statsCell = sheet.getCell("A3");
  statsCell.value = `📊 STATISTICS: Total Students: ${filteredData.length} | Breakfast: ${mealStats.breakfast.count}✔️ ${mealStats.breakfast.cut}❌ | Lunch: ${mealStats.lunch.count}✔️ ${mealStats.lunch.cut}❌ | Tea: ${mealStats.tea.count}✔️ ${mealStats.tea.cut}❌ | Dinner: ${mealStats.dinner.count}✔️ ${mealStats.dinner.cut}❌`;
  statsCell.font = { 
    bold: true, 
    size: 11, 
    color: { argb: "1F4E78" }
  };
  statsCell.alignment = { 
    horizontal: "center", 
    vertical: "middle" 
  };
  statsCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: "FFF2CC" } // Light yellow
  };

  // ============ HEADERS ============
  const headers = [
    "Sl.No", "Name", "Semester", "Room", "Department", 
    "Breakfast", "Lunch", "Tea", "Dinner"
  ];
  
  const headerRow = sheet.addRow(headers);
  
  // Style headers
  headerRow.eachCell((cell, colNumber) => {
    cell.font = {
      bold: true,
      size: 12,
      color: { argb: "FFFFFF" }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: "2F5496" } // Dark blue
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
    cell.border = {
      top: { style: "thin", color: { argb: "1F3864" } },
      left: { style: "thin", color: { argb: "1F3864" } },
      bottom: { style: "thin", color: { argb: "1F3864" } },
      right: { style: "thin", color: { argb: "1F3864" } }
    };
  });

  // ============ DATA ROWS ============
  filteredData.forEach((row, index) => {
    const dataRow = sheet.addRow([
      index + 1,
      row.name,
      row.sem,
      row.room,
      row.branch,
      row.breakfast ? "✅ Yes" : "❌ No",
      row.lunch ? "✅ Yes" : "❌ No",
      row.tea ? "✅ Yes" : "❌ No",
      row.dinner ? "✅ Yes" : "❌ No"
    ]);

    // Style data rows
    dataRow.eachCell((cell, colNumber) => {
      // Alternate row colors for readability
      const bgColor = index % 2 === 0 ? "FFFFFF" : "F8F9FA";
      
      cell.font = {
        size: 11,
        color: { argb: "000000" }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      cell.alignment = {
        horizontal: colNumber === 2 ? "left" : "center", // Name column left aligned
        vertical: "middle",
        wrapText: true
      };
      cell.border = {
        top: { style: "thin", color: { argb: "E0E0E0" } },
        left: { style: "thin", color: { argb: "E0E0E0" } },
        bottom: { style: "thin", color: { argb: "E0E0E0" } },
        right: { style: "thin", color: { argb: "E0E0E0" } }
      };

      // Color code meal status cells
      if (colNumber >= 6 && colNumber <= 9) {
        const mealValue = dataRow.getCell(colNumber).value;
        if (mealValue && mealValue.includes("✅")) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: "E7F6E7" } // Light green for Yes
          };
          cell.font = { 
            size: 11, 
            color: { argb: "0F6B0F" },
            bold: true 
          };
        } else if (mealValue && mealValue.includes("❌")) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: "FDE8E8" } // Light red for No
          };
          cell.font = { 
            size: 11, 
            color: { argb: "D80027" },
            bold: true 
          };
        }
      }
    });
  });

  // ============ SUMMARY ROW ============
  sheet.addRow([]); // Empty row for spacing
  
  const summaryRow = sheet.addRow([
    "📊 TOTAL SUMMARY",
    "",
    "",
    "",
    "",
    `Cuts: ${mealStats.breakfast.cut} | Count: ${mealStats.breakfast.count} | Total: ${filteredData.length}`,
    `Cuts: ${mealStats.lunch.cut} | Count: ${mealStats.lunch.count} | Total: ${filteredData.length}`,
    `Cuts: ${mealStats.tea.cut} | Count: ${mealStats.tea.count} | Total: ${filteredData.length}`,
    `Cuts: ${mealStats.dinner.cut} | Count: ${mealStats.dinner.count} | Total: ${filteredData.length}`
  ]);

  // Style summary row
  summaryRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      size: 11,
      color: { argb: "1F3864" }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: "DEEBF7" } // Light blue
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
    cell.border = {
      top: { style: "medium", color: { argb: "2F5496" } },
      left: { style: "medium", color: { argb: "2F5496" } },
      bottom: { style: "medium", color: { argb: "2F5496" } },
      right: { style: "medium", color: { argb: "2F5496" } }
    };
  });

  // ============ FOOTER ============
  sheet.addRow([]); // Empty row
  
  const footerRow = sheet.addRow([
    `Exported on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ]);
  
  sheet.mergeCells(`A${footerRow.number}`, `I${footerRow.number}`);
  const footerCell = sheet.getCell(`A${footerRow.number}`);
  footerCell.font = {
    italic: true,
    size: 10,
    color: { argb: "666666" }
  };
  footerCell.alignment = {
    horizontal: "center",
    vertical: "middle"
  };

  // ============ COLUMN SIZING ============
  // Set optimal column widths
  sheet.columns = [
    { key: 'slno', width: 8 },    // Sl.No
    { key: 'name', width: 30 },   // Name
    { key: 'sem', width: 12 },    // Semester
    { key: 'room', width: 10 },   // Room
    { key: 'dept', width: 25 },   // Department
    { key: 'breakfast', width: 15 }, // Breakfast
    { key: 'lunch', width: 15 },     // Lunch
    { key: 'tea', width: 15 },       // Tea
    { key: 'dinner', width: 15 }     // Dinner
  ];

  // ============ PAGE SETUP ============
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9, // A4
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3
    },
    printArea: 'A1:I1000',
    showGridLines: false
  };

  // Freeze header row
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 4, activeCell: 'A5' }
  ];

  // ============ GENERATE FILE ============
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `DateWiseMessReport_${selectedDate.replace(/\//g, '-')}.xlsx`);
};

  /* ======================================================
       EXPORT PDF
  ====================================================== */
const exportPDF = () => {
  if (!data.length) return alert("No data to export");

  const doc = new jsPDF('landscape'); // Use landscape for better fit
  
  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Date Wise Mess Report - ${selectedDate}`, 14, 15);
  
  // Subtitle with totals
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Students: ${totalCount}`, 14, 22);

  // Prepare table data
  const tableData = filteredData.map((row, i) => [
    i + 1,
    row.name,
    row.sem,
    row.room,
    row.branch,
    row.breakfast ? "Yes" : "No",
    row.lunch ? "Yes" : "No",
    row.tea ? "Yes" : "No",
    row.dinner ? "Yes" : "No"
  ]);

  // Add summary row
  const summaryRow = [
    "TOTAL",
    "",
    "",
    "",
    "",
    `Cut: ${mealStats.breakfast.cut} | Count: ${mealStats.breakfast.count}`,
    `Cut: ${mealStats.lunch.cut} | Count: ${mealStats.lunch.count}`,
    `Cut: ${mealStats.tea.cut} | Count: ${mealStats.tea.count}`,
    `Cut: ${mealStats.dinner.cut} | Count: ${mealStats.dinner.count}`
  ];

  // Use filteredData for accurate totals
  autoTable(doc, {
    startY: 30,
    head: [[
      "Sl.No",
      "Name",
      "Semester",
      "Room",
      "Department",
      "Breakfast",
      "Lunch",
      "Tea",
      "Dinner"
    ]],
    body: [...tableData, summaryRow],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'center'
    },
    headStyles: {
      fillColor: [0, 0, 0], // Black background
      textColor: [255, 255, 255], // White text
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' }, // Sl.No
      1: { cellWidth: 'auto', halign: 'left' }, // Name
      2: { cellWidth: 25, halign: 'center' }, // Semester
      3: { cellWidth: 20, halign: 'center' }, // Room
      4: { cellWidth: 'auto', halign: 'left' }, // Department
      5: { cellWidth: 30, halign: 'center' }, // Breakfast
      6: { cellWidth: 30, halign: 'center' }, // Lunch
      7: { cellWidth: 30, halign: 'center' }, // Tea
      8: { cellWidth: 30, halign: 'center' } // Dinner
    },
    margin: { left: 10, right: 10 },
    pageBreak: 'auto',
    showHead: 'everyPage',
    // Style for summary row
    didParseCell: function(data) {
      if (data.row.index === tableData.length) { // Last row (summary)
        data.cell.styles.fillColor = [240, 240, 240]; // Light gray
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 9;
      }
    }
  });

  // Add footer with page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`DateWiseMessReport_${selectedDate}.pdf`);
};

  /* ======================================================
       UI
  ====================================================== */
  return (
    <Container fluid className="py-4 bg-light">
      <Row className="justify-content-center">
        <Col lg={11}>
          <Card className="shadow-lg border-0 rounded-4">
            <Card.Body>

              {/* HEADER WITH PRIMARY COLOR THEME */}
              <h3 className="text-center fw-bold text-primary mb-4 border-bottom pb-3">
                📅 Date Wise Mess Report
              </h3>

              {/* DATE FILTER */}
              <Row className="justify-content-center mb-4">
                <Col md={4}>
                  <Form.Control
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border-primary"
                  />
                </Col>
                <Col md="auto">
                  <Button 
                    onClick={handleLoadData}
                    className="px-4"
                    variant="primary"
                  >
                    📊 Load Data
                  </Button>
                </Col>
              </Row>

              {/* TOTAL COUNT - PRIMARY THEME */}
              {data.length > 0 && (
                <Row className="mb-4">
                  <Col md={12}>
                    <Card className="bg-gradient-primary text-white border-0 shadow">
                      <Card.Body className="text-center py-3">
                        <h4 className="mb-0">
                          👥 Total Students: <span className="fw-bold">{totalCount}</span>
                        </h4>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* MEAL CUT COUNTS WITH DETAILS - CONSISTENT COLOR THEME */}
              {data.length > 0 && (
                <Row className="mb-4 text-center">
                  {/* BREAKFAST - ORANGE/RED THEME */}
                  <Col md={3} className="mb-3">
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body className="p-3">
                        <h6 className="fw-bold text-uppercase text-warning">🍳 Breakfast</h6>
                        <div className="d-flex justify-content-around mt-3">
                          <div>
                            <small className="text-muted d-block fw-semibold">Cut</small>
                            <h4 className="text-danger mb-0 fw-bold">{mealStats.breakfast.cut}</h4>
                          </div>
                          <div>
                            <small className="text-muted d-block fw-semibold">Count</small>
                            <h4 className="text-success mb-0 fw-bold">{mealStats.breakfast.count}</h4>
                          </div>
                          <div>
                            <small className="text-muted d-block fw-semibold">Total</small>
                            <h4 className="text-primary mb-0 fw-bold">{mealStats.breakfast.total}</h4>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  {/* LUNCH - GREEN THEME */}
                  <Col md={3} className="mb-3">
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body className="p-3">
                        <h6 className="fw-bold text-uppercase text-success">🍲 Lunch</h6>
                        <div className="d-flex justify-content-around mt-3">
                          <div>
                            <small className="text-muted d-block fw-semibold">Cut</small>
                            <h4 className="text-danger mb-0 fw-bold">{mealStats.lunch.cut}</h4>
                          </div>
                          <div>
                            <small className="text-muted d-block fw-semibold">Count</small>
                            <h4 className="text-success mb-0 fw-bold">{mealStats.lunch.count}</h4>
                          </div>
                          <div>
                            <small className="text-muted d-block fw-semibold">Total</small>
                            <h4 className="text-primary mb-0 fw-bold">{mealStats.lunch.total}</h4>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  {/* TEA - BROWN/THEME */}
                  <Col md={3} className="mb-3">
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body className="p-3">
                        <h6 className="fw-bold text-uppercase text-info">☕ Tea</h6>
                        <div className="d-flex justify-content-around mt-3">
                          <div>
                            <small className="text-muted d-block fw-semibold">Cut</small>
                            <h4 className="text-danger mb-0 fw-bold">{mealStats.tea.cut}</h4>
                          </div>
                          <div>
                            <small className="text-muted d-block fw-semibold">Count</small>
                            <h4 className="text-success mb-0 fw-bold">{mealStats.tea.count}</h4>
                          </div>
                          <div>
                            <small className="text-muted d-block fw-semibold">Total</small>
                            <h4 className="text-primary mb-0 fw-bold">{mealStats.tea.total}</h4>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  {/* DINNER - BLUE/PURPLE THEME */}
                  <Col md={3} className="mb-3">
                    <Card className="border-0 shadow-sm h-100">
                      <Card.Body className="p-3">
                        <h6 className="fw-bold text-uppercase text-secondary">🍽️ Dinner</h6>
                        <div className="d-flex justify-content-around mt-3">
                          <div>
                            <small className="text-muted d-block fw-semibold">Cut</small>
                            <h4 className="text-danger mb-0 fw-bold">{mealStats.dinner.cut}</h4>
                          </div>
                          <div>
                            <small className="text-muted d-block fw-semibold">Count</small>
                            <h4 className="text-success mb-0 fw-bold">{mealStats.dinner.count}</h4>
                          </div>
                          <div>
                            <small className="text-muted d-block fw-semibold">Total</small>
                            <h4 className="text-primary mb-0 fw-bold">{mealStats.dinner.total}</h4>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* SEARCH + EXPORT */}
              <Row className="justify-content-between mb-3 align-items-center">
                <Col md={4}>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-primary">
                      🔍
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search Name..."
                      onChange={(e) => setSearch(e.target.value)}
                      className="border-primary"
                    />
                  </InputGroup>
                </Col>

                <Col md="auto" className="d-flex gap-2">
                  <Button 
                    variant="outline-success" 
                    onClick={exportExcel}
                    className="fw-semibold"
                  >
                    📊 Export Excel
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    onClick={exportPDF}
                    className="fw-semibold"
                  >
                    📄 Export PDF
                  </Button>
                </Col>
              </Row>

              {/* TABLE */}
              <div className="table-responsive">
                <Table bordered hover className="text-center">
                  <thead>
                    <tr>
                      <th className="bg-black text-white">Sl.No</th>
                      <th className="bg-black text-white">Name</th>
                      <th className="bg-black text-white">Semester</th>
                      <th className="bg-black text-white">Room</th>
                      <th className="bg-black text-white">Department</th>
                      <th className="bg-black text-white">
                        <div>🍳 Breakfast</div>
                        <small className="text-light fw-semibold">
                          Cut: {mealStats.breakfast.cut} | Count: {mealStats.breakfast.count}
                        </small>
                      </th>
                      <th className="bg-black text-white">
                        <div>🍲 Lunch</div>
                        <small className="text-light fw-semibold">
                          Cut: {mealStats.lunch.cut} | Count: {mealStats.lunch.count}
                        </small>
                      </th>
                      <th className="bg-black text-white">
                        <div>☕ Tea</div>
                        <small className="text-light fw-semibold">
                          Cut: {mealStats.tea.cut} | Count: {mealStats.tea.count}
                        </small>
                      </th>
                      <th className="bg-black text-white">
                        <div>🍽️ Dinner</div>
                        <small className="text-light fw-semibold">
                          Cut: {mealStats.dinner.cut} | Count: {mealStats.dinner.count}
                        </small>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, index) => (
                      <tr key={index} className="bg-white">
                        <td className="fw-semibold">{(page - 1) * rowsPerPage + index + 1}</td>
                        <td className="text-start">{row.name}</td>
                        <td>{row.sem}</td>
                        <td>{row.room}</td>
                        <td>{row.branch}</td>
                     <td>
  {row.breakfast ? "✅" : "❌"}
</td>
<td>
  {row.lunch ? "✅" : "❌"}
</td>
<td>
  {row.tea ? "✅" : "❌"}
</td>
<td>
  {row.dinner ? "✅" : "❌"}
</td>
                      </tr>
                    ))}
                 
                  </tbody>
                </Table>
              </div>

              {/* PAGINATION */}
              <Pagination className="justify-content-center mt-4">
                <Pagination.Prev 
                  disabled={page === 1} 
                  onClick={() => setPage(page - 1)}
                  className="border-primary"
                />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item
                    key={i}
                    active={page === i + 1}
                    onClick={() => setPage(i + 1)}
                    className={page === i + 1 ? "bg-primary border-primary" : "border-primary"}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next 
                  disabled={page === totalPages} 
                  onClick={() => setPage(page + 1)}
                  className="border-primary"
                />
              </Pagination>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DateWiseReport;