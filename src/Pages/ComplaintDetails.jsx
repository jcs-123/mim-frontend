import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Form,
  Row,
  Col,
  Spinner,
  Modal,
  Badge,
  Card,
  Dropdown,
} from "react-bootstrap";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const ComplaintDetails = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showRemark, setShowRemark] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [remark, setRemark] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const toastConfig = { position: "top-center", autoClose: 2500, theme: "colored" };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🟢 Fetch Complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/allcomplaint/all`);
      if (res.data.success) setComplaints(res.data.data || []);
      else toast.error("Failed to load complaints", toastConfig);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Server error fetching complaints", toastConfig);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchComplaints(); }, []);

  // 🔸 Update Status
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/api/complaint/update/${id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Status updated to ${newStatus}`, toastConfig);
        fetchComplaints();
      } else toast.error("Failed to update status", toastConfig);
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Server error updating status", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  // 📝 Add / Edit Remark
  const handleRemarkSubmit = async () => {
    if (!remark.trim()) return toast.warning("Please enter a remark", toastConfig);
    if (!selectedComplaint?._id) return toast.error("No complaint selected", toastConfig);
    try {
      setLoading(true);
      const res = await axios.put(
        `${API_URL}/api/complaint/update/${selectedComplaint._id}`,
        { remark }
      );
      if (res.data.success) {
        toast.success("Remark added successfully", toastConfig);
        setShowRemark(false);
        setRemark("");
        fetchComplaints();
      } else toast.error("Failed to add remark", toastConfig);
    } catch (err) {
      console.error("Remark error:", err);
      toast.error("Server error adding remark", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Status Colors
  const getBadgeVariant = (status) => {
    switch (status) {
      case "Pending": return "secondary";
      case "In Progress": return "warning";
      case "Resolved": return "success";
      case "Rejected": return "danger";
      default: return "light";
    }
  };

  // 🔄 Filter + Sort
  const filtered = complaints
    .filter((c) => {
      const text = search.toLowerCase();
      const match =
        c.name?.toLowerCase().includes(text) ||
        c.roomNo?.toLowerCase().includes(text) ||
        c.complaint?.toLowerCase().includes(text) ||
        c.admissionNo?.toLowerCase().includes(text);
      const statusMatch = statusFilter === "all" || c.status === statusFilter;
      return match && statusMatch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  // 📱 Mobile Card Layout
  const ComplaintCard = ({ c }) => (
    <Card className="mb-3 shadow-sm border-0">
      <Card.Header
        className="text-white fw-bold"
        style={{ background: "#1565C0", border: "none" }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <span>{c.name}</span>
          <Badge bg={getBadgeVariant(c.status)}>{c.status}</Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <p><strong>Admission No:</strong> {c.admissionNo}</p>
        <p><strong>Room:</strong> {c.roomNo}</p>
        <p><strong>Complaint:</strong> {c.complaint}</p>
        {c.remark && (
          <div className="p-2 bg-light border rounded">
            <small className="text-muted fw-semibold">Remark: </small>{c.remark}
          </div>
        )}
      </Card.Body>
      <Card.Footer className="bg-white border-0">
        <Dropdown drop="up" className="w-100">
          <Dropdown.Toggle
            variant="outline-dark"
            size="sm"
            className="w-100 fw-semibold action-btn"
          >
            Manage Complaint
          </Dropdown.Toggle>
          <Dropdown.Menu className="w-100">
            <Dropdown.Item onClick={() => handleStatusUpdate(c._id, "In Progress")} className="text-warning fw-semibold">
              ⏳ In Progress
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusUpdate(c._id, "Resolved")} className="text-success fw-semibold">
              ✅ Resolved
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusUpdate(c._id, "Rejected")} className="text-danger fw-semibold">
              ❌ Rejected
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item
              onClick={() => {
                setSelectedComplaint(c);
                setRemark(c.remark || "");
                setShowRemark(true);
              }}
              className="text-primary fw-semibold"
            >
              💬 {c.remark ? "Edit Remark" : "Add Remark"}
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Card.Footer>
    </Card>
  );

  return (
    <Container fluid className="py-4" style={{ background: "#f7f9fb", minHeight: "100vh" }}>
      <ToastContainer limit={1} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
        <h2
          className="fw-bold text-white p-3 rounded-3 shadow"
          style={{ background: "#1565C0", margin: "0 auto", maxWidth: 520 }}
        >
          Complaint Management
        </h2>
      </motion.div>

      {/* Filters */}
      <Row className="mb-4 g-3 justify-content-center">
        <Col xs={12} md={6}>
          <Form.Control
            type="text"
            placeholder="Search by name, room, or complaint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-3 shadow-sm"
          />
        </Col>
        <Col xs={6} md={3}>
          <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-3 shadow-sm">
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="status">Sort by Status</option>
            <option value="name">Sort by Name</option>
          </Form.Select>
        </Col>
        <Col xs={6} md={3}>
          <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-3 shadow-sm">
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Content */}
      {isMobile ? (
        <div className="px-2">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="dark" /></div>
          ) : filtered.length > 0 ? (
            filtered.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ComplaintCard c={c} />
              </motion.div>
            ))
          ) : (
            <p className="text-center text-muted py-5">No complaints found</p>
          )}
        </div>
      ) : (
        <div className="table-responsive rounded-3 shadow-sm">
          <Table bordered hover className="align-middle mb-0">
            <thead style={{ background: "#f1f1f1" }}>
              <tr>
                <th className="py-3 text-black fw-bold text-center">Name</th>
                <th className="py-3 text-black fw-bold text-center">Admission No</th>
                <th className="py-3 text-black fw-bold text-center">Room No</th>
                <th className="py-3 text-black fw-bold text-center">Complaint</th>
                <th className="py-3 text-black fw-bold text-center">Status</th>
                <th className="py-3 text-black fw-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" variant="dark" /></td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((c, idx) => (
                  <motion.tr
                    key={c._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f9f9f9" }}
                  >
                    <td className="text-center text-dark fw-semibold">{c.name}</td>
                    <td className="text-center">{c.admissionNo}</td>
                    <td className="text-center">{c.roomNo}</td>
                    <td style={{ maxWidth: 350 }}>{c.complaint}</td>
                    <td className="text-center"><Badge bg={getBadgeVariant(c.status)}>{c.status}</Badge></td>
                    <td className="text-center">
                      <Dropdown drop="up">
                        <Dropdown.Toggle variant="outline-dark" size="sm" className="px-4 border-2 fw-semibold action-btn">
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleStatusUpdate(c._id, "In Progress")} className="text-warning fw-semibold">
                            In Progress
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStatusUpdate(c._id, "Resolved")} className="text-success fw-semibold">
                            Resolved
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleStatusUpdate(c._id, "Rejected")} className="text-danger fw-semibold">
                            Rejected
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item
                            onClick={() => {
                              setSelectedComplaint(c);
                              setRemark(c.remark || "");
                              setShowRemark(true);
                            }}
                            className="text-primary fw-semibold"
                          >
                            {c.remark ? "Edit Remark" : "Add Remark"}
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center text-muted py-5">No complaints found</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Remark Modal */}
      <Modal show={showRemark} onHide={() => setShowRemark(false)} centered size="lg">
        <Modal.Header closeButton style={{ background: "#1565C0", color: "#fff" }}>
          <Modal.Title>{selectedComplaint?.remark ? "Edit Remark" : "Add Remark"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Complaint</Form.Label>
            <Form.Control as="textarea" rows={2} readOnly value={selectedComplaint?.complaint || ""} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Admin Remark</Form.Label>
            <Form.Control as="textarea" rows={4} value={remark} onChange={(e) => setRemark(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowRemark(false)}>Cancel</Button>
          <Button variant="dark" onClick={handleRemarkSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Remark"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Extra Styling */}
      <style>
        {`
          .action-btn:hover {
            border-color: #1565c0d8 !important;
            background-color: transparent !important;
            color: inherit !important;
          }
        `}
      </style>
    </Container>
  );
};

export default ComplaintDetails;
