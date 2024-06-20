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

            message.success("Login successful");

            // Update user context
            setUser(loginUser);
            setLoading(false);

            // Navigate based on user role
            if (loginUser.userRole === "admin") {
                navigate("/admin-dashboard");
            } else {
                navigate("/event-management");
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.msg || "Login failed";
            console.error(errMsg);
            message.error(errMsg);
            setLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh', backgroundColor: '#162c66', backgroundSize: 'cover' }}>
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px 20px' }}>
                <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px', }}>
                        <img src="/images/logo.png" alt="Logo" style={{ height: '100px' }} />
                    </div>
                    <h1 data-testid="title" style={{ color: "#fff", marginBottom: '30px' }}>Rainbow</h1>
                    <Card data-testid="login" title="Login" style={{ borderRadius: '8px' }}>
                        <Form
                            name="login_form"
                            data-testid="login_form"
                            className="login-form"
                            initialValues={{ remember: true }}
                            onFinish={onFinish}
                        >
                            <Form.Item
                                name="userName"
                                rules={[{ required: true, message: 'Please input your username!' }]}
                                style={{ marginBottom: '20px' }}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="User Name"
                                    style={{ height: '50px', fontSize: '16px' }} // Increased height and font size
                                />
                            </Form.Item>
                            <Form.Item
                                name="userPass"
                                rules={[{ required: true, message: 'Please input your Password!' }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Password"
                                    style={{ height: '50px', fontSize: '16px' }} // Increased height and font size
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="login-form-button"
                                    loading={loading}
                                    style={{ height: '50px', fontSize: '16px', width: '100%' }} // Increased height and font size
                                >
                                    Log in
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            </Content>
        </Layout>
    );
};

export default LoginPage;
