import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  Divider,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://mim-backend-b5cd.onrender.com";

const ApologyViewModal = ({ open, handleClose }) => {
  const [apologies, setApologies] = useState([]); // multiple requests
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const admissionNo =
      user?.admissionNumber || user?.admissionNo || user?.admissionno;

    if (!admissionNo) {
      console.warn("⚠️ No admission number found in localStorage!");
      setApologies([]);
      return;
    }

    setLoading(true);

    axios
      .get(`${API_URL}/by-student`, { params: { admissionNo } })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data))
          setApologies(res.data.data);
        else setApologies([]);
      })
      .catch((err) => {
        console.error("❌ Error fetching apology:", err);
        setApologies([]);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Rejected":
        return "error";
      default:
        return "warning";
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
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          fontWeight: 700,
          color: "white",
          background: "linear-gradient(90deg, #00bcd4, #0288d1)",
          borderBottom: "1px solid #e0f7fa",
        }}
      >
        Apology Requests
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent dividers sx={{ backgroundColor: "#f9fafb", p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={34} sx={{ color: "#00bcd4" }} />
          </Box>
        ) : apologies.length > 0 ? (
          apologies.map((apology, index) => (
            <Card
              key={apology._id || index}
              sx={{
                mb: 2,
                borderRadius: 2,
                background: "#fff",
                boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#0d47a1" }}
                  >
                    {apology.studentName}
                  </Typography>
                  <Chip
                    label={apology.status}
                    color={getStatusColor(apology.status)}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      px: 1.5,
                    }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ color: "#455a64", fontWeight: 500 }}
                >
                  Admission No:{" "}
                  <Typography
                    component="span"
                    sx={{ color: "#01579b", fontWeight: 600 }}
                  >
                    {apology.admissionNo}
                  </Typography>
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "#455a64", fontWeight: 500 }}
                >
                  Room:{" "}
                  <Typography
                    component="span"
                    sx={{ color: "#01579b", fontWeight: 600 }}
                  >
                    {apology.roomNo}
                  </Typography>
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: "#455a64", fontWeight: 500 }}
                >
                  Submitted By:{" "}
                  <Typography
                    component="span"
                    sx={{ color: "#01579b", fontWeight: 600 }}
                  >
                    {apology.submittedBy}
                  </Typography>
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "#0277bd", mb: 0.5 }}
                >
                  Reason:
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#263238",
                    backgroundColor: "#e0f7fa",
                    p: 2,
                    borderRadius: 2,
                    lineHeight: 1.6,
                    fontSize: "0.95rem",
                  }}
                >
                  {apology.reason}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: "#607d8b",
                    display: "block",
                    textAlign: "right",
                    mt: 2,
                  }}
                >
                  Submitted on: {apology.submittedAt}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "#90a4ae",
              py: 4,
              fontWeight: 500,
            }}
          >
            No apology requests found for your account.
          </Typography>
        )}
      </DialogContent>

      {/* FOOTER */}
      <DialogActions
        sx={{
          backgroundColor: "#e0f7fa",
          borderTop: "1px solid #b2ebf2",
        }}
      >
        <Button
          onClick={handleClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#006064",
            "&:hover": {
              color: "#00acc1",
              backgroundColor: "rgba(0,188,212,0.1)",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApologyViewModal;
