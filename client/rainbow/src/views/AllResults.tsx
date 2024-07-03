import React, { useEffect, useState } from 'react';
import { Select, Table, Button, Popconfirm, Divider, Checkbox, Modal, Card, Row, Col, Typography } from 'antd';
import { useEvents } from '../Provider/EventProvider';
import './../styles/CustomCSS.css'
import { formatEventCode } from './Eventutils';

const { Option } = Select;

const AllResults: React.FC = () => {
  const { events, setError, loading, error }: { events: Event[], setEvents: (updatedEvents: Event[]) => void, setError: any, setLoading: (loading: boolean) => void, loading: boolean, error: string | null } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const { Title, Text } = Typography;
  
  type ColumnVisibility = {
    [key: string]: boolean;
    lastName: boolean;
    firstName: boolean;
    athleteNum: boolean;
    athleteClub: boolean;
    startPos: boolean;
    startTime: boolean;
    finishPos: boolean;
    finishTime: boolean;
    finalPFPos: boolean;
    finalPFTime: boolean;
  };
  
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    lastName: true,
    firstName: true,
    athleteNum: true,
    athleteClub: true,
    startPos: true,
    startTime: true,
    finishPos: true,
    finishTime: true,
    finalPFPos: true,
    finalPFTime: true,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const meetid = localStorage.getItem('lastSelectedMeetId');

  useEffect(() => {
    if (events.length === 0) return;
    const initialEventCode = events[0].eventCode;
    setSelectedEventCode(initialEventCode);
    setFilteredEvents(events.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
  }, [events]);

  const downloadCSV = () => {
    const csvContent = [
      Object.keys(events[0]).join(','),
      ...events.map(event => Object.values(event).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSingleEventCSV = (event: Event) => {
    const csvContent = Object.keys(event).join(',') + '\n' + Object.values(event).join(',');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.eventCode}_event.csv`; // Example: eventCode_event.csv
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEventSelect = (value: string) => {
    setSelectedEventCode(value);
    if (value === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event => event.eventCode === value);
      setFilteredEvents(filtered);
      setError(filtered.length === 0 ? 'Event not present in this meet' : null);
    }
  };

  const handleColumnVisibilityChange = (column: string, isChecked: boolean) => {
    setColumnVisibility(prev => ({ ...prev, [column]: isChecked }));
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const renderEvents = () => {
    const eventOptions = getUniqueEventOptions(events);
    const columns = [
      { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', width: 200 },
      { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 200 },
      { title: 'Athlete Number', dataIndex: 'athleteNum', key: 'athleteNum', width: 175 },
      { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub', width: 300 },
      { title: 'Check In', dataIndex: 'startPos', key: 'startPos', width: 100 },
      { title: 'Start Time', dataIndex: 'startTime', key: 'startTime', width: 150 },
      { title: 'Rank', dataIndex: 'finishPos', key: 'finishPos', width: 100 },
      { title: 'Finish Time', dataIndex: 'finishTime', key: 'finishTime', width: 150 },
      { title: 'Final PF Ranking', dataIndex: 'finalPFPos', key: 'finalPFPos', width: 150 },
      { title: 'Final PF Time', dataIndex: 'finalPFTime', key: 'finalPFTime', width: 150 }
    ].filter(column => columnVisibility[column.dataIndex]);

    return (
      <div >
        <div className="container">
          <div className="select-container">
            <Select
              placeholder="Select an event"
              className="select"
              value={selectedEventCode}
              onChange={handleEventSelect}
              showSearch
              filterOption={(input, option) =>
                `${option?.value}`.toLowerCase().indexOf(input.toLowerCase()) >= 0 ?? false
              }
            >
              {eventOptions.map(eventCode => {
                // Split eventCode based on the hyphen "-"
                if(eventCode.includes('-')) {
                  const parts = eventCode.split('-');
                  if (parts.length === 2) {
                    // Splitting eventCode into parts
                    const parts = eventCode.split('-');
                    const mainEventCode = parts[0]; // Assuming eventCode always has a main code before "-"
                    let round = null;
                    let heat = null;
                    console.log(parts[1]?.length);
                    if(parts[1]?.length === 2) {
                      round = parts[1]?.[0]; // Assuming round is the first character after "-"
                      heat = parts[1]?.slice(1); // Assuming heat is the characters after the first one after "-"
                    } // If there is no round or heat, skip this event
                    else if(parts[1]?.length === 3) {
                      round = parts[1]?.[0]; // Extract the first 2 characters as round
                      heat = parts[1].slice(1,3); // Extract the remaining 2 characters as heat
                    }
                    else if(parts[1]?.length === 4) {
                      round = parts[1].slice(0,2); // Extract the first 2 characters as round
                      heat = parts[1].slice(1,3); // Extract the remaining 2 characters as heat
                    }

                    return (
                      <Option key={eventCode} value={eventCode}>
                        {`Event Code: ${mainEventCode}, Round: ${round}, Heat: ${heat}`}
                      </Option>
                    );
                  }
                } 
                else {
                  return (
                    <Option key={eventCode} value={eventCode}>
                      {`${eventCode}`} {/* If format is unexpected, display the original eventCode */}
                    </Option>
                  );
                }
              })}
            </Select>
          </div>

          <div className="button-container">
            <Button onClick={showModal} type="primary">
              Filter Columns
            </Button>
          </div>
        </div>
        {error ? (
          <div>{error}</div>
        ) : (
          <Table
            dataSource={filteredEvents}
            columns={columns}
            rowKey="athleteNum"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error && !selectedEventCode) return <div>{error}</div>;

  return (
    <div>
      <div style={{ padding: '20px' }}>
      <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, color: '#001529' }}>All Results</Title>
            <Text type="secondary">View all the Results of the Events</Text>
          </Col>
          <Col span={24} style={{ marginTop: '20px' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>{formatEventCode(selectedEventCode)}</Title>
          </Col>
          <Col span={24} style={{ marginTop: '10px' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Meet ID: {meetid}</Title>
          </Col>
        </Row>
      </Card>
        <div className="button-container">
          <Popconfirm
            title="Choose Output Option"
            onConfirm={() => {
              const matchingEvents = events.filter(event => event.eventCode === selectedEventCode);
              if (matchingEvents.length > 0) {
                downloadSingleEventCSV(matchingEvents[0]);
              }
            }}
            onCancel={() => {}}
            okText="CSV"
            cancelText="PDF"
          >
            <Button type="primary" style={{ marginRight: '10px' }}>
              Download Single Event CSV
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Choose Output Option"
            onConfirm={() => downloadCSV()}
            onCancel={() => {}}
            okText="CSV"
            cancelText="PDF"
          >
            <Button type="primary">Download All Events CSV</Button>
          </Popconfirm>
        </div>
      </div>
      <Divider style={{ marginTop: 10, marginBottom: 40 }} />
      {renderEvents()}
      <Modal title="Select Columns to Display" open={isModalVisible} footer={[]} onCancel={handleCancel}>
        <Checkbox
          checked={columnVisibility.lastName}
          onChange={(e) => handleColumnVisibilityChange('lastName', e.target.checked)}
        >Last Name</Checkbox>
        <Checkbox
          checked={columnVisibility.firstName}
          onChange={(e) => handleColumnVisibilityChange('firstName', e.target.checked)}
        >First Name</Checkbox>
        <Checkbox
          checked={columnVisibility.athleteNum}
          onChange={(e) => handleColumnVisibilityChange('athleteNum', e.target.checked)}
        >Athlete Number</Checkbox>
        <Checkbox
          checked={columnVisibility.athleteClub}
          onChange={(e) => handleColumnVisibilityChange('athleteClub', e.target.checked)}
        >Athlete Club</Checkbox>
        <Checkbox
          checked={columnVisibility.startPos}
          onChange={(e) => handleColumnVisibilityChange('startPos', e.target.checked)}
        >Check In</Checkbox>
        <Checkbox
          checked={columnVisibility.startTime}
          onChange={(e) => handleColumnVisibilityChange('startTime', e.target.checked)}
        >Start Time</Checkbox>
        <Checkbox
          checked={columnVisibility.finishPos}
          onChange={(e) => handleColumnVisibilityChange('finishPos', e.target.checked)}
        >Rank</Checkbox>
        <Checkbox
          checked={columnVisibility.finishTime}
          onChange={(e) => handleColumnVisibilityChange('finishTime', e.target.checked)}
        >Finish Time</Checkbox>
        <Checkbox
          checked={columnVisibility.finalPFPos}
          onChange={(e) => handleColumnVisibilityChange('finalPFPos', e.target.checked)}
        >Final PF Ranking</Checkbox>
        <Checkbox
          checked={columnVisibility.finalPFTime}
          onChange={(e) => handleColumnVisibilityChange('finalPFTime', e.target.checked)}
        >Final PF Time</Checkbox>
      </Modal>
    </div>
  );
};

// Utility function to get unique event codes
const getUniqueEventOptions = (events: Event[]): string[] => {
  const uniqueOptions = new Set<string>();
  events.forEach(event => {
    uniqueOptions.add(event.eventCode);
  });
  return Array.from(uniqueOptions);
};

export default AllResults;
