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
            const response: any = await loginAPI(values);

            // Convert the response to IUser format
            const loginUser: IUser = {
                userId: response.data.user.userId,
                firstName: response.data.user.firstName,
                middleName: response.data.user.middleName,
                lastName: response.data.user.lastName,
                userName: response.data.user.userName,
                userEmail: response.data.user.userEmail || '', // You need to handle this if email is not provided in the response
                userRole: response.data.user.userRole,
                userPass: null, // Assuming you do not store password in loginUser object
                userAddress: response.data.user.userAddress,
                userMob: response.data.user.userMob
            };

            message.success("Login successfully");

            // UserContext
            setUser(loginUser);
            setLoading(false);

            // display by role
            if (loginUser.userRole === "admin") {
                navigate("/user");
            } else if (loginUser.userRole === "volunteer") {
                navigate("/project-staff");
            } else { }
        } catch (error: any) {
            const errMsg = error.response?.data?.msg || "Login failed";
            console.error(errMsg);
            message.error(errMsg);
            setLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh', backgroundColor: '#162c66', backgroundSize: 'cover' }}>
            <Content style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h1
                data-testid="title"
                style={{
                    color: "#fff",
                    position: "absolute",
                    top: "50px",  // Adjust this value to move the title higher up
                    left: "50%",
                    transform: "translateX(-50%)",
                    margin: 0
                }}
                >
                Rainbow
                </h1>
                <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', marginTop: '20px' }}>
                {/* Left Half: Logo and Dummy Picture */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                    <img
                    src="/images/logo.png"
                    alt="Logo"
                    style={{ height: '100px', marginBottom: '20px' }}
                    />
                    <img
                    src="/images/dummy.png"
                    alt="Dummy"
                    style={{ height: '200px' }}
                    />
                </div>

                {/* Right Half: Login Form */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Card data-testid="login" title="Login" style={{ width: 350 }}>
                    <div style={{ maxWidth: '300px' }}>
                        <Form
                        name="login_form"
                        data-testid="login_form"
                        className="login-form"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        >
                        <Form.Item
                            data-testid="userName"
                            name="userName"
                            rules={[{ required: true, message: 'Please input your username!' }]}
                            style={{ marginBottom: '20px' }}
                        >
                            <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="User Name" />
                        </Form.Item>
                        <Form.Item
                            data-testid="userPass"
                            name="userPass"
                            rules={[{ required: true, message: 'Please input your Password!' }]}
                        >
                            <Input.Password
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
                </div>
                </div>
            </Content>
        </Layout>
    );
};

export default LoginPage;
