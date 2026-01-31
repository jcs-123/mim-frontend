import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Divider,
  IconButton,
  Collapse,
  Stack,
  CircularProgress,
  Zoom,
  Grow
} from "@mui/material";
import {
  ExpandMore,
  CalendarToday,
  Schedule,
  Assignment,
  Close,
  FamilyRestroom,
  AdminPanelSettings,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  ArrowForward,
  ArrowBack
} from "@mui/icons-material";
import axios from "axios";

const StudentViewRequestModal = ({ open, handleClose }) => {
  const [requests, setRequests] = useState([]);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (open) {
      fetchRequests();
    } else {
      setExpandedRequest(null);
    }
  }, [open]);

  const fetchRequests = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.admissionNumber) return;

    setLoading(true);
    axios
      .get("https://mim-backend-b5cd.onrender.com/messcut/student", {
        params: { admissionNo: user.admissionNumber },
      })
      .then((res) => {
        const sortedRequests = res.data.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setRequests(sortedRequests);
      })
      .catch((err) => console.error("Error fetching:", err))
      .finally(() => setLoading(false));
  };

  // Enhanced Status Chip Component
  const StatusChip = ({ status, type, isMobile }) => {
    const statusConfig = {
      APPROVE: { label: "Approved", color: "success", icon: <CheckCircle /> },
      REJECT: { label: "Rejected", color: "error", icon: <Cancel /> },
      PENDING: { label: "Pending", color: "warning", icon: <Pending /> },
      ACCEPT: { label: "Accepted", color: "success", icon: <CheckCircle /> }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const typeIcon = type === 'parent' ? 
      <FamilyRestroom sx={{ fontSize: 14 }} /> : 
      <AdminPanelSettings sx={{ fontSize: 14 }} />;

    return (
      <Grow in timeout={400}>
        <Chip
          size="small"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {typeIcon}
              <Typography variant="caption" fontWeight={600}>
                {isMobile ? config.label : `${type === 'parent' ? 'Parent' : 'Admin'}: ${config.label}`}
              </Typography>
            </Box>
          }
          color={config.color}
          icon={React.cloneElement(config.icon, { fontSize: "small" })}
          sx={{
            fontWeight: 600,
            borderRadius: 1.5,
            fontSize: '0.7rem',
            height: 26,
            minWidth: 80,
            '& .MuiChip-icon': { 
              fontSize: '0.875rem', 
              ml: 0.5,
              opacity: 0.9
            }
          }}
        />
      </Grow>
    );
  };

  const handleExpandClick = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Improved Mobile Card View
  const renderMobileView = () => (
    <Stack spacing={1.5} sx={{ mt: 0.5, px: 0.5 }}>
      {requests.map((r, index) => (
        <Zoom 
          key={r._id} 
          in 
          timeout={200 + index * 50}
          style={{ transitionDelay: `${index * 30}ms` }}
        >
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2.5,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              '&:hover': {
                transform: 'translateY(-2px)',
                transition: 'transform 0.2s ease',
                boxShadow: theme.shadows[3]
              }
            }}
          >
            {/* Status Indicator Bar */}
            <Box sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              bgcolor: 
                r.status === 'ACCEPT' && r.parentStatus === 'APPROVE' ? 'success.main' :
                r.status === 'REJECT' || r.parentStatus === 'REJECT' ? 'error.main' :
                'warning.main',
              borderTopLeftRadius: 10,
              borderBottomLeftRadius: 10
            }} />
            
            <CardContent sx={{ 
              p: 2, 
              pl: 3,
              '&:last-child': { pb: 2 } 
            }}>
              {/* Header - Date and Expand */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                mb: 1.5 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ 
                    fontSize: 18, 
                    color: 'primary.main',
                    opacity: 0.9
                  }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {formatDate(r.createdAt)}
                  </Typography>
                </Box>
                
                <IconButton 
                  size="small" 
                  onClick={() => handleExpandClick(r._id)}
                  sx={{
                    transform: expandedRequest === r._id ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    bgcolor: expandedRequest === r._id ? 'primary.light' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ExpandMore />
                </IconButton>
              </Box>

              {/* Compact Status Bar */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 2,
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'background.default',
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FamilyRestroom sx={{ fontSize: 14, color: 'primary.main' }} />
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Parent
                    </Typography>
                  </Box>
                  <StatusChip status={r.parentStatus} type="parent" isMobile={true} />
                </Box>
                
                <ArrowForward sx={{ fontSize: 16, color: 'text.disabled', mx: 1 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AdminPanelSettings sx={{ fontSize: 14, color: 'secondary.main' }} />
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Admin
                    </Typography>
                  </Box>
                  <StatusChip status={r.status} type="admin" isMobile={true} />
                </Box>
              </Box>

              {/* Date Timeline */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 2,
                position: 'relative'
              }}>
                {/* Timeline Connector */}
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '25%',
                  right: '25%',
                  height: 2,
                  bgcolor: 'divider',
                  transform: 'translateY(-50%)',
                  zIndex: 0
                }} />
                
                {/* Leaving */}
                <Box sx={{ 
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.primary.light}`,
                  minWidth: 100
                }}>
                  <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                    LEAVE
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {r.leavingDate}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                    <Schedule sx={{ fontSize: 12, color: 'primary.main' }} />
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {formatTime(r.leavingTime)}
                    </Typography>
                  </Box>
                </Box>

                {/* Arrow */}
                <ArrowForward sx={{ 
                  fontSize: 20, 
                  color: 'text.disabled',
                  position: 'relative',
                  zIndex: 1
                }} />

                {/* Returning */}
                <Box sx={{ 
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.secondary.light}`,
                  minWidth: 100
                }}>
                  <Typography variant="caption" fontWeight={700} color="secondary.main" sx={{ mb: 0.5 }}>
                    RETURN
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {r.returningDate}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                    <Schedule sx={{ fontSize: 12, color: 'secondary.main' }} />
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {formatTime(r.returningTime)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Reason Preview */}
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.4,
                  mb: 1.5
                }}
              >
                {r.reason}
              </Typography>

              {/* Expandable Details */}
              <Collapse in={expandedRequest === r._id} timeout="auto">
                <Fade in={expandedRequest === r._id} timeout={300}>
                  <Box>
                    <Divider sx={{ 
                      my: 1.5, 
                      borderStyle: 'dashed',
                      borderColor: 'divider'
                    }} />
                    
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 1.5,
                      bgcolor: 'background.default',
                      border: `1px solid ${theme.palette.divider}`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Assignment sx={{ 
                          fontSize: 18, 
                          color: 'primary.main',
                          mt: 0.25 
                        }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                            DETAILED REASON
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            color: 'text.secondary',
                            lineHeight: 1.6,
                            fontSize: '0.875rem'
                          }}>
                            {r.reason}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Fade>
              </Collapse>

              {/* Expand Hint */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 1,
                  pt: 1,
                  borderTop: `1px dashed ${theme.palette.divider}`
                }}
                onClick={() => handleExpandClick(r._id)}
              >
                <Typography 
                  variant="caption" 
                  color="primary" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer'
                  }}
                >
                  {expandedRequest === r._id ? (
                    <>
                      <ArrowBack sx={{ fontSize: 12 }} />
                      Tap to collapse
                    </>
                  ) : (
                    <>
                      View full details
                      <ExpandMore sx={{ fontSize: 12 }} />
                    </>
                  )}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Zoom>
      ))}
    </Stack>
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="lg"
      fullScreen={isMobile}
      TransitionComponent={Slide}
      transitionDuration={300}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 1.5,
          background: theme.palette.background.default,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Enhanced Header */}
      <Box sx={{ 
        p: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.paper} 100%)`,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1.5 
        }}>
          <Typography variant="h6" component="h2" fontWeight={800} color="primary.main">
            My Requests
          </Typography>
          <IconButton 
            onClick={handleClose} 
            size="small"
            sx={{
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'primary.light' }
            }}
          >
            <Close />
          </IconButton>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            📅 {requests.length} request{requests.length !== 1 ? 's' : ''}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FamilyRestroom sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="caption" fontWeight={600}>
                Parent
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AdminPanelSettings sx={{ fontSize: 16, color: 'secondary.main' }} />
              <Typography variant="caption" fontWeight={600}>
                Admin
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ 
        p: 2,
        flex: 1,
        overflow: 'auto',
        bgcolor: 'background.default'
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh',
            gap: 2
          }}>
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body2" color="text.secondary">
              Loading your requests...
            </Typography>
          </Box>
        ) : requests.length === 0 ? (
          <Fade in timeout={500}>
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              px: 2
            }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <AccessTime sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" gutterBottom color="text.primary" fontWeight={700}>
                No requests yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submit a mess cut request to see it here
              </Typography>
            </Box>
          </Fade>
        ) : (
          renderMobileView()
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.default'
      }}>
        <Button 
          onClick={handleClose}
          variant="contained"
          fullWidth
          size="large"
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            py: 1.2,
            fontSize: '1rem',
            boxShadow: `0 4px 12px ${theme.palette.primary.main}20`
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentViewRequestModal;