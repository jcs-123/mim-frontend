import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const ComplaintViewModal = ({ open, handleClose }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (open) {
      const user = JSON.parse(localStorage.getItem("user"));
      const admissionNo =
        user?.admissionNumber || user?.admissionNo || user?.admissionno;

      if (!admissionNo) {
        console.warn("⚠️ No admission number found in localStorage!");
        return;
      }

      setLoading(true);

      // ✅ Correct API path
      axios
        .get("https://mim-backend-b5cd.onrender.com/api/complaints/student", {
          params: { admissionNo },
        })
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setComplaints(res.data.data);
          } else {
            setComplaints([]);
          }
        })
        .catch((err) => {
          console.error("❌ Error fetching complaints:", err);
          setComplaints([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  // ✅ Match backend schema field `status`
  const getStatusChip = (status) => {
    switch (status) {
      case "Resolved":
        return <Chip label="Resolved" color="success" size="small" sx={{ fontWeight: 600 }} />;
      case "In Progress":
        return <Chip label="In Progress" color="warning" size="small" sx={{ fontWeight: 600 }} />;
      case "Rejected":
        return <Chip label="Rejected" color="error" size="small" sx={{ fontWeight: 600 }} />;
      default:
        return <Chip label="Pending" color="secondary" size="small" sx={{ fontWeight: 600 }} />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0px 6px 25px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: "#00bfa6",
          borderBottom: "1px solid #e2e8f0",
          background: "linear-gradient(90deg, #e0f2f1, #ffffff)",
        }}
      >
        My Complaints
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, backgroundColor: "#fafafa" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={30} sx={{ color: "#00bfa6" }} />
          </Box>
        ) : complaints.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              textAlign="center"
              sx={{
                my: 4,
                color: "#64748b",
                fontWeight: 500,
                fontSize: "0.95rem",
              }}
            >
              No complaints found.
            </Typography>
          </motion.div>
        ) : (
          <AnimatePresence>
            {/* 🖥 Desktop View */}
            {!isMobile ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Complaint</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
     <TableCell sx={{ fontWeight: 600 }}>Reply</TableCell> 
                           <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {complaints.map((c, index) => (
                      <motion.tr
                        key={c._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          backgroundColor: "#fff",
                          borderBottom: "1px solid #e2e8f0",
                        }}
                      >
                        <TableCell sx={{ maxWidth: 300, whiteSpace: "normal" }}>
                          {c.complaint}
                        </TableCell>
                        <TableCell>{getStatusChip(c.status)}</TableCell>
                        <TableCell sx={{ color: "#334155" }}>
                          {c.remark || "—"}
                        </TableCell>
                        <TableCell sx={{ color: "#64748b" }}>
                          {new Date(c.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            ) : (
              // 📱 Mobile View – Card Layout
              <Box display="flex" flexDirection="column" gap={2}>
                {complaints.map((c, index) => (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      sx={{
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
                        borderRadius: 2,
                        overflow: "hidden",
                        background: "#fff",
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          color="#0f172a"
                          gutterBottom
                        >
                          Complaint:
                        </Typography>
                        <Typography variant="body2" color="#334155" sx={{ mb: 1 }}>
                          {c.complaint}
                        </Typography>

                        <Divider sx={{ my: 1 }} />

                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          flexWrap="wrap"
                          gap={1}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              color="#64748b"
                              fontWeight={500}
                            >
                              Status:
                            </Typography>
                            <Box mt={0.5}>{getStatusChip(c.status)}</Box>
                          </Box>

                          <Box>
                            <Typography
                              variant="caption"
                              color="#64748b"
                              fontWeight={500}
                            >
                              Date:
                            </Typography>
                            <Typography
                              variant="caption"
                              color="#475569"
                              sx={{ display: "block" }}
                            >
                              {new Date(c.createdAt).toLocaleDateString("en-IN")}
                            </Typography>
                          </Box>
                        </Box>

                        {c.remark && (
                          <>
                            <Divider sx={{ my: 1.5 }} />
                            <Typography
                              variant="caption"
                              color="#64748b"
                              fontWeight={500}
                            >
                              Remark:
                            </Typography>
                            <Typography
                              variant="body2"
                              color="#0f172a"
                              sx={{ mt: 0.5 }}
                            >
                              {c.remark}
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            )}
          </AnimatePresence>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#334155",
            "&:hover": { color: "#00bfa6" },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComplaintViewModal;
