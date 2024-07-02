import { useContext, useState } from "react";
import { Card, Descriptions, Modal, Form, Input, Space, Button, message, Select, Divider } from "antd";
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

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
  };

  const onEditClick = (user: IUser) => {
    setEditingUser(user);
    setIsEditModalVisible(true);
    editForm.setFieldsValue({
      userId: user.userId,
      firstName: user.firstName,
      middleName: user.middleName || '',
      lastName: user.lastName,
      userName: user.userName,
      userPass: user.userPass,
      userEmail: user.userEmail || '',
      userRole: user.userRole,
      userMob: user.userMob || '',
      userAddress: user.userAddress || ''
    });
  };

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
        userMob: user.userMob,
        userAddress: user.userAddress
      };

      await updateUserAPI(userParams);
      message.success("User updated successfully");

      setIsEditModalVisible(false);
      setEditingUser(null);

      // re-get user info
      const response = await getUserByIdAPI(userContext.user!.userId);

      // change obj to IUser
      const loginUser: IUser = {
        userId: response.data.user.id,
        firstName: response.data.user.first_name,
        middleName: response.data.user.middle_name || '',
        lastName: response.data.user.last_name,
        userName: response.data.user.username,
        userEmail: response.data.user.userEmail || '', // You need to handle this if email is not provided in the response
        userRole: response.data.user.role,
        userPass: null,
        userAddress: response.data.user.address || '',
        userMob: response.data.user.userMob || ''
      };

      // UserContext
      setUser(loginUser);

    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Update user failed";
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
          <Descriptions.Item label="Name" >{userContext?.user?.userName}</Descriptions.Item>
          <Descriptions.Item label="Email" >{userContext?.user?.userEmail}</Descriptions.Item>
          <Descriptions.Item label="Role" >{userContext?.user?.userRole}</Descriptions.Item>
        </Descriptions>
        <Divider />
        <Space>
          <Button type="primary" onClick={() => onEditClick(userContext?.user!)} data-testid="edit-button">Edit</Button>
          <Button onClick={() => onChangePasswordClick()} data-testid="change-password-button">Change Password</Button>
        </Space>
      </Card>
  
      {/* Edit user modal */}
      <Modal
        title="Edit User"
        open={isEditModalVisible}
        onCancel={handleEditCancel}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item label="User ID" name="id" rules={[{ required: true, message: "Please input the user id!" }]}>
            <Input disabled data-testid="edit-user-id" />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: "Please input the user name!" }]}>
            <Input data-testid="edit-user-name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: "Please input the email!" }]}>
            <Input data-testid="edit-user-email" />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true, message: "Please select the role!" }]}>
            <Input disabled data-testid="edit-user-role" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" data-testid="edit-save-button">Save</Button>
              <Button onClick={handleEditCancel} data-testid="edit-cancel-button">Cancel</Button>
            </Space>
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
