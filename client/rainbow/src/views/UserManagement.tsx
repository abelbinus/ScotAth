import { useState, useEffect, useContext } from "react";
import { Divider, Input, Col, Row, Button, Space, Table, Modal, Form, message, Popconfirm, Tag, Radio, Select, Tabs, Grid} from "antd";
import type { TableColumnsType } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { UserContext } from "../App";
import { IUser } from "../types/User";
import { getAllUsersAPI, addUserAPI, updateUserAPI, deleteUserAPI } from "../apis/api";
const User = () => {
  // userInfo
  const userContext = useContext(UserContext);
  const { useBreakpoint } = Grid; // Ant Design hook for screen size detection
  const screens = useBreakpoint();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [, setEditingUser] = useState<IUser | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [userList, setUserList] = useState<IUser[]>([]);
  const [volList, setVolList] = useState<IUser[]>([]);
  const [adminList, setAdminList] = useState<IUser[]>([]);
  const [addform] = Form.useForm();
  const [editForm] = Form.useForm();

  const columns: TableColumnsType<IUser> = [
    { title: "User ID", dataIndex: "userId", key: "userId" },
    { title: "Name", dataIndex: "userName", key: "userName" },
    ...(screens.xs ? [] : [
      { title: "Email", dataIndex: "userEmail", key: "userEmail" },
    ]),
    {
      title: "Role", dataIndex: "userRole", key: "userRole",
      render: (_, { userRole }) => (
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
          <a onClick={() => onEditClick(record)}>Edit</a>
          <Popconfirm
            title="Delete the user"
            description="Are you sure to delete this user?"
            onConfirm={() => onDeleteClick(record)}
            okText="Yes"
            cancelText="No"
          >
            <a>Delete</a>
          </Popconfirm>
        </Space>,
    },
  ];

  // get
  const getUserList = async () => {
    try {
      const response: any = await getAllUsersAPI();
      const userList: any[] = response.data;
      console.log(userList);

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

  useEffect(() => {
    getUserList();
  }, [])

  // admin
  if (userContext?.user?.userRole !== "admin") {
    // return <Navigate to="/" replace />;
    return <div>No access permission</div>;
  }
  const handlePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // add
  const onAddClick = () => {
    setIsAddModalVisible(true);
  };

  // add
  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  // add
  const handleAddFormSubmit = async (user: IUser) => {
    try {
      const userParams = {
        userId: user.userId,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        userName: user.userName,
        userPass: null,
        userEmail: user.userEmail,
        userRole: user.userRole,
        userMob: user.userMob,
        userAddress: user.userAddress
      };

      await addUserAPI(userParams);
      message.success("User added successfully");

      setIsAddModalVisible(false);
      addform.resetFields();

      // re-get User list
      //getUserList();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Add user failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  // edit
  const onEditClick = (user: IUser) => {
    setEditingUser(user)
    setIsEditModalVisible(true);

    editForm.setFieldsValue({
      userId: user.userId,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      userName: user.userName,
      userPass: null,
      userEmail: user.userEmail,
      userRole: user.userRole,
      userMob: user.userMob,
      userAddress: user.userAddress

    });
  };

  // edit
  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingUser(null);
  };

  // edit
  const handleEditSubmit = async (user: IUser) => {
    try {
      const userParams = {
        userId: user.userId,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        userName: user.userName,
        userPass: user.userPass,
        userEmail: user.userEmail,
        userRole: user.userRole,
        usermob: user.userMob
      };

      await updateUserAPI(userParams);
      message.success("User updated successfully");

      setIsEditModalVisible(false);
      setEditingUser(null);

      // re-get user list
      getUserList();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Update user failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  // delete
  const onDeleteClick = async (user: IUser) => {
    try {
      await deleteUserAPI(user.userId);
      message.success("User deleted successfully");

      // re-get user list
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
        <Table
          rowKey="userId"
          columns={columns}
          dataSource={userList}
        />
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
  const validateInteger = (_, value: any) => {
    if (!value || /^\d+$/.test(value)) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('Please enter a valid integer.'));
  };

  return (
    <div>
      
      

      {/*Add button area */}
      <Row>
        <Col span={8}>
          <p style={{ fontWeight: "bold" }}>User Management</p>        
        </Col>
        <Col span={8}></Col>
        <Col span={8} style={{ display: "flex", marginTop: "10px", justifyContent: "flex-end" }}>
          <Button type="primary" onClick={onAddClick}>Add</Button>
        </Col>
      </Row>
      <Divider />

      {/*Table area */}
      <Tabs defaultActiveKey="1" items={tabItems} />

      {/*Modals */}
      <Space>
        {/*Add a user dialog box*/}
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
            <Form.Item name="userName" label="Username" rules={[{ required: true, message: "Please input the user name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="password" label="Password"
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
            <Form.Item name="userRole" label="Role" rules={[{ required: true, message: "Please select the role!" }]}>
              <Select defaultValue={'admin'}>
                <Select.Option value={'admin'}>Admin</Select.Option>
                <Select.Option value={'volunteer'}>Volunteer</Select.Option>
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

        {/*Edit a user dialog box*/}
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
            <Form.Item name="userName" label="Name" rules={[{ message: "Please input the user name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="userPass"
              label="New Password"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value.length >= 8) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Password must be at least 8 characters."));
                  },
                }),
              ]}
            >
              <Input.Password
                type={isPasswordVisible ? "text" : "password"}
              />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ message: "Please input the email address!" }]}>
              <Input type="email" />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ message: "Please select the role!" }]}>
              <Radio.Group disabled>
                <Radio value="admin">Admin</Radio>
                <Radio value="volunteer">Volunteer</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  )
}

export default User
