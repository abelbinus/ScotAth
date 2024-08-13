import { useContext, useState } from "react";
import { Card, Descriptions, Modal, Form, Input, Space, Button, message, Select, Divider, Radio } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { UserContext } from "../App";
import { IUser } from "../modals/User";
import { changePasswordAPI, updateUserAPI, getUserByIdAPI } from "../apis/api";
import bcrypt from 'bcryptjs-react';

interface PasswordChange {
  oldPassword: string,
  newPassword: string,
  retypeNewPassword: string,
}

const ProfilePage = () => {
  const userContext = useContext(UserContext);
  const { setUser } = useContext(UserContext);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [, setEditingUser] = useState<IUser | null>(null);
  const [editForm] = Form.useForm();
  const [changePasswordForm] = Form.useForm();
  const [isPasswordVisibleOld, setIsPasswordVisibleOld] = useState(false);
  const [isPasswordVisibleNew, setIsPasswordVisibleNew] = useState(false);
  const [isPasswordVisibleRetype, setIsPasswordVisibleRetype] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);

  /**
   * @function onEditClick
   * @description Handles the action to open the edit modal with user data.
   * @param {IUser} user - The user object to edit.
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
   * @function handleEditCancel
   * @description Handles cancel action for the edit modal.
   */
  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingUser(null);
  };

  /**
   * @function handleEditSubmit
   * @description Handles the submit action for updating user data.
   * @param {IUser} user - The user object with updated data.
   */
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

  /**
   * @function handlePasswordChange
   * @description Handles the action for changing user password.
   * @param {PasswordChange} values - The form values containing the old password, new password, and retype new password.
   */
  const handlePasswordChange = async (values: PasswordChange) => {
    if (userContext!.user!.userPass !== null) {
      console.log(userContext.user?.userPass);
      //const value = values.oldPassword === userContext!.user!.userPass;
      const value = await bcrypt.compare(values.oldPassword, userContext!.user!.userPass);
      if (!value) {
        return message.error("Old password is incorrect");
      }
    }

    if (values.newPassword !== values.retypeNewPassword) {
      return message.error("New password and retype new password do not match");
    }
    if(values.oldPassword === values.newPassword) {
      return message.error("New password must be different from the old password");
    }
    try {
      const salt = await bcrypt.genSalt(10);
      if (values.newPassword !== null) {
        values.newPassword = await bcrypt.hash(values.newPassword, salt);
      }
    } catch (error) {
      console.error('Error in hashing the password:', error);
      message.error('Error in hashing the password');
      return;
    }

    try {
      const password = {
        oldPass: userContext!.user!.userPass,
        newPass: values.newPassword,
        userId: userContext!.user!.userId
      }
      const response = await changePasswordAPI(password); 
      const responseMessage = response?.data?.message;
      if (responseMessage) {
          message.success(responseMessage);
          const updatedUser = {
            ...userContext!.user!, // Spread existing user data
            userPass: values.newPassword, // Update password
          };
          setUser(updatedUser);
          setIsChangePasswordModalVisible(false);
      } else {
          message.error(response.data.error || 'Failed to change password');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || "Failed to change password";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  /**
   * @function handleChangePasswordModalCancel
   * @description Handles cancel action for the change password modal.
   */
  const handleChangePasswordModalCancel = () => {
    setIsChangePasswordModalVisible(false);
  };

  /**
   * @function onChangePasswordClick
   * @description Opens the change password modal and clears the form fields.
   */
  const onChangePasswordClick = () => {
    setIsChangePasswordModalVisible(true);
    changePasswordForm.setFieldsValue({
      oldPassword: null,
      newPassword: null,
      retypeNewPassword: null
    });
  };

  /**
   * @function handlePasswordVisibility
   * @description Toggles the visibility of the password field.
   */
  const handlePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  /**
   * @function handlePasswordVisibilityOld
   * @description Toggles the visibility of the old password field.
   */
  const handlePasswordVisibilityOld = () => {
    setIsPasswordVisibleOld(!isPasswordVisibleOld);
  };

  /**
   * @function handlePasswordVisibilityNew
   * @description Toggles the visibility of the new password field.
   */
  const handlePasswordVisibilityNew = () => {
    setIsPasswordVisibleNew(!isPasswordVisibleNew);
  };

  /**
   * @function handlePasswordVisibilityRetype
   * @description Toggles the visibility of the retype new password field.
   */
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
            <Form.Item name="userName" label="userName" rules={[{ min:3, message: "Please input the user name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="firstName" label="First Name" rules={[{ message: "Please input your first name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="middleName" label="Middle Name" rules={[{ message: "Please input your middle name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ message: "Please input your last name!" }]}>
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
