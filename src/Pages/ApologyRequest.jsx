import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Spinner, Card } from "react-bootstrap";
import { motion } from "framer-motion";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const toastConfig = {
  position: "top-center",
  autoClose: 2000,
  hideProgressBar: true,
  pauseOnHover: false,
  theme: "colored",
};

const ApologyRequest = () => {
  // 🟢 Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const submittedBy = user?.name || "Unknown User";

  const [formData, setFormData] = useState({
    roomNo: "",
    studentName: "",
    admissionNo: "",
    reason: "",
  });

  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* 🟢 Fetch Room List */
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/rooms`);
        toast.dismiss();
        if (res.data.success) {
          setRooms(res.data.data || []);
        } else {
          toast.warning("⚠️ Failed to load rooms", toastConfig);
        }
      } catch (err) {
        toast.dismiss();
        toast.error("🚨 Server error fetching rooms", toastConfig);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  /* 🟡 Handle Room Change → Load Students */
  const handleRoomChange = async (e) => {
    const selectedRoom = e.target.value;
    setFormData({ roomNo: selectedRoom, studentName: "", admissionNo: "", reason: "" });
    setStudents([]);
    toast.dismiss();
    if (!selectedRoom) return;

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/studentsByRoom`, { params: { roomNo: selectedRoom } });
      if (res.data.success) {
        setStudents(res.data.data || []);
        toast.success(`👩‍🎓 Students for Room ${selectedRoom} loaded`, {
          ...toastConfig,
          style: {
            background: "linear-gradient(135deg,#2E7D32,#81C784)",
            color: "#fff",
            fontWeight: 600,
          },
        });
      } else toast.warning("⚠️ No students found for this room", toastConfig);
    } catch (err) {
      toast.error("🚨 Failed to fetch students", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  /* 🟣 Handle Student Selection */
  const handleStudentChange = async (e) => {
    const selectedAdmission = e.target.value;
    toast.dismiss();

    // Find the selected student from list
    const selectedStudent = students.find(
      (s) => s.admissionNumber === selectedAdmission
    );

    if (selectedStudent) {
      // ✅ Save both student name and admission number properly
      setFormData((prev) => ({
        ...prev,
        studentName: selectedStudent.name,
        admissionNo: selectedStudent.admissionNumber,
      }));
    } else {
      toast.warning("⚠️ Student not found", toastConfig);
    }
  };

  /* 🟢 Form Field Updates */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* 🟢 Submit Apology Request (API integrated) */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { roomNo, studentName, admissionNo, reason } = formData;

    toast.dismiss(); // prevent multiple toasts

    // 🔸 Basic validation
    if (!roomNo || !studentName || !admissionNo || !reason) {
      return toast.warning("⚠️ Please fill all required fields", toastConfig);
    }

    // 🔸 Prepare request payload (must match backend model fields)
    const submissionData = {
      roomNo,
      studentName,
      admissionNo,
      reason,
      submittedBy: user?.name || "Unknown User",
      submittedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/apology/add`, submissionData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data?.success) {
        toast.success("✅ Apology Request Submitted Successfully", {
          ...toastConfig,
          style: {
            background: "linear-gradient(135deg,#00695C,#26A69A)",
            color: "#fff",
            fontWeight: 600,
          },
        });

        // Reset form after success
        setFormData({
          roomNo: "",
          studentName: "",
          admissionNo: "",
          reason: "",
        });
        setStudents([]);
      } else {
        toast.error(response.data?.message || "❌ Submission failed", toastConfig);
      }
    } catch (error) {
      console.error("❌ API Error:", error);
      toast.error("🚨 Server error while submitting request", toastConfig);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#E3F2FD,#90CAF9)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px 10px",
      }}
    >
      <ToastContainer limit={1} />

      <Container fluid className="px-2 px-sm-3">
        <Row className="justify-content-center">
          <Col 
            xs={12} 
            sm={10} 
            md={8} 
            lg={6} 
            xl={5}
            className="d-flex justify-content-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{ width: "100%" }}
            >
              <Card
                className="border-0 shadow-lg rounded-4"
                style={{
                  background: "rgba(255,255,255,0.97)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                }}
              >
                <Card.Body className="p-3 p-sm-4 p-md-4">
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-3 mb-sm-4"
                  >
                    <h2 
                      className="fw-bold mb-2"
                      style={{
                        background: "linear-gradient(135deg,#1565C0,#42A5F5)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        fontSize: "clamp(1.5rem, 4vw, 2rem)",
                      }}
                    >
                      Apology Request
                    </h2>
                    <p 
                      className="text-muted mb-0"
                      style={{
                        fontSize: "clamp(0.8rem, 2vw, 0.9rem)"
                      }}
                    >
                      Submit your apology request below
                    </p>
                  </motion.div>

                  <Form onSubmit={handleSubmit}>
                    {/* Room and Student Selection */}
                    <Row className="g-2 g-sm-3 mb-3">
                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Room No</Form.Label>
                          <Form.Select
                            name="roomNo"
                            value={formData.roomNo}
                            onChange={handleRoomChange}
                            className="rounded-3"
                            size="sm"
                          >
                            <option value="">Select Room</option>
                            {rooms.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col xs={12} md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Student Name</Form.Label>
                          <Form.Select
                            name="studentName"
                            value={formData.studentName}
                            onChange={handleStudentChange}
                            disabled={!formData.roomNo}
                            className="rounded-3"
                            size="sm"
                          >
                            <option value="">Select Student</option>
                            {students.map((s) => (
                              <option key={s.admissionNumber} value={s.admissionNumber}>
                                {s.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Admission No */}
                    <Row className="g-2 g-sm-3 mb-3">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Admission No</Form.Label>
                          <Form.Control
                            type="text"
                            name="admissionNo"
                            value={formData.admissionNo}
                            placeholder="Auto-filled"
                            disabled
                            className="rounded-3"
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Reason Textarea */}
                    <Row className="g-2 g-sm-3 mb-3">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">Reason</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="Write your apology reason..."
                            required
                            className="rounded-3"
                            style={{
                              resize: "vertical",
                              minHeight: "80px"
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Submit Button */}
                    <Row className="g-2 g-sm-3 mt-3 mt-sm-4">
                      <Col xs={12}>
                        <div className="text-center">
                          <motion.div 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }}
                            style={{ width: "100%" }}
                          >
                            <Button
                              type="submit"
                              variant="primary"
                              disabled={loading}
                              className="w-100 py-2 fw-semibold rounded-3 border-0"
                              style={{
                                background: "linear-gradient(135deg,#1565C0,#42A5F5)",
                                boxShadow: "0 4px 14px rgba(25,118,210,0.3)",
                                fontSize: "clamp(0.9rem, 2vw, 1rem)"
                              }}
                            >
                              {loading ? (
                                <>
                                  <Spinner 
                                    animation="border" 
                                    size="sm" 
                                    className="me-2" 
                                  />
                                  Submitting...
                                </>
                              ) : (
                                "Submit Apology Request"
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </Col>
                    </Row>

                    {/* Additional Info for Mobile */}
                    <Row className="mt-3">
                      <Col xs={12}>
                        <div className="text-center">
                          <small className="text-muted">
                            <i className="bi bi-info-circle me-1"></i>
                            All fields are required
                          </small>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </motion.div>
  );
};

export default ApologyRequest;