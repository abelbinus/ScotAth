import React, { useState, useEffect, useContext } from "react";
import { Divider, Col, Row, Card, message, Typography, Collapse, Button } from "antd";
import { UserContext } from "../App";
import { IMeet } from "../modals/Meet";
import { getMeetsAPI } from "../apis/api";
import { AxiosError } from "axios";
import { useNavigate } from 'react-router-dom';
import { useVisibility } from "../Provider/VisibilityProvider";

const { Title } = Typography;
const { Panel } = Collapse;

const ViewMeet: React.FC = () => {
  const [meets, setMeets] = useState<IMeet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const userContext = useContext(UserContext);
  const navigate = useNavigate();
  const { setShowLabels } = useVisibility();

  // Fetch meet list from API
  const fetchMeets = async () => {
    setLoading(true);
    try {
      const response = await getMeetsAPI();
      const meetList: IMeet[] = response.data.meet.map((meet: any) => ({
        meetId: meet.meetId,
        meetName: meet.meetName,
        meetDesc: meet.meetDesc ?? '',
        pfFolder: meet.pfFolder,
        pfOutput: meet.pfOutput,
        eventList: meet.eventList,
        intFolder: meet.intFolder,
        edit: meet.edit ?? false,
      }));
      setMeets(meetList);
      setLoading(false);
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Failed to load meets";
      console.error(errMsg);
      setError(errMsg);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeets();
  }, [userContext]); // Reload meets if user context changes

  const handleMeetSelection = (meetId: string) => {
    localStorage.setItem("lastSelectedMeetId", meetId);
    setShowLabels(true);  // Show labels when "View Events" is clicked
    navigate('/view-event', { state: { meetId } });
  };

  const renderPanelHeader = (meetName: string, meetId: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{meetName}</span>
      <Button type="primary" onClick={() => handleMeetSelection(meetId)}>View Events</Button>
    </div>
  );
  
  return (
    <div style={{ padding: '20px' }}>
      <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, color: '#1677FF' }}>View Meets</Title>
          </Col>
        </Row>
      </Card>

      {/* Display meets as cards */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <Collapse accordion>
          {meets.map(meet => (
            <Panel header={renderPanelHeader(meet.meetName, meet.meetId)} key={meet.meetId}>
              <Row justify="space-between" align="middle">
                <Col>
                  <p><strong>Description:</strong> {meet.meetDesc}</p>
                  <p><strong>PF Folder:</strong> {meet.pfFolder}</p>
                  <p><strong>PF Output:</strong> {meet.pfOutput}</p>
                  <p><strong>Event List:</strong> {meet.eventList}</p>
                  <p><strong>Int Folder:</strong> {meet.intFolder}</p>
                  <p><strong>Edit:</strong> {meet.edit ? 'Yes' : 'No'}</p>
                </Col>
              </Row>
            </Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
};

export default ViewMeet;
