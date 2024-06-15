import { useState, useEffect, useContext } from "react";
import { Divider, Input, Col, Row, Space, Tag, Table, Button, Form, Modal, Select, Popconfirm, message, Tabs } from "antd";
import { ColumnsType } from "antd/es/table";
import { UserContext } from "../App.tsx";
import { IMeet } from "../types/Meet";
import { MeetList } from "../types/MeetList";
import { getMeetsAPI, deleteMeetAPI, updateMeetAPI } from "../apis/api.ts";

interface EditFormValues {
    meetid: number;
    meetName: string;
    description: string;
    pfFolder: string;
    pfOutput: string;
    eventList: string;
    extFolder: string;
    edit: boolean;
}

const ProjectListAdmin = () => {
  const [meetList, setMeetList] = useState<IMeet[]>([]);
  // userInfo
  const userContext = useContext(UserContext);

  // edit
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<IMeet | null>(null);
  const [editForm] = Form.useForm();

  // auth confirm
  if (userContext?.user?.role !== "admin") {
    return <div>No access permission</div>;
  }

  // get project list
  const getMeetList = async () => {
    try {
      const response: any = await getMeetsAPI(userContext!.user!.id);
      const meetList: MeetList[] = response.data.obj;

      let meets = meetList.map((i): IMeet => {
        return {
          meetid: i.meetid,
          meetName: i.meetName,
          description: i.description,
          pfFolder: i.pfFolder,
          pfOutput: i.pfOutput,
          eventList: i.eventList,
          extFolder: i.extFolder,
          edit: i.edit,
        }
      });
      setMeetList(meets);

      const allMeets = meets;
      setMeetList(allMeets);
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Loading list failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  // list columns
  const baseColumns: ColumnsType<IMeet> = [
    {
      title: "Meet ID",
      dataIndex: "meetid",
      key: "id",
    },
    {
      title: "Meet Name",
      dataIndex: "meetName",
      key: "meetName",
    },
    {
        title: "Description",
        dataIndex: "description",
        key: "description",
        render: text => <span>{text.length > 300 ? `${text.substring(0, 300)}...` : text}</span>,
    },
    {
      title: "EventList",
      dataIndex: "eventList",
      key: "eventList",
    },
    {
      title: "PFFolder",
      dataIndex: "pfFolder",
      key: "pfFolder",
    },
    {
      title: "PFOutput",
      key: "pfOutput",
      dataIndex: "pfOutput",
    },
    {
        title: "ExtFolder",
        key: "extFolder",
        dataIndex: "extFolder",
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
    }
  ]

  const meetColumns: ColumnsType<IMeet> = [
    ...baseColumns,
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button onClick={() => onEditClick(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure to delete this meet?"
            onConfirm={() => onDeleteClick(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      label: "All Meets",
      key: "2",
      children: (
        <Table
          rowKey={record => `${record.meetid}`}
          columns={meetColumns}
          dataSource={meetList}
        />
      ),
    },
  ]

  const onTabChange = (key: any) => {
    // console.log(key);
  };


  // edit click
  const onEditClick = (meet: IMeet) => {
    // display existing info
    setEditingProject(meet);
    setIsEditModalVisible(true);

    editForm.setFieldsValue({
      meetid: meet.meetid,
      meetName: meet.meetName,
      pfFolder: meet.pfFolder,
      pfOutput: meet.pfOutput,
      description: meet.description,
      extFolder: meet.extFolder,
      edit: meet.edit,
      eventList: meet.eventList
    });
  };

  // edit submit
  const handleEditSubmit = async (meet: EditFormValues) => {
    try {
      const meetParams = {
        meetid: meet.meetid,
        meetName: meet.meetName,
        pfFolder: meet.pfFolder,
        pfOutput: meet.pfOutput,
        description: meet.description,
        extFolder: meet.extFolder,
        edit: meet.edit,
        eventList: meet.eventList
      };

      await updateMeetAPI(meetParams, userContext.user!.id);
      message.success("Meet updated successfully");

      setIsEditModalVisible(false);
      setEditingProject(null);

      // re-get project list
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
    setEditingProject(null);
  };

  // delete click
  const onDeleteClick = async (meet: IMeet) => {
    try {
      await deleteMeetAPI(meet.meetid, userContext.user!.id);
      message.success("Meet deleted successfully");

      // re-get project list
      getMeetList();
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Delete meet failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  return (
    <div>
      <p style={{ fontWeight: "bold" }}>Meets</p>
      <Divider />

      {/*Table area*/}
      <Tabs defaultActiveKey="1" onChange={onTabChange} items={tabItems} />

      {/*Edit a project dialog box*/}
      <Modal
        title="Edit Project"
        open={isEditModalVisible}
        onOk={() => editForm.submit()}
        onCancel={handleEditCancel}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="meetid" label="Meet ID" rules={[{ required: true, message: "Id is required" }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="meetName" label="Meet name" rules={[{ required: true, message: "Please input the meet name!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="supervisorId" label="Supervisor" rules={[{ required: true, message: "Please input new supervisor to  be assigned to" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="maxStudents" label="MaxStudents" rules={[{ required: true, message: "MaxStudents is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectListAdmin