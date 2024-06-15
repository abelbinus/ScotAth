import React, { useContext } from "react";
import type { MenuProps } from "antd";
import { Layout, Menu, theme, Tooltip, message } from "antd";
import { ReadOutlined, UserOutlined, SolutionOutlined, LogoutOutlined } from "@ant-design/icons";
import { Outlet, useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import useProtectedRoute from "../router/ProtectedRoute";

const { Header, Content, Sider } = Layout;

const Home: React.FC = () => {
  useProtectedRoute();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const navigate = useNavigate();
  const onMenuClick: MenuProps["onClick"] = (route) => {
    const path = route.key;
    navigate(path);
  };

  // userInfo
  const userContext = useContext(UserContext);

  // generate menus by role
  const getMenuItems = () => {
    const baseItems = [];
  
    if (userContext?.user?.role === "admin") {
      baseItems.push(
        { label: "Staff Management", icon: <UserOutlined />, key: "/user", "data-testid": "menu-item-admin" },
        { label: "Modify Meet", icon: <UserOutlined />, key: "/meet-admin", "data-testid": "menu-item-meet-admin" }
      );
    } else if (userContext?.user?.role === "volunteer") {
      baseItems.push(
        //{ label: "Meet", icon: <ReadOutlined />, key: "/project-staff", "data-testid": "menu-item-meet-staff" },
        //{ label: "Project Allocation", icon: <SolutionOutlined />, key: "/project-allocation-staff", "data-testid": "menu-item-project-allocation-staff" }
      );
    } else if (userContext?.user?.role === "student") {
      baseItems.push(
        { label: "Project Selection", icon: <ReadOutlined />, key: "/project-student", "data-testid": "menu-item-project-student" },
        { label: "Apply History", icon: <SolutionOutlined />, key: "/project-allocation-student", "data-testid": "menu-item-apply-history" }
      );
    }
  
    return baseItems;
  };
  

  // profile
  const handleUserInfoClick = () => {
    navigate("/profile");
  };

  // logout
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

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#162c66", backgroundSize: "cover" }}>
      <Header data-testid="header" style={{ display: "flex", justifyContent: "space-between", paddingInline: 20, alignItems: "center", color: "#fff", backgroundColor: "#162c66", fontWeight: "bold", fontSize: "25px" }}>
          <div style={{ display: "flex", alignItems: "center"}}>
              {/* Logo */}
              <img data-testid="logo" src="/images/logo.png" alt="Logo" style={{ height: "70px" }} />
              {/* title */}
              <h1 data-testid="title" style={{ color: "#fff", marginLeft: "10px", marginBottom: "5" }}>
                  Rainbow
              </h1>
          </div>

        {/* loginUser */}
        {userContext ? (
          <div style={{ display: "flex", alignItems: "center", marginRight: "20px" }}>
            <Tooltip title="My Profile">
              <div data-testid="tooltip-my-profile" onClick={handleUserInfoClick} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                <UserOutlined style={{ marginRight: 10, color: "#fff" }} />
                <span style={{ fontSize: "18px", color: "#fff" }}>{userContext?.user?.name}</span>
              </div>
            </Tooltip>
            <span style={{ borderLeft: "1px solid #fff", height: "20px", marginRight: "20px", marginLeft: "20px" }}></span>
            <Tooltip title="Logout">
              <LogoutOutlined onClick={handleLogoutClick} style={{ fontSize: "18px", color: "#fff", cursor: "pointer" }} />
            </Tooltip>
          </div>
        ) : (
          <div>Login</div>
        )}
      </Header>
      <Layout>
        {/*Left sider area*/}
        <Sider data-testid="sider" width={250} style={{ background: colorBgContainer }}>
          <Menu mode="inline" defaultSelectedKeys={["/"]} onClick={onMenuClick} style={{ height: "100%", borderRight: 0 }} items={getMenuItems()} />
        </Sider>

        <Layout style={{ padding: "0 24px 24px" }}>
          {/*Right content area*/}
          <Content
            style={{
              padding: 24,
              marginTop: "20px",
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default Home