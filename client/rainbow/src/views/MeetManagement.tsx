import { useState, useEffect, useContext } from "react";
import { Divider, Input, Col, Row, Space, Tag, Table, Button, Form, Modal, Select, Popconfirm, message, Tabs } from "antd";
import { ColumnsType } from "antd/es/table";
import { UserContext } from "../App.tsx";
import { IMeet } from "../types/Meet";
import { getMeetsAPI, deleteMeetAPI, updateMeetAPI, addMeetAPI, getEventFiles } from "../apis/api.ts";
import './../css/MeetManagement.css'

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

const MeetListAdmin = () => {
  //const folderInput= React.useRef(null);
  const [meetList, setMeetList] = useState<IMeet[]>([]);
  const [editingMeet, setEditingMeet] = useState<IMeet | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('');
  
  //add Meet
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addform] = Form.useForm();
  
  // edit Meet
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  const [fileList, setFileList] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // userInfo
  const userContext = useContext(UserContext);
 

  // Function to handle folder selection
  // const handleFolderSelect = async () => {
  //   try {
  //     const dirHandle = await window.showDirectoryPicker();
    
  //     // Access the directory handle properties or perform operations
  //     console.log("Selected directory:", dirHandle);
      
  //     // Example: List directory contents
  //     for await (const entry of dirHandle.values()) {
  //       console.log(entry.name, entry.kind);
  //     }

  //     // Example: Set selected folder path to state or form field
  //     setSelectedFolder(dirHandle.name);
  //     editForm.setFieldsValue({ pfFolder: dirHandle.name });
  //   } catch (error) {
  //     console.error("Error selecting directory:", error);
  //     // Handle error as needed
  //   }
  // };

  // add
  const onAddClick = () => {
    setIsAddModalVisible(true);
  };

  // add
  const handleAddCancel = () => {
    setIsAddModalVisible(false);
  };

  // add
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
      const errMsg = error.response?.data?.msg || "Add meet failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  // get meet list
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
        }
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

   // useEffect
   useEffect(() => {
    getMeetList();
  }, [userContext])
  
  // admin
  if (userContext?.user?.userRole !== "admin") {
    // return <Navigate to="/" replace />;
    return <div>No access permission</div>;
  }

  const handleUpdateClick = async (pfFolder: string, eventList: string, meetId: number) => {
    try {
        if(pfFolder == null || pfFolder == "") {
          const errMsg = "pfFolder path is required";
          console.log(errMsg);
          message.error(errMsg);
        }
        else if(eventList == null || eventList == "") {
          const errMsg = "eventList type is required";
          console.log(errMsg);
          message.error(errMsg);
        }
        else if(meetId == null) {
          const errMsg = "MeetID is required";
          console.log(errMsg);
          message.error(errMsg);
        }
        else {
          const folderParams = {
              pfFolder: pfFolder,
              eventList: eventList,
              meetId: meetId
          }
          const response = await getEventFiles(folderParams);
          message.success("Updated Start List Successfully");
          setFileList(response.data.files);
          setIsModalVisible(true);
        }
        } catch (error: any) {
        const errMsg = error.response?.data?.error || "Failed to fetch files";
        console.error(errMsg);
        message.error(errMsg);
        }
    };

  const handleCancel = () => {
    setIsModalVisible(false);
    setFileList([]);
  };

  // list columns
  const baseColumns: ColumnsType<IMeet> = [
    {
      title: "Meet ID",
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
        width:200,
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
  ]

  const meetColumns: ColumnsType<IMeet> = [
    ...baseColumns,
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      render: (_, record) => (
        <Space size="middle" direction="vertical" className="action-buttons">
          <Button type="primary" className="action-button" onClick={() => handleUpdateClick(record.pfFolder, record.eventList, record.meetId)}>
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
  ]

  const onTabChange = (key: any) => {
    // console.log(key);
  };


  // edit click
  const onEditClick = (meet: IMeet) => {
    console.log(meet);
    // display existing info
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

  // edit submit
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

      // re-get meet list
      getMeetList();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Update meet failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  // edit cancel
  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingMeet(null);
  };

  // delete click
  const onDeleteClick = async (meet: IMeet) => {
    try {
      await deleteMeetAPI(meet.meetId);
      message.success("Meet deleted successfully");

      // re-get meet list
      getMeetList();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Delete meet failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  return (
    <div>

      {/*Add button area */}
      <Row style={{ marginBottom: 0, paddingBottom: 0 }}>
        <Col span={8}>
          <p style={{ fontWeight: "bold", marginBottom: 0 }}> Meet Management</p>
        </Col>
        <Col span={8}></Col>
        <Col span={8} style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" onClick={onAddClick}>Add</Button>
        </Col>
      </Row>
      <Divider style={{ marginTop: 20, marginBottom: 10 }} />

      {/*Table area*/}
      <Tabs defaultActiveKey="1" onChange={onTabChange} items={tabItems} />
      {/*Add a user dialog box*/}
      <Modal
          title="Add Meet"
          open={isAddModalVisible}
          onOk={() => addform.submit()}
          onCancel={handleAddCancel}
        >
          <Form form={addform} layout="vertical" onFinish={handleAddFormSubmit}>
            <Form.Item name="meetId" label="Meet ID" rules={[{ required: true, message: "Id is required" }]}>
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
      {/*Edit a meet dialog box*/}
      <Modal
        title="Edit Meet"
        open={isEditModalVisible}
        onOk={() => editForm.submit()}
        onCancel={handleEditCancel}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="meetId" label="Meet ID" rules={[{ required: true, message: "Id is required" }]}>
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
  )
}

// declare module 'react' {
//   interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
//     // extends React's HTMLAttributes
//     directory?: string;        // remember to make these attributes optional....
//     webkitdirectory?: string;
//     window?: any;
//   }
// }

export default MeetListAdmin