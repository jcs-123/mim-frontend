import React, { useState, useEffect, useMemo } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    Table,
    Badge,
    Modal,
    Alert,
    Spinner,
    InputGroup,
} from "react-bootstrap";
import axios from "axios";
import {
    Calendar,
    Search,
    ArrowClockwise,
    FileEarmarkExcel,
    FileEarmarkPdf,
} from "react-bootstrap-icons";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL =
    import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const MesscutManagement = () => {
    /* ================= STATE ================= */
    const [messcuts, setMesscuts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");

    const [showDateModal, setShowDateModal] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);

    const [dateForm, setDateForm] = useState({
        newLeavingDate: "",
        newReturningDate: "",
    });

    /* ================= FETCH (ONLY ACCEPTED) ================= */
    useEffect(() => {
        fetchMesscuts();
    }, []);

    const fetchMesscuts = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(
                `${API_URL}/api/messcut/all-details`
            );

            // 🛡️ SAFETY FILTER (ACCEPT ONLY)
            const accepted = (res.data.data || []).filter(
                (x) => x.status === "ACCEPT"
            );

            setMesscuts(accepted);
        } catch {
            setError("Failed to load accepted messcut data");
        } finally {
            setLoading(false);
        }
    };

    /* ================= HELPERS ================= */
    const calculateMesscutDays = (leave, ret) => {
        try {
            const d1 = new Date(leave);
            const d2 = new Date(ret);
            const diff = Math.ceil((d2 - d1) / 86400000) - 1;
            return diff < 2 ? 0 : diff;
        } catch {
            return 0;
        }
    };

    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : "-";

    /* ================= FILTER ================= */
    const filtered = useMemo(() => {
        let data = [...messcuts];

        if (search) {
            const s = search.toLowerCase();
            data = data.filter(
                (x) =>
                    x.name?.toLowerCase().includes(s) ||
                    x.admissionNumber?.toLowerCase().includes(s)
            );
        }

        return data;
    }, [messcuts, search]);

    /* ================= DATE EDIT ================= */
    const openDateModal = (r) => {
        console.log("Clicked record:", r);

        if (!r || !r._id) {
            setError("Record ID missing. Please refresh the page.");
            return;
        }

        setCurrentRecord(r);
        setDateForm({
            newLeavingDate: r.leavingDate,
            newReturningDate: r.returningDate,
        });
        setShowDateModal(true);
    };


    const submitDateChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await axios.put(
                `${API_URL}/api/messcut/update-dates/${currentRecord._id}`,
                {
                    leavingDate: dateForm.newLeavingDate,
                    returningDate: dateForm.newReturningDate,
                }
            );

            if (res.data.success) {
                setSuccess("Messcut dates updated successfully");
                fetchMesscuts();
                setShowDateModal(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    /* ================= EXPORT ================= */
    const exportExcel = async () => {
        if (!filtered.length) return;

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Accepted Messcut");

        const rows = filtered.map((r, i) => ([
            i + 1,
            r.name,
            r.admissionNumber,
            formatDate(r.leavingDate),
            formatDate(r.returningDate),
            calculateMesscutDays(r.leavingDate, r.returningDate),
            "ACCEPTED",
        ]));

        ws.addRow(["#", "Name", "Admission", "Leave", "Return", "Days", "Status"]);
        rows.forEach((r) => ws.addRow(r));

        const buf = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buf]), "Accepted_Messcut_Report.xlsx");
    };

    const exportPDF = () => {
        if (!filtered.length) return;

        const doc = new jsPDF();
        autoTable(doc, {
            head: [["#", "Name", "Admission", "Leave", "Return", "Days", "Status"]],
            body: filtered.map((r, i) => [
                i + 1,
                r.name,
                r.admissionNumber,
                formatDate(r.leavingDate),
                formatDate(r.returningDate),
                calculateMesscutDays(r.leavingDate, r.returningDate),
                "ACCEPTED",
            ]),
        });
        doc.save("Accepted_Messcut_Report.pdf");
    };

    /* ================= UI ================= */
    return (
        <Container fluid className="py-4 bg-light">
            <h3 className="fw-bold text-primary mb-3">
                Accepted Messcut Management
            </h3>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* FILTER */}
            <Card className="mb-3">
                <Card.Body>
                    <Row className="g-3 align-items-center">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <Search />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search name / admission"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </InputGroup>
                        </Col>

                        <Col md={8} className="d-flex gap-2">
                            <Button onClick={fetchMesscuts}>
                                <ArrowClockwise /> Refresh
                            </Button>
                            <Button variant="success" onClick={exportExcel}>
                                <FileEarmarkExcel />
                            </Button>
                            <Button variant="danger" onClick={exportPDF}>
                                <FileEarmarkPdf />
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* TABLE */}
            <Card>
                <Table bordered hover responsive size="sm">
                    <thead className="table-dark">
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Admission</th>
                            <th>Leave</th>
                            <th>Return</th>
                            <th>Days</th>
                            <th>Status</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="text-center py-4">
                                    <Spinner />
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-4 text-muted">
                                    No accepted messcut records found
                                </td>
                            </tr>
                        ) : (
                            filtered.map((r, i) => (
                                <tr key={r._id}>
                                    <td>{i + 1}</td>
                                    <td>{r.name}</td>
                                    <td>{r.admissionNumber}</td>
                                    <td>{formatDate(r.leavingDate)}</td>
                                    <td>{formatDate(r.returningDate)}</td>
                                    <td>{calculateMesscutDays(r.leavingDate, r.returningDate)}</td>
                                    <td>
                                        <Badge bg="success">ACCEPTED</Badge>
                                    </td>
                                    <td>
                                        <Button
                                            size="sm"
                                            variant="warning"
                                            onClick={() => openDateModal(r)}
                                        >
                                            <Calendar /> Dates
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </Card>

            {/* DATE MODAL */}
            {/* DATE MODAL */}
            <Modal
                show={showDateModal}
                onHide={() => setShowDateModal(false)}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title className="fw-semibold">
                        Change Messcut Dates
                    </Modal.Title>
                </Modal.Header>

                <Form onSubmit={submitDateChange}>
                    <Modal.Body>
                        {/* Leaving Date */}
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-medium">
                                Leaving Date
                            </Form.Label>
                            <Form.Control
                                type="date"
                                value={dateForm.newLeavingDate}
                                onChange={(e) =>
                                    setDateForm({
                                        ...dateForm,
                                        newLeavingDate: e.target.value,
                                    })
                                }
                                required
                            />
                        </Form.Group>

                        {/* Returning Date */}
                        <Form.Group>
                            <Form.Label className="fw-medium">
                                Returning Date
                            </Form.Label>
                            <Form.Control
                                type="date"
                                value={dateForm.newReturningDate}
                                min={dateForm.newLeavingDate}
                                onChange={(e) =>
                                    setDateForm({
                                        ...dateForm,
                                        newReturningDate: e.target.value,
                                    })
                                }
                                required
                            />
                        </Form.Group>
                    </Modal.Body>

                    <Modal.Footer className="d-flex justify-content-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setShowDateModal(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            variant="dark"
                            disabled={loading}
                        >
                            {loading ? (
                                <Spinner size="sm" />
                            ) : (
                                "Update"
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

        </Container>
    );
};

export default MesscutManagement;
