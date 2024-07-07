import { useContext, useState } from "react";
import { Card, Descriptions, Modal, Form, Input, Space, Button, message, Select, Divider, Radio } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { UserContext } from "../App";
import { IUser } from "../modals/User";
import { changePasswordAPI, updateUserAPI, getUserByIdAPI } from "../apis/api";

interface PasswordChange {
  oldPassword: string,
  newPassword: string,
  retypeNewPassword: string,
}

const ProfilePage = () => {
  const userContext = useContext(UserContext);
  const { setUser } = useContext(UserContext);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // edit info
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [, setEditingUser] = useState<IUser | null>(null);
  const [editForm] = Form.useForm();
  // password
  const [changePasswordForm] = Form.useForm();
  const [isPasswordVisibleOld, setIsPasswordVisibleOld] = useState(false);
  const [isPasswordVisibleNew, setIsPasswordVisibleNew] = useState(false);
  const [isPasswordVisibleRetype, setIsPasswordVisibleRetype] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);

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
        userEmail: user.userEmail,
        userRole: user.userRole,
        usermob: user.userMob

      };

      await updateUserAPI(userParams);
      message.success("User updated successfully");

      setIsEditModalVisible(false);
      setEditingUser(null);

    } catch (error: any) {
      const errMsg = error.response?.data?.error || "Update user failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  const handlePasswordChange = async (values: PasswordChange) => {
    // Check if the old password and the new password are the same
    if (values.oldPassword === values.newPassword) {
      return message.error("New password must be different from the old password");
    }

    // Add validation for new password and retype new password
    if (values.newPassword !== values.retypeNewPassword) {
      return message.error("New password and retype new password do not match");
    }

    try {
      const response = await changePasswordAPI(values.oldPassword, values.newPassword, userContext!.user!.userId); // Call the changePasswordAPI function
      const responseMessage = response?.data?.msg;
      if (response.data.suc) {
          message.success(responseMessage);
          // Close the modal
          setIsChangePasswordModalVisible(false);
      } else {
          message.error(response.data.msg || 'Failed to change password');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Failed to change password";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  // change password
  const handleChangePasswordModalCancel = () => {
    setIsChangePasswordModalVisible(false);
  };

  // change password 
  const onChangePasswordClick = () => {
    setIsChangePasswordModalVisible(true);
    // Clear password fields
    changePasswordForm.setFieldsValue({
      oldPassword: null,
      newPassword: null,
      retypeNewPassword: null
    });
  };

  const handlePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handlePasswordVisibilityOld = () => {
    setIsPasswordVisibleOld(!isPasswordVisibleOld);
  };
  const handlePasswordVisibilityNew = () => {
    setIsPasswordVisibleNew(!isPasswordVisibleNew);
  };
  const handlePasswordVisibilityRetype = () => {
    setIsPasswordVisibleRetype(!isPasswordVisibleRetype);
  };

  return (
    <div style={{ padding: 24 }} data-testid="profile-container">
      <Card title="My Profile" bordered={false} data-testid="profile-card">
        <Descriptions layout="vertical" column={1} colon={false}>
          <Descriptions.Item label="User ID">{userContext?.user?.userId}</Descriptions.Item>
          <Descriptions.Item label="Username">{userContext?.user?.userName}</Descriptions.Item>
          {/* Conditional rendering based on middleName */}
          {userContext?.user?.firstName && (
            <Descriptions.Item label="Name">
              {userContext?.user?.firstName}
              {userContext?.user?.middleName && ' ' + userContext?.user?.middleName}
              {userContext?.user?.lastName && ' ' + userContext?.user?.lastName}
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="Email" >{userContext?.user?.userEmail}</Descriptions.Item>
          <Descriptions.Item label="Role" >{userContext?.user?.userRole}</Descriptions.Item>
          <Descriptions.Item label="Mobile" >{userContext?.user?.userMob}</Descriptions.Item>
          <Descriptions.Item label="Address" >{userContext?.user?.userAddress}</Descriptions.Item>
        </Descriptions>
        <Divider />
        <Space>
          <Button type="primary" onClick={() => onEditClick(userContext?.user!)} data-testid="edit-button">Edit</Button>
          <Button onClick={() => onChangePasswordClick()} data-testid="change-password-button">Change Password</Button>
        </Space>
      </Card>
  
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
            <Form.Item name="userName" label="userName" rules={[{ message: "Please input the user name!" }]}>
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
            <Form.Item name="userRole" label="Role" rules={[{ message: "Please select the role!" }]}>
              <Radio.Group disabled>
                <Radio value="admin">Admin</Radio>
                <Radio value="volunteer">Volunteer</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Modal>
  
      {/* Change password modal */}
      <Modal
        title="Change Password"
        open={isChangePasswordModalVisible}
        onCancel={handleChangePasswordModalCancel}
        data-testid="change-password-modal"
        footer={null}
      >
        <Form form={changePasswordForm} layout="vertical" onFinish={handlePasswordChange}>
          <Form.Item name="oldPassword" label="Old Password" rules={[{ required: true, message: "Please input your old password!" }]}>
            <Input
              type={isPasswordVisibleOld ? "text" : "password"}
              addonAfter={<Button type="text" onClick={handlePasswordVisibilityOld}>{isPasswordVisibleOld ? <EyeInvisibleOutlined /> : <EyeTwoTone />}</Button>}
              data-testid="old-password-input"
            />
          </Form.Item>
          <Form.Item name="newPassword" label="New Password" rules={[
            { required: true, message: "Please input your new password!" },
            { min: 8, message: "Password must be at least 8 characters." }
          ]}>
            <Input
              type={isPasswordVisibleNew ? "text" : "password"}
              addonAfter={<Button type="text" onClick={handlePasswordVisibilityNew}>{isPasswordVisibleNew ? <EyeInvisibleOutlined /> : <EyeTwoTone />}</Button>}
              data-testid="new-password-input"
            />
          </Form.Item>
          <Form.Item name="retypeNewPassword" label="Retype New Password" rules={[{ required: true, message: "Please retype your new password!" }]}>
            <Input
              type={isPasswordVisibleRetype ? "text" : "password"}
              addonAfter={<Button type="text" onClick={handlePasswordVisibilityRetype}>{isPasswordVisibleRetype ? <EyeInvisibleOutlined /> : <EyeTwoTone />}</Button>}
              data-testid="retype-new-password-input"
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ float: 'right' }}>
              <Button onClick={handleChangePasswordModalCancel} data-testid="password-cancel-button">Cancel</Button>
              <Button type="primary" onClick={() => changePasswordForm.submit()} data-testid="password-ok-button">Ok</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
  
};

export default ProfilePage;
