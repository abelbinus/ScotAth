import { useState, useEffect, useContext } from "react";
import { Divider, Col, Row, Card, message, Typography, Collapse, Button } from "antd";
import { UserContext } from "../App";
import { IMeet } from "../types/Meet";
import { getEventFiles, getMeetsAPI } from "../apis/api";
import { AxiosError } from "axios";

const { Title } = Typography;
const { Panel } = Collapse;

const EventManagement: React.FC = () => {
  const [meets, setMeetList] = useState<IMeet[]>([]);
  const [fileList, setFileList] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const userContext = useContext(UserContext);

  // get meet list
  const getMeetList = async () => {
    try {
      const response: any = await getMeetsAPI();
      const meetList: IMeet[] = response.data.meet;

      let meets = meetList.map((i): IMeet => {
        return {
          meetId: i.meetId,
          meetName: i.meetName,
          meetDesc: i.meetDesc ?? '',
          pfFolder: i.pfFolder,
          pfOutput: i.pfOutput,
          eventList: i.eventList,
          intFolder: i.intFolder,
          edit: i.edit ?? false,
        }
      });

      setMeetList(meets);
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Loading list failed";
      console.error(errMsg);
      message.error(errMsg);
    }
  };

  useEffect(() => {
    getMeetList();
  }, [userContext]);

  const handleUpdateClick = async (pfFolder: string) => {
    try {
        console.log(pfFolder);
        const folderParams = {
            pfFolder: pfFolder
        }
        const response = await getEventFiles(folderParams);
        setFileList(response.data.files);
        setIsModalVisible(true);
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

  return (
    <div>
      {/* Add button area */}
      <Row style={{ marginBottom: 0, paddingBottom: 0 }}>
        <Col span={8}>
          <p style={{ fontWeight: "bold", marginBottom: 0 }}>All Meets</p>
        </Col>
        <Col span={8}></Col>
        <Col span={8} style={{ display: "flex", justifyContent: "flex-end" }}>
          {/* Add any buttons if necessary */}
        </Col>
      </Row>
      <Divider style={{ marginTop: 20, marginBottom: 10 }} />
      
      {/* Display Meets as Cards */}
      {meets.map(meet => (
        <Row key={meet.meetId} gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={24}>
          <Card 
              title={meet.meetName} 
              bordered={false} 
              extra={<Button type="primary" onClick={() => handleUpdateClick(meet.pfFolder)}>Update Meet</Button>}
            >
              <Collapse>
                <Panel header="View Details" key="1">
                  <p><strong>Desc:</strong> {meet.meetDesc}</p>
                  <p><strong>PF Folder:</strong> {meet.pfFolder}</p>
                  <p><strong>PF Output:</strong> {meet.pfOutput}</p>
                  <p><strong>Event List:</strong> {meet.eventList}</p>
                  <p><strong>Int Folder:</strong> {meet.intFolder}</p>
                  <p><strong>Edit:</strong> {meet.edit ? 'Yes' : 'No'}</p>
                </Panel>
              </Collapse>
            </Card>
          </Col>
        </Row>
      ))}
    </div>
  );
};

export default EventManagement;
