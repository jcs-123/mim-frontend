import React, { useEffect, useState } from "react";
import $ from "jquery";

// DataTables
import "datatables.net-dt/js/dataTables.dataTables";
import "datatables.net-dt/css/dataTables.dataTables.min.css";

// Buttons
import "datatables.net-buttons/js/dataTables.buttons";
import "datatables.net-buttons/js/buttons.html5";
import "datatables.net-buttons/js/buttons.print";
import "datatables.net-buttons-dt/css/buttons.dataTables.min.css";

// Required for PDF, Excel, CSV export
import jszip from "jszip";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.vfs;
window.JSZip = jszip;

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Container, Row, Col, Button, Form, Card } from "react-bootstrap";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const AttendanceComparisonReport = () => {
  const [date, setDate] = useState("");
  const [mismatchData, setMismatchData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /* -------------------------------------------------------
        Fetch attendance by date
  ------------------------------------------------------- */
  const fetchAttendance = async (d) => {
    const res = await axios.get(`${API_URL}/attendance?date=${d}`);
    return res.data.data || [];
  };

  /* -------------------------------------------------------
       MAIN LOGIC: SHOW ONLY MISMATCH (1→0 & 0→1)
  ------------------------------------------------------- */
  const handleLoadData = async () => {
    if (!date) return toast.warning("Please select a date!");

    try {
      const selectedDate = new Date(date);

      const yesterday = new Date(selectedDate);
      yesterday.setDate(selectedDate.getDate() - 1);
      const yDate = yesterday.toISOString().split("T")[0];

      const todayData = await fetchAttendance(date);
      const yesterdayData = await fetchAttendance(yDate);

      const beforeMap = {};
      yesterdayData.forEach((s) => {
        beforeMap[s.admissionNumber] = s.attendance ? 1 : 0;
      });

      const compared = todayData.map((stu) => {
        const before = beforeMap[stu.admissionNumber] ?? null;
        const today = stu.attendance ? 1 : 0;

        return {
          slno: stu.slno,
          admissionNumber: stu.admissionNumber,
          semester: stu.semester,
          branch: stu.branch,
          roomNo: stu.roomNo,
          name: stu.name,
          before,
          today,
        };
      });

      const mismatch = compared.filter((r) => r.before !== r.today);

      setMismatchData(mismatch);
      setIsLoaded(true);

      mismatch.length === 0
        ? toast.info("No mismatch found!")
        : toast.success("Mismatch attendance loaded!");

    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance!");
    }
  };

  /* -------------------------------------------------------
       INITIALIZE DATATABLE WITH EXPORT BUTTONS
  ------------------------------------------------------- */
  useEffect(() => {
    if (isLoaded) {
      setTimeout(() => {
        if ($.fn.DataTable.isDataTable("#misTable")) {
          $("#misTable").DataTable().destroy();
        }

        $("#misTable").DataTable({
          paging: true,
          searching: true,
          responsive: true,
          dom: "Bfrtip",
          buttons: [
            "copy",
            { extend: "excel", title: "Mismatch Attendance" },
            { extend: "csv", title: "Mismatch Attendance" },
            {
              extend: "pdf",
              title: "Mismatch Attendance",
              orientation: "landscape",
              pageSize: "A4",
            },
            "print",
          ],
        });
      }, 500);
    }
  }, [isLoaded]);

  return (
    <>
      <Container fluid className="py-4">
        <h2 className="text-center fw-bold mb-4" style={{ color: "#1e4fa3" }}>
          Absent Comparison 
        </h2>

        {/* Input Section */}
        <Card className="p-4 shadow-sm mb-4 mx-auto" style={{ maxWidth: "850px" }}>
          <Row className="align-items-end g-3">
            <Col sm={6}>
              <Form.Label className="fw-semibold">Select Date</Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Col>

            <Col sm={3}>
              <Button className="w-100 fw-semibold" style={{ background: "#1e4fa3" }} onClick={handleLoadData}>
                Load Data
              </Button>
            </Col>
          </Row>
        </Card>

        {!isLoaded ? (
          <h5 className="text-center mt-5 fw-bold" style={{ color: "#1e4fa3" }}>
            NO DATA FOUND
          </h5>
        ) : (
          <Card className="p-4 shadow-sm">
            <h4 className="fw-bold mb-3" style={{ color: "red" }}>
              🔥 Mismatch Students (Yesterday vs Today)
            </h4>

            <div className="table-responsive">
              <table
                id="misTable"
                className="display nowrap table table-bordered align-middle text-center"
                style={{ width: "100%", fontSize: "15px" }}
              >
                <thead style={{ background: "#e8f0fe" }}>
                  <tr style={{ fontWeight: "bold", color: "#1e4fa3" }}>
                    <th>Sl No</th>
                    <th>Admission No</th>
                    <th>Name</th>
                    <th>Semester</th>
                    <th>Room</th>
                    <th>Yesterday</th>
                    <th>Today</th>
                  </tr>
                </thead>

                <tbody>
                  {mismatchData.map((row, index) => (
                    <tr
                      key={index}
                      style={{
                        background:
                          row.before === 1 && row.today === 0
                            ? "#ffebe8"
                            : row.before === 0 && row.today === 1
                            ? "#fff2cc"
                            : "white",
                      }}
                    >
                      <td>{index + 1}</td>
                      <td>{row.admissionNumber}</td>
                      <td style={{ textAlign: "left", paddingLeft: "12px" }}>{row.name}</td>
                      <td>{row.semester}</td>
                      <td>{row.roomNo}</td>
                      <td>{row.before}</td>
                      <td>{row.today}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Container>

      <ToastContainer position="top-center" autoClose={2000} />
    </>
  );
};

export default AttendanceComparisonReport;
