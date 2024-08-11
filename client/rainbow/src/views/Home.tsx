import React, { useContext, useState, useEffect } from "react";
import { Layout, Menu, Tooltip, Drawer, message, Grid, theme, Button } from "antd";
import { UserOutlined, LogoutOutlined, ReadOutlined, MenuOutlined, EditOutlined } from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../App";
import useProtectedRoute from "../router/ProtectedRoute";

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

/**
 * The `Home` component serves as the main layout and navigation container for the application.
 * It provides a responsive design that adjusts based on the screen size and user role.
 * The component includes a header, sidebar, and content area, and it manages the state related
 * to menu navigation, drawer visibility, and user information.
 *
 * @component
 */
const Home: React.FC = () => {
  useProtectedRoute();

  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(() => {
    const storedMeetId = sessionStorage.getItem("lastSelectedMeetId");
    return storedMeetId || null;
  });

  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(UserContext);
  const screens = useBreakpoint();
  const [selectedKeys, setSelectedKeys] = useState<string[]>(['/']); // State to track selected menu item

  /**
   * Effect to update the selected menu keys based on the current location pathname.
   */
  useEffect(() => {
    setSelectedKeys([location.pathname]);
  }, [location.pathname]);

  /**
   * Effect to update the selected meet ID from session storage when the location state changes.
   */
  useEffect(() => {
    if (sessionStorage.getItem("lastSelectedMeetId")) {
      const currentMeetId = sessionStorage.getItem("lastSelectedMeetId") || '';
      setSelectedMeetId(currentMeetId);
    }
  }, [location.state]);

  /**
   * Handles menu item click and navigation. It also updates the selected meet ID in session storage.
   *
   * @param route The selected menu route object.
   */
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
      sessionStorage.setItem("lastSelectedMeetId", clickedMenuItem.meetId); // Update sessionStorage with new meetId
    }
  };

  /**
   * Generates the menu items based on the user's role (admin or volunteer).
   *
   * @returns An array of menu items to be displayed.
   */
  const getMenuItems = () => {
    const baseItems = [];

    if (user?.userRole === "admin") {
      baseItems.push(
        { label: "User Management", icon: <UserOutlined />, key: "/admin-dashboard", "data-testid": "menu-item-admin" },
        { label: "Meet Management", icon: <UserOutlined />, key: "/meet-management", "data-testid": "menu-item-meet-management" },
        { label: "View Meets", icon: <ReadOutlined />, key: "/view-meet", "data-testid": "menu-item-view-meet" },
        { label: "View Events", icon: <ReadOutlined />, key: "/view-event", "data-testid": "menu-item-start-list", meetId: selectedMeetId },
        { label: "Starter's Assistant Screen", icon: <EditOutlined />, key: "/checkin", "data-testid": "menu-item-start-list" },
        { label: "Track Judge Screen", icon: <EditOutlined />, key: "/trackjudge", "data-testid": "menu-item-track-judge"},
        { label: "PhotoFinish Screen", icon: <ReadOutlined />, key: "/photofinish", "data-testid": "menu-item-event-management" },
        { label: "Results", icon: <ReadOutlined />, key: "/results", "data-testid": "menu-item-all-results"}
      );
    } else if (user?.userRole === "volunteer") {
      baseItems.push(
        { label: "View Meets", icon: <ReadOutlined />, key: "/view-meet", "data-testid": "menu-item-view-meet" },
        { label: "View Events", icon: <ReadOutlined />, key: "/view-event", "data-testid": "menu-item-start-list", meetId: selectedMeetId },
        { label: "Starter's Assistant Screen", icon: <EditOutlined />, key: "/checkin", "data-testid": "menu-item-start-list" },
        { label: "Track Judge Screen", icon: <EditOutlined />, key: "/trackjudge", "data-testid": "menu-item-track-judge"},
        { label: "PhotoFinish Screen", icon: <ReadOutlined />, key: "/photofinish", "data-testid": "menu-item-event-management" },
        { label: "Results", icon: <ReadOutlined />, key: "/results", "data-testid": "menu-item-results"}
      );
    }

    return baseItems;
  };

  /**
   * Handles click on the user info, navigating to the profile page.
   */
  const handleUserInfoClick = () => {
    navigate("/profile");
  };

  /**
   * Handles user logout by clearing session data and redirecting to the login page.
   */
  const handleLogoutClick = async () => {
    try {
      if (user) {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("lastSelectedMeetId");
      }
      message.success("Logout successful");
      navigate("/login");
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Failed to logout";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  /**
   * Toggles the visibility of the mobile drawer menu.
   */
  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  /**
   * Closes the mobile drawer menu.
   */
  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  /**
   * Handles click on the logo, redirecting the user to the appropriate dashboard based on their role.
   */
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
           {/* Hamburger Icon */}
           {!screens.xl && (
            <Button
              style={{ border: "none", marginRight: "10px", background: "none", fontSize: "20px", color: "#fff" }}
              onClick={toggleDrawer}
            >
              <MenuOutlined />
            </Button>
          )}
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
        <h1 className="hide-on-xs"
          data-testid="title"
          style={{
            color: "#fff",
            margin: 0,
            position: screens.md ? "absolute" : "static",
            left: screens.md ? "50%" : "auto",
            transform: screens.md ? "translateX(-50%)" : "none",
            fontSize: screens.md ? "35px" : "25px", // Adjust the font size based on screen size
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
      </Header>

      {/* Side Drawer */}
      <Drawer
        placement="left"
        closable={false}
        onClose={closeDrawer}
        open={drawerVisible}
        width={250}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={["/"]}
          selectedKeys={selectedKeys}
          onClick={onMenuClick}
          style={{ background: "transparent", borderRight: 0 }}
          items={getMenuItems()}
        />
      </Drawer>

      <Layout>
        {/* Left Sider Area for Desktop */}
        {screens.xl && (
          <Sider data-testid="sider" width={250} style={{ background: colorBgContainer }}>
            <Menu mode="inline" defaultSelectedKeys={["/"]} selectedKeys={selectedKeys} onClick={onMenuClick} style={{ height: "100%", borderRight: 0 }} items={getMenuItems()} />
          </Sider>
        )}

        {/* Main Content Area */}
        <Layout style={{ padding: "0 24px 24px" }}>
          <Content style={{ marginTop: "20px", minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Home;
