import React, { useContext, useState, useEffect } from "react";
import { Layout, Menu, Tooltip, Drawer, message, Grid, theme } from "antd";
import { UserOutlined, LogoutOutlined, ReadOutlined } from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../App";
import useProtectedRoute from "../router/ProtectedRoute";
import { useVisibility } from "../Provider/VisibilityProvider";

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

const Home: React.FC = () => {
  useProtectedRoute();
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(() => {
    const storedMeetId = localStorage.getItem("lastSelectedMeetId");
    return storedMeetId || null;
  });

  // const [selectedEventId, setSelectedEventId] = useState<string | null>(() => {
  //   const storedEventId = localStorage.getItem("lastSelectedEventId");
  //   return storedEventId || null;
  // });
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);
  const screens = useBreakpoint();
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['/']); // State to track selected menu item
  const { showLabels } = useVisibility();
  useEffect(() => {
    // Update selectedKeys based on location pathname
    setSelectedKeys([location.pathname]);
  }, [location.pathname]);

  useEffect(() => {
    if (localStorage.getItem("lastSelectedMeetId")) {
      const currentMeetId = localStorage.getItem("lastSelectedMeetId") || '';
      setSelectedMeetId(currentMeetId);
    }
    // if(localStorage.getItem("lastSelectedEventId")) {
    //   const currentEventId = localStorage.getItem("lastSelectedEventId") || '';
    //   setSelectedEventId(currentEventId);
    // }
  }, [location.state]);

  const onMenuClick = (route: any) => {
    const path = route.key;
    navigate(path);

    // Close drawer on mobile
    if (screens.xs) {
      closeDrawer();
    }

    // Update selectedMeetId based on clicked menu item
    const clickedMenuItem = getMenuItems().find(item => item.key === path);
    if (clickedMenuItem?.meetId) {
      setSelectedMeetId(clickedMenuItem.meetId);
      localStorage.setItem("lastSelectedMeetId", clickedMenuItem.meetId); // Update localStorage with new meetId
    }
    // if(clickedMenuItem?.eventId) {
    //   setSelectedEventId(clickedMenuItem.eventId);
    //   localStorage.setItem("lastSelectedEventId", clickedMenuItem.eventId);
    // }
  };

  const getMenuItems = () => {
    const baseItems = [];

    if (user?.userRole === "admin") {
      baseItems.push(
        { label: "User Management", icon: <UserOutlined />, key: "/admin-dashboard", "data-testid": "menu-item-admin" },
        { label: "Meet Management", icon: <UserOutlined />, key: "/meet-management", "data-testid": "menu-item-meet-management" }
      );
    } else if (user?.userRole === "volunteer") {
      baseItems.push(
        { label: "View Meets", icon: <ReadOutlined />, key: "/view-meet", "data-testid": "menu-item-view-meet" },
        ...(showLabels ? [
          { label: "View Events", icon: <ReadOutlined />, key: "/view-event", "data-testid": "menu-item-start-list", meetId: selectedMeetId },
          { label: "Marksmen Screen", icon: <ReadOutlined />, key: "/checkin", "data-testid": "menu-item-start-list" },
          { label: "Track Judge Screen", icon: <ReadOutlined />, key: "/trackjudge", "data-testid": "menu-item-track-judge"},
          { label: "PhotoFinish Screen", icon: <ReadOutlined />, key: "/photofinish", "data-testid": "menu-item-event-management" },
          { label: "All Results", icon: <ReadOutlined />, key: "/allresults", "data-testid": "menu-item-all-results"}
        ] : [])
      );
    }

    return baseItems;
  };

  const handleUserInfoClick = () => {
    navigate("/profile");
  };

  const handleLogoutClick = async () => {
    try {
      //await logoutAPI();
      message.success("Logout successful");
      navigate("/login");
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Failed to logout";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const onLogoClick = () => {
    if (user?.userRole === "admin") {
      navigate("/admin-dashboard");
    } else if (user?.userRole === "volunteer") {
      navigate("/view-meet");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#162c66", backgroundSize: "cover" }}>
      <Header style={{
        display: "flex",
        justifyContent: "space-between",
        paddingInline: 20,
        alignItems: "center",
        color: "#fff",
        backgroundColor: "#162c66",
        fontWeight: "bold",
        fontSize: "25px",
        position: 'relative'
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Logo */}
          {screens.md && (
            <img
              data-testid="logo"
              src="/images/logo.png"
              alt="Logo"
              style={{ height: "70px" }}
              onClick={onLogoClick}
            />
          )}
        </div>

        {/* Title */}
        <h1
          data-testid="title"
          style={{
            color: "#fff",
            margin: 0,
            position: screens.md ? "absolute" : "static",
            left: screens.md ? "50%" : "auto",
            transform: screens.md ? "translateX(-50%)" : "none",
            fontSize: screens.md ? "50px" : "25px", // Adjust the font size based on screen size
          }}
        >
          Rainbow
        </h1>

        {/* Login User Info */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", marginRight: "20px" }}>
              <Tooltip title="My Profile">
                <div
                  data-testid="tooltip-my-profile"
                  onClick={handleUserInfoClick}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <UserOutlined style={{ marginRight: 10, color: "#fff" }} />
                  <span style={{ fontSize: "18px", color: "#fff" }}>
                    {user.firstName}
                  </span>
                </div>
              </Tooltip>
              <span
                style={{
                  borderLeft: "1px solid #fff",
                  height: "20px",
                  marginRight: "20px",
                  marginLeft: "20px",
                }}
              ></span>
              <Tooltip title="Logout">
                <LogoutOutlined
                  onClick={handleLogoutClick}
                  style={{ fontSize: "18px", color: "#fff", cursor: "pointer" }}
                />
              </Tooltip>
            </div>
          ) : (
            <div>Login</div>
          )}
        </div>

        {/* Burger Menu (Drawer) for Mobile */}
        {!screens.md && (
          <div className="burger-menu">
            <Drawer
              title="Menu"
              placement="right"
              closable={true}
              onClose={closeDrawer}
              open={drawerVisible}
              style={{ padding: 0 }}
            >
              <Menu
                mode="inline"
                defaultSelectedKeys={["/"]}
                selectedKeys={selectedKeys} // Use selectedKeys state
                onClick={onMenuClick}
                style={{ height: "100%", borderRight: 0 }}
                items={getMenuItems()}
              />
            </Drawer>
          </div>
        )}
      </Header>


      <Layout>
        {/* Left Sider Area for Desktop */}
        {screens.md && (
          <Sider data-testid="sider" width={250} style={{ background: colorBgContainer }}>
            <Menu mode="inline" defaultSelectedKeys={["/"]} selectedKeys={selectedKeys} onClick={onMenuClick} style={{ height: "100%", borderRight: 0 }} items={getMenuItems()} />
          </Sider>
        )}

        {/* Main Content Area */}
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content style={{ padding: 24, marginTop: "20px", minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Home;
