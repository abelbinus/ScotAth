import { useState, useEffect, useContext } from "react";
import { Divider, Input, Col, Row, Button, Space, Table, Modal, Form, message, Popconfirm, Tag, Radio, Select, Tabs } from "antd";
import type { TableColumnsType } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { UserContext } from "../App";
import { IUser } from "../types/User";
import { DEPARTMENTS } from "../types/Departments";
import { getAllUsersAPI, addUserAPI, updateUserAPI, deleteUserAPI } from "../apis/api";
const User = () => {
  // userInfo
  const userContext = useContext(UserContext);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [, setEditingUser] = useState<IUser | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [userList, setUserList] = useState<IUser[]>([]);
  const [staffList, setStaffList] = useState<IUser[]>([]);
  const [studentList, setStudentList] = useState<IUser[]>([]);
  const [adminList, setAdminList] = useState<IUser[]>([]);
  const [addform] = Form.useForm();
  const [editForm] = Form.useForm();

  // department list
  const departmentOptions = DEPARTMENTS.map(dept => ({
    label: dept,
    value: dept,
  }));

  // admin
  if (userContext?.user?.role !== "admin") {
    // return <Navigate to="/" replace />;
    return <div>No access permission</div>;
  }

  // useEffect(() => {
  //   getUserList();
  // }, [])

  const columns: TableColumnsType<IUser> = [
    { title: "User ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Department", dataIndex: "department", key: "department" },
    {
      title: "Role", dataIndex: "role", key: "role",
      render: (_, { role }) => (
        <>
          {role === "staff" ? (
            <Tag color="green">staff</Tag>
          ) : role === "student" ? (
            <Tag color="blue">student</Tag>
          ) : role === "admin" ? (
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
      // const response: any = await getAllUsersAPI();
      // const projectsBackend: any[] = response.data.obj;

      // let users = projectsBackend.map((i): IUser => {
      //   return {
      //     id: i.id,
      //     name: i.name,
      //     email: i.email,
      //     department: i.department,
      //     role: i.type,
      //     password: null,
      //   }
      // });

      let users: IUser[] = [
        {
          id: 1,
          name: 'Michael Greer',
          email: 'test.user@example.com',
          role: 'admin',
          department: null,
          password: '12345678',
        },
        {
          id: 2,
          name: 'Michael Greer',
          email: 'test.user@example.com',
          role: 'staff',
          department: null,
          password: '12345678',

        }
        // Add more mock users if needed
      ];

      const stafflist = users.filter(i => i.role === "staff");
      const adminList = users.filter(i => i.role === "admin");

      setUserList(users);
      setStaffList(stafflist);
      setAdminList(adminList);

    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Loading list failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

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
        id: user.id,
        name: user.name,
        password: user.password,
        email: user.email,
        type: user.role,
        department: user.department,
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
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      password: null,
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
        id: user.id,
        name: user.name,
        password: user.password,
        email: user.email,
        type: user.role,
        department: user.department,
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
      await deleteUserAPI(user.id);
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
          rowKey="id"
          columns={columns}
          dataSource={userList}
        />
      ),
    },
    {
      label: "Staff",
      key: "2",
      children: (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={staffList}
        />
      ),
    },
    {
      label: "Student",
      key: "3",
      children: (
        <Table
          style={{ marginTop: "20px", borderTop: "1px solid #eee" }}
          rowKey="id"
          columns={columns}
          dataSource={studentList}
        />
      ),
    },
    {
      label: "Admin",
      key: "4",
      children: (
        <Table
          style={{ marginTop: "20px", borderTop: "1px solid #eee" }}
          rowKey="id"
          columns={columns}
          dataSource={adminList}
        />
      ),
    },
  ];

  return (
    <div>
      <p style={{ fontWeight: "bold" }}>User Management</p>
      <Divider />

      {/*Add button area */}
      <Row>
        <Col span={8}></Col>
        <Col span={8}></Col>
        <Col span={8} style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" onClick={onAddClick}>Add</Button>
        </Col>
      </Row>

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
            <Form.Item name="id" label="User ID" rules={[{ required: true, message: "Please input the user id!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input the user name!" }]}>
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
            <Form.Item name="email" label="Email" rules={[{ required: true, message: "Please input the email!" }]}>
              <Input type="email" />
            </Form.Item>
            <Form.Item name="department" label="Department" rules={[{ required: true, message: "Please input the project department!" }]}>
              <Select
                placeholder="Select a department"
                options={departmentOptions}
              />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true, message: "Please select the role!" }]}>
              <Radio.Group>
                <Radio value="student">Student</Radio>
                <Radio value="staff">Staff</Radio>
              </Radio.Group>
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
            <Form.Item name="id" label="User ID" rules={[{ required: true, message: "Please input the user ID!" }]}>
              <Input disabled />
            </Form.Item>
            <Form.Item name="name" label="Name" rules={[{ message: "Please input the user name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="password"
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
                addonAfter={
                  <Button type="text" onClick={handlePasswordVisibility}>
                    {isPasswordVisible ? <EyeInvisibleOutlined /> : <EyeTwoTone />}
                  </Button>
                }
              />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ message: "Please input the email address!" }]}>
              <Input type="email" />
            </Form.Item>
            <Form.Item name="department" label="Department" rules={[{ message: "Please input the project department!" }]}>
              <Select
                placeholder="Select a department"
                options={departmentOptions}
              />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ message: "Please select the role!" }]}>
              <Radio.Group disabled>
                <Radio value="student">Student</Radio>
                <Radio value="staff">Staff</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  )
}

export default User
