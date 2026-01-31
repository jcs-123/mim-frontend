import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import {
  Dashboard,
  Assessment,
  CalendarMonth,
  People,
  Assignment,
  Report,
  Event,
  ListAlt,
  Logout,
  Flag,
  DoneAll,
  NoteAlt,
  ErrorOutline,
  ExpandLess,
  ExpandMore,
  BarChart,
  School,
  Today,
  CheckCircle,
  AssignmentTurnedIn,
  Fastfood,
  NoMeals,
  Summarize,
  Sms,
  CompareArrows,
  Nightlife,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import PaymentsIcon from "@mui/icons-material/Payments";
import { Person } from "react-bootstrap-icons";

const drawerWidth = 240;

function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();

  // Track which dropdown is open
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleDropdownToggle = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  /* ======================== MENU STRUCTURE ========================== */
  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    {
      text: "Student Profile",
      icon: <Person />,
      path: "/student-profile"
    },

    { text: "Mess Cut Report", icon: <Report />, path: "/mess-cut-report" },
    { text: "Name Wise Report", icon: <People />, path: "/name-wise-report" },
    { text: "Date Wise Report", icon: <CalendarMonth />, path: "/date-wise-report" },
    {
      text: "Fee Pay (Bulk Upload)",
      icon: <PaymentsIcon />,
      path: "/fee-pay",
    },


    {
      text: "Attendance Reports",
      icon: <Assessment />, // main section icon
      subMenu: [
        {
          text: "Attendance Sheet",
          icon: <AssignmentTurnedIn />, // ✅ clipboard/checklist icon
          path: "/attendance-report",
        },
        {
          text: "Attendance Monthly Report",
          icon: <CalendarMonth />,
          path: "/attendance-monthly-report",
        },
        {
          text: "Present But Mess Cut",
          icon: <Fastfood />, // ✅ represents mess/canteen-related
          path: "/present-messcut-report",
        },
        {
          text: "Absent But No Mess Cut",
          icon: <NoMeals />, // ✅ crossed plate = no mess deduction
          path: "/absent-nomesscut-report",
        },
        {
          text: "Absentees Report",
          icon: <Summarize />, // ✅ report/summary style icon
          path: "/absentees-report",
        },
        {
          text: "Absent Comparison",
          icon: <CompareArrows />, // ✅ comparison symbol
          path: "/attendance-comparison",
        },

      ],
    },


    { text: "Request View", icon: <Event />, path: "/request-view" },
    { text: "Request Bulk Approval", icon: <DoneAll />, path: "/Request-Bulk-Aprove" },
    { text: "Holiday Select", icon: <Flag />, path: "/holiday-select" },
    { text: "Apology Request", icon: <NoteAlt />, path: "/Aplology-Request" },
    { text: "Apology Request View", icon: <NoteAlt />, path: "/student-details" },
    { text: "Complaint View", icon: <ErrorOutline />, path: "/complaint-details" },
    {
      text: "Monthly Outing Eligible",
      icon: <Nightlife />,
      path: "/outing"
    },
    {
      text: "Monthly Request/Report",
      icon: <Nightlife />,
      path: "/outingrequestandreport" // this page
    },
    {
      text: "Semester Bulk Change",
      icon: <School />,
      path: "/semester-bulk-change",
    }


  ];

  /* ======================== DRAWER CONTENT ========================== */
  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(180deg, #f8f9fb 0%, #edf2f7 100%)",
      }}
    >
      {/* ==== Logo ==== */}
      <Box
        sx={{
          textAlign: "center",
          py: 2.5,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "#1976d2",
            letterSpacing: 0.5,
          }}
        >
          FREDBOX
        </Typography>
      </Box>

      {/* ==== Menu Section ==== */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", mt: 1 }}>
        <List disablePadding>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            /* ===== Dropdown Menu ===== */
            if (item.subMenu) {
              const isOpen = openDropdown === item.text;
              return (
                <React.Fragment key={item.text}>
                  <ListItemButton
                    onClick={() => handleDropdownToggle(item.text)}
                    sx={{
                      mx: 1,
                      my: 0.3,
                      borderRadius: 2,
                      transition: "all 0.3s ease",
                      backgroundColor: isOpen
                        ? "rgba(25,118,210,0.1)"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(25,118,210,0.12)",
                        transform: "translateX(3px)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: "#1976d2",
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        fontSize: "0.93rem",
                        color: "#1976d2",
                      }}
                    />
                    {isOpen ? (
                      <ExpandLess sx={{ color: "#1976d2" }} />
                    ) : (
                      <ExpandMore sx={{ color: "#1976d2" }} />
                    )}
                  </ListItemButton>

                  {/* Submenu Items */}
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subMenu.map((sub) => (
                        <ListItemButton
                          key={sub.text}
                          component={Link}
                          to={sub.path}
                          onClick={isMobile ? handleDrawerToggle : undefined}
                          sx={{
                            pl: 7,
                            mx: 1,
                            my: 0.2,
                            borderRadius: 2,
                            transition: "all 0.2s ease",
                            backgroundColor:
                              location.pathname === sub.path
                                ? "rgba(25,118,210,0.12)"
                                : "transparent",
                            "&:hover": {
                              backgroundColor: "rgba(25,118,210,0.1)",
                              transform: "translateX(4px)",
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color:
                                location.pathname === sub.path
                                  ? "#1976d2"
                                  : "rgba(0,0,0,0.6)",
                              minWidth: 40,
                            }}
                          >
                            {sub.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={sub.text}
                            primaryTypographyProps={{
                              fontWeight:
                                location.pathname === sub.path ? 600 : 400,
                              fontSize: "0.88rem",
                              color:
                                location.pathname === sub.path
                                  ? "#1976d2"
                                  : "rgba(0,0,0,0.85)",
                            }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </React.Fragment>
              );
            }

            /* ===== Normal Menu Item ===== */
            return (
              <Tooltip
                key={item.text}
                title={isMobile ? "" : item.text}
                placement="right"
                arrow
              >
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={isMobile ? handleDrawerToggle : undefined}
                  sx={{
                    mx: 1,
                    my: 0.3,
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    backgroundColor: isActive
                      ? "rgba(25,118,210,0.12)"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(25,118,210,0.1)",
                      transform: "translateX(3px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "#1976d2" : "rgba(0,0,0,0.6)",
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                      fontSize: "0.93rem",
                      color: isActive ? "#1976d2" : "rgba(0,0,0,0.85)",
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* ==== Logout ==== */}
      <Box sx={{ p: 1 }}>
        <ListItemButton
          onClick={() => alert("Logout Clicked")}
          sx={{
            borderRadius: 2,
            "&:hover": {
              backgroundColor: "rgba(244,67,54,0.08)",
              transform: "translateX(4px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemIcon sx={{ color: "#f44336" }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontWeight: 600,
              color: "#f44336",
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  /* ======================== DRAWERS ========================== */
  return (
    <>
      {/* ==== Mobile Drawer ==== */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            borderRight: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
            transition: "transform 0.3s ease-in-out",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* ==== Desktop Drawer ==== */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            position: "fixed",
            height: "100vh",
            borderRight: "1px solid #e0e0e0",
            boxShadow: "2px 0 8px rgba(0,0,0,0.05)",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export default Sidebar;
