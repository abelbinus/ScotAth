/* eslint-disable jsx-a11y/anchor-is-valid */
import { useState, useEffect, useContext } from "react";
import { Divider, Input, Col, Row, Button, Space, Table, Modal, Form, message, Popconfirm, Tag, Radio, Select, Tabs, Grid, Typography} from "antd";
import type { TableColumnsType } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { UserContext } from "../App";
import { IUser } from "../modals/User";
import { getAllUsersAPI, addUserAPI, updateUserAPI, deleteUserAPI } from "../apis/api";
import { AxiosError } from "axios";
import bcrypt from "bcryptjs-react";

/**
 * UserManagement component for managing users (admin and volunteers) in the application.
 * Allows adding, editing, and deleting users.
 */
const UserManagement = () => {
  // User information from context
  const userContext = useContext(UserContext);

  // State variables for modal visibility, user lists, and form handling
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [, setEditingUser] = useState<IUser | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [userList, setUserList] = useState<IUser[]>([]);
  const [volList, setVolList] = useState<IUser[]>([]);
  const [adminList, setAdminList] = useState<IUser[]>([]);
  const [addform] = Form.useForm();
  const [editForm] = Form.useForm();

  const { Title } = Typography;

  // Table columns for user list
  const columns: TableColumnsType<IUser> = [
    { title: "User ID", dataIndex: "userId", key: "userId" },
    { title: "User Name", dataIndex: "userName", key: "userName" },
    { title: "Email", dataIndex: "userEmail", key: "userEmail" },
    {
      title: "Role", dataIndex: "userRole", key: "userRole",
      render: (_: any, { userRole }: any) => (
        <>
          {userRole === "volunteer" ? (
            <Tag color="blue">volunteer</Tag>
          ) : userRole === "admin" ? (
            <Tag color="red">admin</Tag>
          ) : null}
        </>
      ),
    },
    {
      title: "Action",
      key: "operation",
      render: (_, record) =>
        <Space size="middle">
          <Button onClick={() => onEditClick(record)}>Edit</Button>
          <Popconfirm
            title="Delete the user"
            description="Are you sure to delete this user?"
            onConfirm={() => onDeleteClick(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button>Delete</Button>
          </Popconfirm>
        </Space>,
    },
  ];

  /**
   * Fetches the list of users from the API and updates the state.
   */
  const getUserList = async () => {
    try {
      const response: any = await getAllUsersAPI();
      const userList: any[] = response.data;

      let users = userList.map((user): IUser => {
        return {
          userId: user.userId,
          firstName: user.firstName,
          middleName: user.middleName || '',
          lastName: user.lastName,
          userName: user.userName,
          userPass: null,
          userEmail: user.userEmail || '',
          userRole: user.userRole,
          userMob: user.userMob || '',
          userAddress: user.userAddress || ''
        }
      });

      const volList = users.filter(i => i.userRole === "volunteer");
      const adminList = users.filter(i => i.userRole === "admin");

      setUserList(users);
      setVolList(volList);
      setAdminList(adminList);

    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Loading list failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  // Fetch user list on component mount
  useEffect(() => {
    getUserList();
  }, [])

  // Check if the current user has admin privileges
  if (userContext?.user?.userRole !== "admin") {
    return <div>No access permission</div>;
  }

  /**
   * Toggles password visibility in the input fields.
   */
  const handlePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  /**
   * Opens the modal for adding a new user.
   */
  const onAddClick = () => {
    setIsAddModalVisible(true);
  };

  /**
   * Closes the add user modal.
   */
  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  /**
   * Handles form submission for adding a new user.
   * @param {IUser} user - The user data from the form.
   */
  const handleAddFormSubmit = async (user: IUser) => {
    try {
      // Hash the user's password
      try {
        const salt = await bcrypt.genSalt(10);
        if (user.userPass !== null) {
          user.userPass = await bcrypt.hash(user.userPass, salt);
        }
      } catch (error) {
        console.error('Error in hashing the password:', error);
        message.error('Error in hashing the password');
        return;
      }
      const userParams = {
        userId: user.userId,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        userName: user.userName,
        userPass: user.userPass,
        userEmail: user.userEmail,
        userRole: user.userRole,
        userMob: user.userMob,
        userAddress: user.userAddress
      };
      await addUserAPI(userParams);
      message.success("User added successfully");

      setIsAddModalVisible(false);
      addform.resetFields();

      // Re-fetch the user list
      getUserList();
    } catch (error: any) {
      if (error instanceof AxiosError) {
        // AxiosError specific handling
        if (error.response) {
          // Server responded with a status other than 2xx
          const errMsg = error.response.data.error || "Add user failed";
          console.error('Server responded with an error:', errMsg);
          console.error('Status code:', error.response.status);
          message.error(errMsg);
        } else if (error.request) {
          // Request was made but no response was received
          console.error('No response received:', error.request);
        } else {
          // Something happened in setting up the request that triggered an error
          console.error('Error in setting up the request:', error.message);
        }
      } else {
        // Handle non-Axios errors
        const errMsg = error.response?.data?.msg || "Add user failed";
        console.error(errMsg);
        message.error(errMsg);
      }
      
    }
  };

  /**
   * Opens the modal for editing an existing user.
   * @param {IUser} user - The user data to edit.
   */
  const onEditClick = (user: IUser) => {
    setEditingUser(user)
    setIsEditModalVisible(true);

    editForm.setFieldsValue({
      userId: user.userId,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      userName: user.userName,
      userEmail: user.userEmail,
      userRole: user.userRole,
      userMob: user.userMob,
      userAddress: user.userAddress,
      userPass: null

    });
  };

  /**
   * Closes the edit user modal.
   */
  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingUser(null);
  };

  /**
   * Handles form submission for editing an existing user.
   * @param {IUser} user - The updated user data from the form.
   */
  const handleEditSubmit = async (user: IUser) => {
    try {
      const salt = await bcrypt.genSalt(10);
      if (user.userPass !== null) {
        user.userPass = await bcrypt.hash(user.userPass, salt);
      }
    } catch (error) {
      console.error('Error in hashing the password:', error);
      message.error('Error in hashing the password');
      return;
    }
    try {
      const userParams = {
        userId: user.userId,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        userName: user.userName,
        userEmail: user.userEmail,
        userRole: user.userRole,
        usermob: user.userMob,
        userAddress: user.userAddress,
        userPass: user.userPass,
      };

      await updateUserAPI(userParams);
      message.success("User updated successfully");

      setIsEditModalVisible(false);
      setEditingUser(null);

      // Re-fetch the user list
      getUserList();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Update user failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  /**
   * Handles user deletion.
   * @param {IUser} user - The user to delete.
   */
  const onDeleteClick = async (user: IUser) => {
    try {
      await deleteUserAPI(user.userId);
      message.success("User deleted successfully");

      // Re-fetch the user list
      getUserList();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Delete user failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  const tabItems = [
    {
      label: "All Users",
      key: "1",
      children: (
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxWidth: '100%' }}>
        <Table
          rowKey="userId"
          columns={columns}
          dataSource={userList}
        />
        </div>
      ),
    },
    {
      label: "Volunteer",
      key: "2",
      children: (
        <Table
          rowKey="userId"
          columns={columns}
          dataSource={volList}
          tableLayout="fixed" // Ensure columns have fixed width
        />
      ),
    },
    {
      label: "Admin",
      key: "4",
      children: (
        <Table
          style={{ marginTop: "20px", borderTop: "1px solid #eee" }}
          rowKey="userId"
          columns={columns}
          dataSource={adminList}
        />
      ),
    },
  ];

  // Custom validator function for integer validation
  const validateInteger = (_: any, value: any) => {
    if (!value || /^\d+$/.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('Please enter a valid integer.'));
  };

  return (
    <div style={{ padding: '24px' }}>
      
      {/* Add button area */}
    <Row style={{ marginBottom: 0, paddingBottom: 0 }}>
      <Col span={8} lg={8} md={6} sm={2}></Col>
      <Col span={8} lg={8} md={10} sm={14}>
          <Title level={2} style={{ margin: 0, color: '#1677FF' }}>User Management</Title>
      </Col>
      <Col span={8}  style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="primary" onClick={onAddClick}>Add</Button>
      </Col>
    </Row>
    <Divider style={{ marginTop: 20, marginBottom: 10 }} />

      {/* Table area */}
      <Tabs defaultActiveKey="1" items={tabItems} />

      {/* Modals */}
      <Space>
        {/* Add a user dialog box */}
        <Modal
          title="Add User"
          open={isAddModalVisible}
          onOk={() => addform.submit()}
          onCancel={handleAddCancel}
        >
          <Form form={addform} layout="vertical" onFinish={handleAddFormSubmit} >
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: "Please input your first name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="middleName" label="Middle Name">
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: "Please input your last name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="userName" label="Username" rules={[{ min:3, required: true, message: "Please input the user name!" }]} initialValue="">
              <Input />
            </Form.Item>
            <Form.Item name="userPass" label="Password"
              rules={[
                { required: true, message: "Please input your new password!" },
                { min: 8, message: "Password must be at least 8 characters." }
              ]}>
              <Input
                type={isPasswordVisible ? "text" : "password"}
                addonAfter={
                  <Button type="text" onClick={handlePasswordVisibility}>
                    {isPasswordVisible ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                  </Button>
                }
              />
            </Form.Item>
            <Form.Item name="userRole" label="Role" rules={[{ required: true, message: "Please select the role!" }]} initialValue="admin">
              <Select defaultValue={"admin"}>
                <Select.Option value={"admin"}>Admin</Select.Option>
                <Select.Option value={"volunteer"}>Volunteer</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="userEmail" label="Email">
              <Input type="email" />
            </Form.Item>
            <Form.Item name="userAddress" label="Address">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item name="userMob" label="Mobile Number" rules={[
                { required: false, message: 'Please enter an integer.' },
                { validator: validateInteger }
              ]}>
              <Input type="" />
            </Form.Item>            
          </Form>
        </Modal>

        {/* Edit a user dialog box */}
        <Modal
          title="Edit User"
          open={isEditModalVisible}
          onOk={() => editForm.submit()}
          onCancel={handleEditCancel}
        >
          <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
            <Form.Item name="userId" label="User ID" rules={[{ required: true, message: "Please input the user ID!" }]}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="userName" label="userName" rules={[{ min: 3, message: "Please input the user name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="firstName" label="First Name" rules={[{ message: "Please input the user name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="middleName" label="Middle Name" rules={[{ message: "Please input the user name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ message: "Please input the user name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="userEmail" label="Email" rules={[{ message: "Please input the email address!" }]}>
              <Input type="email" />
            </Form.Item>
            <Form.Item name="userPass" label="Password"
              rules={[
                { message: "Please input your new password!" },
                { min: 8, message: "Password must be at least 8 characters." }
              ]}>
              <Input
                type={isPasswordVisible ? "text" : "password"}
                addonAfter={
                  <Button type="text" onClick={handlePasswordVisibility}>
                    {isPasswordVisible ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                  </Button>
                }
              />
            </Form.Item>
            <Form.Item name="userRole" label="Role" rules={[{ message: "Please select the role!" }]}>
              <Radio.Group>
                <Radio value="admin">Admin</Radio>
                <Radio value="volunteer">Volunteer</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="userMob" label="Mobile Number" rules={[{ message: "Please input your mobile  number!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="userAddress" label="Address" rules={[{ message: "Please input your address!" }]}>
            <Input.TextArea rows={4} />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  )
}

export default UserManagement;
