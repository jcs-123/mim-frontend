import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Row,
  Col,
  Button,
  Table,
  Spinner,
  Modal,
  Badge,
} from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const HolidaySelect = () => {
  const [formData, setFormData] = useState({
    date: "",
    reason: "",
    holidayType: "",
  });
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, holiday: null });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const toastConfig = {
    position: "top-center",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: false,
    theme: "colored",
  };

  const holidayOptions = [
    { value: "public", label: "Public Holiday", variant: "primary" },
    { value: "academic", label: "Academic Holiday", variant: "info" },
    { value: "festival", label: "Festival Holiday", variant: "warning" },
    { value: "special", label: "Special Leave", variant: "success" },
    { value: "leave", label: "Leave", variant: "secondary" },
    { value: "drop", label: "Drop", variant: "dark" },
    { value: "hostel", label: "Hostel Holiday", variant: "danger" },
    { value: "college", label: "College Holiday", variant: "primary" },
  ];

  // Check screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🟢 Load all holidays
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/holiday/all`);
      if (res.data.success) {
        setHolidays(res.data.data || []);
      } else {
        toast.error("Failed to load holidays", toastConfig);
      }
    } catch (err) {
      console.error("❌ Error fetching holidays:", err);
      toast.error("Server error loading holidays", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // 🟣 Add event
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/holiday/add`, formData);
      if (res.data.success) {
        toast.success("✅ Event successfully added!", toastConfig);
        setFormData({ date: "", reason: "", holidayType: "" });
        fetchHolidays();
      } else {
        toast.error("Failed to add event", toastConfig);
      }
    } catch (err) {
      console.error("❌ Error adding holiday:", err);
      toast.error("Server error adding event", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 Delete holiday with modal confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteModal.holiday) return;

    try {
      setLoading(true);
      const res = await axios.delete(`${API_URL}/api/holiday/delete/${deleteModal.holiday._id}`);
      if (res.data.success) {
        toast.success("🗑️ Event deleted successfully!", toastConfig);
        fetchHolidays();
      } else {
        toast.error("Failed to delete event", toastConfig);
      }
    } catch (err) {
      console.error("❌ Error deleting holiday:", err);
      toast.error("Server error deleting event", toastConfig);
    } finally {
      setLoading(false);
      setDeleteModal({ show: false, holiday: null });
    }
  };

  // Get badge variant for holiday type
  const getBadgeVariant = (holidayType) => {
    const option = holidayOptions.find(opt => opt.label === holidayType);
    return option ? option.variant : "secondary";
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // 📱 Mobile Card View
  const HolidayCard = ({ holiday, index }) => (
    <Card className="mb-3 shadow-sm border-0">
      <Card.Header className="bg-white border-bottom-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <Badge bg={getBadgeVariant(holiday.holidayType)} className="fs-6">
            {holiday.holidayType}
          </Badge>
          <small className="text-muted">#{index + 1}</small>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="g-2">
          <Col xs={12}>
            <div className="text-muted small">Date</div>
            <div className="fw-semibold text-dark fs-6">
              {formatDate(holiday.date)}
            </div>
          </Col>
          <Col xs={12}>
            <div className="text-muted small">Description</div>
            <div className="fw-semibold text-dark">
              {holiday.reason}
            </div>
          </Col>
          <Col xs={12}>
            <div className="text-muted small">Created On</div>
            <div className="text-dark small">
              {new Date(holiday.createdAt).toLocaleDateString('en-IN')}
            </div>
          </Col>
        </Row>
      </Card.Body>
      <Card.Footer className="bg-white border-top-0">
        <Button
          variant="outline-danger"
          size="sm"
          className="w-100 fw-semibold"
          onClick={() => setDeleteModal({ show: true, holiday })}
          disabled={loading}
        >
          🗑️ Delete Event
        </Button>
      </Card.Footer>
    </Card>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
        padding: "20px 0",
      }}
    >
      <ToastContainer limit={1} />
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
            {/* Header */}
            <div
              className="text-center text-white py-4"
              style={{
                background: "linear-gradient(135deg, #1976d2, #0d47a1)",
              }}
            >
              <i
                className="bi bi-calendar-event mb-3"
                style={{ fontSize: "2.5rem" }}
              ></i>
              <h2 className="fw-bold mb-1">Academic Calendar</h2>
              <p className="mb-0" style={{ opacity: 0.9 }}>
                Manage events and holidays
              </p>
            </div>

            {/* Form Section */}
            <Card.Body className="p-3 p-md-4">
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Event Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        required
                        className="rounded-3"
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Event Type</Form.Label>
                      <Form.Control
                        list="event-types"
                        name="holidayType"
                        value={formData.holidayType}
                        onChange={(e) =>
                          setFormData({ ...formData, holidayType: e.target.value })
                        }
                        placeholder="Select or type event type..."
                        required
                        className="rounded-3"
                      />
                      <datalist id="event-types">
                        {holidayOptions.map((opt) => (
                          <option key={opt.value} value={opt.label} />
                        ))}
                      </datalist>
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">
                        Event Description
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="reason"
                        value={formData.reason}
                        onChange={(e) =>
                          setFormData({ ...formData, reason: e.target.value })
                        }
                        placeholder="Provide details about this event..."
                        required
                        className="rounded-3"
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12} className="text-center mt-3">
                    <Button
                      type="submit"
                      className="px-5 py-2 fw-semibold rounded-pill"
                      style={{
                        background: "linear-gradient(135deg, #0d6efd, #1565c0)",
                        border: "none",
                        boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Adding...
                        </>
                      ) : (
                        <>
                          Add Event
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>

              {/* 📅 Events Section */}
              <hr className="my-4" />
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-primary mb-0">
                  Scheduled Events
                </h5>
                <Badge bg="primary" className="fs-6">
                  {holidays.length} Events
                </Badge>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-2 text-muted">Loading events...</div>
                </div>
              ) : holidays.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-2">
                    <i className="bi bi-calendar-x" style={{ fontSize: "3rem" }}></i>
                  </div>
                  <h6 className="text-muted">No events scheduled</h6>
                  <p className="text-muted small">Add events to see them here</p>
                </div>
              ) : isMobile ? (
                // Mobile Card View
                <div>
                  {holidays.map((holiday, index) => (
                    <motion.div
                      key={holiday._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <HolidayCard holiday={holiday} index={index} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Desktop Table View
                <div className="table-responsive">
                  <Table bordered hover className="align-middle">
                    <thead style={{ background: "#1976d2", color: "#fff" }}>
                      <tr>
                        <th className="text-center text-black">#</th>
                        <th className="text-center text-black">Date</th>
                        <th className="text-center text-black">Event Type</th>
                        <th className="text-center text-black">Description</th>
                        <th className="text-center text-black">Created On</th>
                        <th className="text-center text-black">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map((item, index) => (
                        <motion.tr
                          key={item._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="text-center fw-bold">{index + 1}</td>
                          <td className="fw-semibold">{formatDate(item.date)}</td>
                          <td>
                            <Badge bg={getBadgeVariant(item.holidayType)}>
                              {item.holidayType}
                            </Badge>
                          </td>
                          <td>{item.reason}</td>
                          <td>
                            <small className="text-muted">
                              {new Date(item.createdAt).toLocaleDateString('en-IN')}
                            </small>
                          </td>
                          <td className="text-center">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="fw-semibold"
                              onClick={() => setDeleteModal({ show: true, holiday: item })}
                              disabled={loading}
                            >
                               Delete
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, holiday: null })}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-danger fw-bold">
             Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {deleteModal.holiday && (
            <>
              <p className="mb-3">
                Are you sure you want to delete this event?
              </p>
              <div className="bg-light p-3 rounded">
                <strong>Date:</strong> {formatDate(deleteModal.holiday.date)}<br />
                <strong>Type:</strong> {deleteModal.holiday.holidayType}<br />
                <strong>Description:</strong> {deleteModal.holiday.reason}
              </div>
              <p className="text-danger mt-3 mb-0 small">
                This action cannot be undone.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setDeleteModal({ show: false, holiday: null })}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              "Delete Event"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HolidaySelect;