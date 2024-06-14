import { useState, useContext } from "react";
import { Form, Input, Button, message, Layout, Card } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { ILoginValues } from "../types/LoginValues";
import { IUser } from "../types/User";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App.tsx";
import { loginAPI } from "../apis/api.ts";

const { Header, Content } = Layout;

const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { setUser } = useContext(UserContext);

    const onFinish = async (values: ILoginValues) => {
        setLoading(true);

        try {
            // login 
            //const response: any = await loginAPI(values);
        
            // save authToken
            //const authToken = response.headers["AUTHORIZATION"] || response.headers["authorization"] || response.headers["Authorization"];
            //if (authToken) {
                // save token to localStorage
                //localStorage.setItem("AUTH_TOKEN", authToken);
            //}

            // change obj to IUser
            // const loginUser: IUser = {
            //     id: response.data.obj.id,
            //     name: response.data.obj.name,
            //     email: response.data.obj.email,
            //     role: response.data.obj.type,
            //     department: response.data.obj.department,
            //     password: null,
            // };

            const loginUser: IUser = {
                id: 1, // Replace with a desired unique ID for your test user
                name: 'Michael Greer', // Replace with a desired test user name
                email: 'test.user@example.com', // Replace with a desired test user email
                role: 'admin', // Replace with a desired test user role (e.g., 'admin', 'user')
                department: null, // Replace with a desired test user department (optional)
                password: '12345678', // As in the original code
              };

            message.success("Login successfully");

            // UserContext
            setUser(loginUser);
            setLoading(false);

            // display by role
            if (loginUser.role === "admin") {
                navigate("/user");
            } else if (loginUser.role === "staff") {
                navigate("/project-staff");
            } else if (loginUser.role === "student") {
                navigate("/project-student");
            } else { }
        } catch (error: any) {
            const errMsg = error.response?.data?.msg || "Login failed";
            console.error(errMsg);
            message.error(errMsg);
            setLoading(false);
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
            </Header>
            <Content style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Card data-testid="login" title="Login" style={{ width: 350 }}>
                    <div style={{ maxWidth: "300px" }}>
                        <Form
                            name="login_form"
                            data-testid="login_form"
                            className="login-form"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                        >
                            <Form.Item
                                data-testid="userid"
                                name="userId"
                                rules={[{ required: true, message: "Please input your ID!" }]}
                                style={{ marginBottom: "20px" }}
                            >
                                <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="User ID" />
                            </Form.Item>
                            <Form.Item
                                data-testid="password"
                                name="password"
                                rules={[{ required: true, message: "Please input your Password!" }]}
                            >
                                <Input
                                    prefix={<LockOutlined className="site-form-item-icon" />}
                                    type="password"
                                    placeholder="Password"
                                />
                            </Form.Item>

                            <Form.Item data-testid="loginitem">
                                <Button data-testid="loginbutton" type="primary" htmlType="submit" className="login-form-button" loading={loading}>
                                    Log in
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Card>

            </Content>
        </Layout>
    );
};

export default LoginPage;