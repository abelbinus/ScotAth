import React, { useContext, useState } from "react";
import { Layout, Menu, Tooltip, Drawer, message, Grid, theme } from "antd";
import { UserOutlined, LogoutOutlined, ReadOutlined } from "@ant-design/icons";
import { Outlet, useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import useProtectedRoute from "../router/ProtectedRoute";

const { Header, Content, Sider } = Layout;
const Home: React.FC = () => {
  useProtectedRoute();
  const [selectedMeetId, setSelectedMeetId] = useState<string | null>(null);
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const { useBreakpoint } = Grid;

  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const userContext = useContext(UserContext);
  const screens = useBreakpoint();

  const onMenuClick = (route: any) => {
    const path = route.key;
    navigate(path);
    if (screens.xs) {
      closeDrawer();
    }
  };

  const getMenuItems = () => {
    const baseItems = [];

    if (userContext?.user?.userRole === "admin") {
      baseItems.push(
        { label: "User Management", icon: <UserOutlined />, key: "/admin-dashboard", "data-testid": "menu-item-admin" },
        { label: "Meet Management", icon: <UserOutlined />, key: "/meet-management", "data-testid": "menu-item-meet-management" }
      );
    } else if (userContext?.user?.userRole === "volunteer") {
      baseItems.push(
        { label: "View Meets", icon: <ReadOutlined />, key: "/view-meet", "data-testid": "menu-item-view-meet" },
        // { label: "View Events", icon: <ReadOutlined />, key: "/event-management", "data-testid": "menu-item-event-management", meetId: selectedMeetId },
      );
    }

    return baseItems;
  };

  const handleMeetSelection = (meetId: string) => {
    setSelectedMeetId(meetId); // Update selectedMeetId when a meet is selected
    navigate("/event-management", { state: { meetId } }); // Navigate to event-management with meetId
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

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#162c66", backgroundSize: "cover" }}>
      <Header
  data-testid="header"
  style={{
    display: "flex",
    justifyContent: "space-between",
    paddingInline: 20,
    alignItems: "center",
    color: "#fff",
    backgroundColor: "#162c66",
    fontWeight: "bold",
    fontSize: "25px",
    position: 'relative'
  }}
>
  <div style={{ display: "flex", alignItems: "center" }}>
    {/* Logo */}
    {screens.md && (
      <img
        data-testid="logo"
        src="/images/logo.png"
        alt="Logo"
        style={{ height: "70px" }}
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
    {userContext ? (
      <div style={{ display: "flex", alignItems: "center", marginRight: "20px" }}>
        <Tooltip title="My Profile">
          <div
            data-testid="tooltip-my-profile"
            onClick={handleUserInfoClick}
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <UserOutlined style={{ marginRight: 10, color: "#fff" }} />
            <span style={{ fontSize: "18px", color: "#fff" }}>
              {userContext?.user?.firstName}
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
        visible={drawerVisible}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="inline"
          defaultSelectedKeys={["/"]}
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
            <Menu mode="inline" defaultSelectedKeys={["/"]} onClick={onMenuClick} style={{ height: "100%", borderRight: 0 }} items={getMenuItems()} />
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
