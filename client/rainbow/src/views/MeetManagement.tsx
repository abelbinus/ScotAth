import { useState, useEffect, useContext } from "react";
import { Divider, Input, Col, Row, Space, Table, Button, Form, Modal, Select, Popconfirm, message, Tabs, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { UserContext } from "../App.tsx";
import { IMeet } from "../modals/Meet";
import { getMeetsAPI, deleteMeetAPI, updateMeetAPI, addMeetAPI, getEventFiles } from "../apis/api.ts";
import './../styles/CustomCSS.css'

/**
 * Interface representing the values of the edit form.
 */
interface EditFormValues {
    meetId: number;
    meetName: string;
    meetDesc: string;
    pfFolder: string;
    pfOutput: string;
    eventList: string;
    intFolder: string;
    edit: boolean;
}

/**
 * The MeetListAdmin component is responsible for managing athletic meets.
 * It allows administrators to view, add, edit, update, and delete meets through a user-friendly interface.
 * 
 * @component
 */
const MeetListAdmin = () => {
  // State variables to manage meet list, editing state, selected folder, and modal visibility
  const [meetList, setMeetList] = useState<IMeet[]>([]);
  const [editingMeet, setEditingMeet] = useState<IMeet | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('');
  
  // State for managing add meet modal visibility and form
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addform] = Form.useForm();
  
  // State for managing edit meet modal visibility and form
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  // State for managing file list and modal visibility for file updates
  const [fileList, setFileList] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { Title } = Typography;

  // User information from context
  const userContext = useContext(UserContext);

  /**
   * Opens the modal for adding a new meet.
   */
  const onAddClick = () => {
    setIsAddModalVisible(true);
  };

  /**
   * Closes the modal for adding a new meet.
   */
  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  /**
   * Handles form submission for adding a new meet.
   * Sends the new meet data to the API and refreshes the meet list.
   * 
   * @async
   * @param {IMeet} meet - The meet data to be added.
   */
  const handleAddFormSubmit = async (meet: IMeet) => {
    try {
      const meetParams = {
        meetId: meet.meetId,
        meetName: meet.meetName,
        meetDesc: meet.meetDesc ?? '', // If description can be null, provide a default value
        pfFolder: meet.pfFolder,
        pfOutput: meet.pfOutput,
        eventList: meet.eventList,
        intFolder: meet.intFolder,
        edit: meet.edit ?? false,
      };

      await addMeetAPI(meetParams);
      message.success("Meet added successfully");

      setIsAddModalVisible(false);
      addform.resetFields();
      getMeetList();
    } catch (error: any) {
      const errMsg = error.response?.data?.error || "Failed to add new meet";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  /**
   * Fetches the list of meets from the API and updates the state.
   * 
   * @async
   */
  const getMeetList = async () => {
    try {
      const response: any = await getMeetsAPI();
      const meetList: IMeet[] = response.data.meet; // Assuming response.data contains the array

      let meets = meetList.map((i): IMeet => {
        return {
          meetId: i.meetId,
          meetName: i.meetName,
          meetDesc: i.meetDesc ?? '', // If description can be null, provide a default value
          pfFolder: i.pfFolder,
          pfOutput: i.pfOutput,
          eventList: i.eventList,
          intFolder: i.intFolder,
          edit: i.edit ?? false,
        };
      });

      setMeetList(meets);

      const allMeets = meets;
      setMeetList(allMeets);
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Loading list failed";
      console.log(errMsg);
      message.error(errMsg);
    }
  };

  // Fetch the meet list when the component is mounted
  useEffect(() => {
    getMeetList();
  }, [userContext]);

  /**
   * Handles the update of event files based on the provided folder paths and meet ID.
   * 
   * @async
   * @param {string} pfFolder - Path to the photo finish folder.
   * @param {string} intFolder - Path to the interface folder.
   * @param {string} eventList - Type of event list.
   * @param {number} meetId - The ID of the meet to be updated.
   */
  const handleUpdateClick = async (pfFolder: string, intFolder: string, eventList: string, meetId: number) => {
    try {
        if (pfFolder == null || pfFolder == "") {
          const errMsg = "pfFolder path is required";
          console.log(errMsg);
          message.error(errMsg);
        } else if (eventList == null || eventList == "") {
          const errMsg = "eventList type is required";
          console.log(errMsg);
          message.error(errMsg);
        } else if (meetId == null) {
          const errMsg = "MeetID is required";
          console.log(errMsg);
          message.error(errMsg);
        } else {
          const folderParams = {
              pfFolder: pfFolder,
              eventList: eventList,
              intFolder: intFolder,
              meetId: meetId
          };
          const response = await getEventFiles(folderParams);
          if (response.data.status === 'failure') {
            if (response.data.error) {
                try {
                  if (response.data.error.copyError) {
                    const errMsg = response.data.error.copyError || "Failed to copy startlist from interface folder";
                    console.error(errMsg);
                    message.error(errMsg);
                  }
                } catch (error: any) {}
                try {
                  if (response.data.error.dbError) {
                    const errMsg = response.data.error.dbError || "Failed to update database";
                    console.error(errMsg);
                    message.error(errMsg);
                  }
                } catch (error: any) {}
                const errMsg = response.data.error.message || "Failed to update start list";
                console.error(errMsg);
                message.error(errMsg);
            }
          } else {
              try {
                if (response.data.error.copyError) {
                  const errMsg = response.data.error.copyError || "Failed to copy startlist from interface folder";
                  console.error(errMsg);
                  message.error(errMsg);
                }
              } catch (error: any) {}
              message.success(response.data.message || "Updated Start List Successfully");
              setFileList(response.data.files);
              setIsModalVisible(true);
          }
        }
      } catch (error: any) {
        const errMsg = error.response?.data?.error || "Failed to fetch files";
        console.error(error);
        message.error(errMsg);
      }
  };

  /**
   * Closes the modal for displaying file updates.
   */
  const handleCancel = () => {
    setIsModalVisible(false);
    setFileList([]);
  };

  // Column definitions for the meet table
  const baseColumns: ColumnsType<IMeet> = [
    {
      title: "Meet Date (yyyymmdd)",
      dataIndex: "meetId",
      key: "meetId",
      width: 150,
    },
    {
      title: "Meet Name",
      dataIndex: "meetName",
      key: "meetName",
      width: 150,
    },
    {
        title: "Description",
        dataIndex: "meetDesc",
        key: "meetDesc",
        render: text => <span>{text.length > 300 ? `${text.substring(0, 300)}...` : text}</span>,
        width: 250,
        
    },
    {
      title: "EventList",
      dataIndex: "eventList",
      key: "eventList",
      width: 150,
    },
    {
      title: "PFFolder",
      dataIndex: "pfFolder",
      key: "pfFolder",
      width: 200,
    },
    {
      title: "PFOutput",
      key: "pfOutput",
      dataIndex: "pfOutput",
      width: 100,
    },
    {
        title: "Interface Folder",
        key: "intFolder",
        dataIndex: "intFolder",
        width: 200,
    },
    {
        title: "Edit",
        key: "edit",
        dataIndex: "edit",
        render: (text, record) => (
            <span>
                {record.edit ? "Yes" : "No"}
            </span>
        ),
        width: 100,
    }
  ];

  // Column definitions with additional action buttons for admin use
  const meetColumns: ColumnsType<IMeet> = [
    ...baseColumns,
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      render: (_, record) => (
        <Space size="middle" direction="vertical" className="action-buttons">
          <Button type="primary" className="action-button" onClick={() => handleUpdateClick(record.pfFolder, record.intFolder, record.eventList, record.meetId)}>
            Update Events
          </Button>
          <Button className="action-button" onClick={() => onEditClick(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure to delete this meet?"
            onConfirm={() => onDeleteClick(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger className="action-button">Delete</Button>
          </Popconfirm>
        </Space>
      ),
      width: 180,
    },
  ];

  // Tab items for displaying the meet table
  const tabItems = [
    {
      label: "All Meets",
      key: "2",
      children: (
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxWidth: '100%' }}>
          <Table
            rowKey={record => `${record.meetId}`}
            columns={meetColumns}
            dataSource={meetList}
            tableLayout="fixed" // Ensure columns have fixed width
          />
        </div>
      ),
    },
  ];

  /**
   * Handles the tab change event.
   * 
   * @param {any} key - The key of the selected tab.
   */
  const onTabChange = (key: any) => {
    // Handle tab change if needed
  };

  /**
   * Handles the click event for editing a meet.
   * Opens the modal for editing and populates the form with the selected meet's details.
   * 
   * @param {IMeet} meet - The meet data to be edited.
   */
  const onEditClick = (meet: IMeet) => {
    // Display existing info in the form
    setEditingMeet(meet);
    setIsEditModalVisible(true);

    editForm.setFieldsValue({
      meetId: meet.meetId,
      meetName: meet.meetName,
      pfFolder: meet.pfFolder,
      pfOutput: meet.pfOutput,
      meetDesc: meet.meetDesc,
      intFolder: meet.intFolder,
      edit: meet.edit ? "Yes" : "No",
      eventList: meet.eventList
    });
    setSelectedFolder(meet.pfFolder);
  };

  /**
   * Handles form submission for editing a meet.
   * Sends the updated meet data to the API and refreshes the meet list.
   * 
   * @async
   * @param {EditFormValues} meet - The updated meet data.
   */
  const handleEditSubmit = async (meet: EditFormValues) => {
    try {
      const meetParams = {
        meetId: meet.meetId,
        meetName: meet.meetName,
        pfFolder: meet.pfFolder,
        pfOutput: meet.pfOutput,
        meetDesc: meet.meetDesc,
        intFolder: meet.intFolder,
        edit: meet.edit,
        eventList: meet.eventList
      };

      await updateMeetAPI(meetParams);
      message.success("Meet updated successfully");

      setIsEditModalVisible(false);
      setEditingMeet(null);

      // Re-fetch the meet list
      getMeetList();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Update meet failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  /**
   * Closes the modal for editing a meet.
   */
  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingMeet(null);
  };

  /**
   * Handles the click event for deleting a meet.
   * Sends the delete request to the API and refreshes the meet list.
   * 
   * @async
   * @param {IMeet} meet - The meet data to be deleted.
   */
  const onDeleteClick = async (meet: IMeet) => {
    try {
      await deleteMeetAPI(meet.meetId);
      message.success("Meet deleted successfully");

      // Re-fetch the meet list
      getMeetList();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Delete meet failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  return (
    <div style={{padding: "24px"}}>

      {/* Add button area */}
      <Row style={{ marginBottom: 0, paddingBottom: 0 }}>
        <Col span={8} lg={8} md={6} sm={2}></Col>
        <Col span={8} lg={8} md={10} sm={14}>
            <Title level={2} style={{ margin: 0, color: '#1677FF' }}>Meet Management</Title>
        </Col>
        <Col span={8}  style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" onClick={onAddClick}>Add</Button>
        </Col>
      </Row>
      <Divider style={{ marginTop: 20, marginBottom: 10 }} />

      {/* Table area */}
      <Tabs defaultActiveKey="1" onChange={onTabChange} items={tabItems} />

      {/* Add a meet dialog box */}
      <Modal
          title="Add Meet"
          open={isAddModalVisible}
          onOk={() => addform.submit()}
          onCancel={handleAddCancel}
        >
          <Form form={addform} layout="vertical" onFinish={handleAddFormSubmit}>
            <Form.Item name="meetId" label="Meet Date (yyyymmdd)" rules={[{ required: true, message: "Id is required" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="meetName" label="Meet name" rules={[{ required: true, message: "Please input the meet name!" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="meetDesc" label="Description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="PFFolder">
              <Input.Group compact>
                <Form.Item
                  name="pfFolder"
                  noStyle
                >
                  <Input style={{ width: 'calc(100% - 24px)' }} value={selectedFolder}  />
                </Form.Item>
                <label htmlFor="folderInput">
                  {/* <Button onClick={handleFolderSelect}>Select Folder</Button> */}
                </label>
              </Input.Group>
            </Form.Item>
            <Form.Item name="pfOutput" label="PF Output">
              <Select defaultValue={'lif'}>
                <Select.Option value="lif">LIF</Select.Option>
                <Select.Option value="cl">CL</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Interface Folder">
              <Input.Group compact>
                <Form.Item
                  name="intFolder"
                  noStyle
                >
                  <Input style={{ width: 'calc(100% - 24px)' }} value={selectedFolder}  />
                </Form.Item>
                <label htmlFor="folderInput">
                  {/* <Button onClick={handleFolderSelect}>Select Folder</Button> */}
                </label>
              </Input.Group>
            </Form.Item>
            <Form.Item name="eventList" label="Event List">
              <Select defaultValue={"FL"}>
                <Select.Option value="FL">FL</Select.Option>
                <Select.Option value="OMEGA">OMEGA</Select.Option>
                <Select.Option value="HYTEK OMEGA">HYTEK OMEGA</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="edit" label="Edit">
              <Select defaultValue={true}>
                <Select.Option value={true}>Yes</Select.Option>
                <Select.Option value={false}>No</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

      {/* Edit a meet dialog box */}
      <Modal
        title="Edit Meet"
        open={isEditModalVisible}
        onOk={() => editForm.submit()}
        onCancel={handleEditCancel}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="meetId" label="Meet Date (yyyymmdd)" rules={[{ required: true, message: "Id is required" }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="meetName" label="Meet name" rules={[{ required: true, message: "Please input the meet name!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="meetDesc" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="PFFolder">
            <Input.Group compact>
              <Form.Item
                name="pfFolder"
                noStyle
              >
                <Input style={{ width: 'calc(100% - 24px)' }} value={selectedFolder}  />
              </Form.Item>
              <label htmlFor="folderInput">
                {/* <Button onClick={handleFolderSelect}>Select Folder</Button> */}
              </label>
            </Input.Group>
          </Form.Item>
          <Form.Item name="pfOutput" label="PF Output">
            <Select defaultValue={editingMeet?.pfOutput || 'lif'}>
              <Select.Option value="lif">LIF</Select.Option>
              <Select.Option value="cl">CL</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Interface Folder">
            <Input.Group compact>
              <Form.Item
                name="intFolder"
                noStyle
              >
                <Input style={{ width: 'calc(100% - 24px)' }} value={selectedFolder}  />
              </Form.Item>
              <label htmlFor="folderInput">
                {/* <Button onClick={handleFolderSelect}>Select Folder</Button> */}
              </label>
            </Input.Group>
          </Form.Item>
          <Form.Item name="eventList" label="Event List">
            <Select defaultValue={editingMeet?.eventList || 'FL'}>
              <Select.Option value="FL">FL</Select.Option>
              <Select.Option value="OMEGA">OMEGA</Select.Option>
              <Select.Option value="HYTEK OMEGA">HYTEK OMEGA</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="edit" label="Edit" initialValue={editingMeet?.edit ? "true" : "false"}>
            <Select defaultValue={editingMeet?.edit || false}>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MeetListAdmin;
