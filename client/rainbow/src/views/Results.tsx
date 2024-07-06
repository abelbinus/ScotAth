import React, { useEffect, useState } from 'react';
import { Select, Table, Button, Popconfirm, Divider, Checkbox, Modal, Card, Row, Col, Typography } from 'antd';
import { useEvents } from '../Provider/EventProvider';
import './../styles/CustomCSS.css'
import { formatEventCode } from './Eventutils';

const { Option } = Select;

const AllResults: React.FC = () => {
  const {athletes, eventsInfo, setError, fetchEvents, loading, error } = useEvents();
  const [filteredAthletesInfo, setFilteredAthletesInfo] = useState<AthleteInfo[]>([]);
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

  const meetid = sessionStorage.getItem('lastSelectedMeetId');

  useEffect(() => {
    if(eventsInfo.length === 0) return;
    const initialEventCode = eventsInfo[0].eventCode;
    if(!selectedEventCode) {
      setSelectedEventCode(initialEventCode);
      setFilteredAthletesInfo(athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
    }
  }, [meetid]);


  useEffect(() => {
    const updateEvents = async () => {
      if(eventsInfo.length === 0 && meetid) {
        await fetchEvents(meetid);
      }
    }
    updateEvents();

  }, [meetid]);

  useEffect(() => {
    if(eventsInfo.length > 0 && selectedEventCode === '') {
      const initialEventCode = eventsInfo[0].eventCode;
      if(!selectedEventCode) {
        setSelectedEventCode(initialEventCode);
        setFilteredAthletesInfo(athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
      }
    }
  }, [eventsInfo]);

  const downloadCSV = () => {
    // Prepare the headers for the CSV
    const athleteHeaders = Object.keys(athletes[0] || {}).join(',');
    const eventHeaders = Object.keys(eventsInfo[0] || {}).join(',');
  
    const csvContent = [
      `${eventHeaders},${athleteHeaders}`, // Combine headers for both events and athletes
      ...eventsInfo.flatMap(event => {
        const eventValues = Object.values(event).join(',');
        const relatedAthletes = athletes
          .filter(athlete => athlete.eventCode === event.eventCode)
          .map(athlete => `${eventValues},${Object.values(athlete).join(',')}`);
  
        return relatedAthletes.length > 0 ? relatedAthletes : [`${eventValues},No Athletes`];
      })
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSingleCSV = () => {
    // Filter eventInfo and athletes based on selectedEventCode
    const selectedEvent = eventsInfo.find(event => event.eventCode === selectedEventCode);
    const relatedAthletes = athletes.filter(athlete => athlete.eventCode === selectedEventCode);
  
    if (!selectedEvent) {
      console.error('No event found for the given event code');
      return;
    }
  
    // Prepare the headers for the CSV
    const eventHeaders = Object.keys(selectedEvent).filter(key => key !== 'eventCode' && key !== 'meetId');
    const athleteHeaders = relatedAthletes.length > 0 ? Object.keys(relatedAthletes[0]).filter(key => key !== 'eventCode' && key !== 'meetId') : [];
  
    // Combine headers for both events and athletes
    const headers = [...eventHeaders, ...athleteHeaders].join(',');
  
    // Prepare the event data line
    const eventData = eventHeaders.map(key => selectedEvent[key as keyof EventInfo]).join(',');
  
    // Prepare the athlete data lines
    const athleteDataLines = relatedAthletes.map(athlete => {
      const athleteData = athleteHeaders.map(key => athlete[key as keyof AthleteInfo]).join(',');
      return `${eventData},${athleteData}`;
    });
  
    // Handle case when no athletes are found
    const csvContent = [
      headers,
      ...(
        athleteDataLines.length > 0 
          ? athleteDataLines 
          : [`${eventData},No Athletes`]
      )
    ].join('\n');
  
    // Create a blob and trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEventCode}_event.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Handle event selection from dropdown
  const handleEventSelect = (value: string) => {
    setSelectedEventCode(value);
    if (value === '') {
      setFilteredAthletesInfo(athletes); // Reset to show all events when no event is selected
    } else {
      const filtered = athletes.filter(event => event.eventCode === value);
      setFilteredAthletesInfo(filtered);
      setError(filtered.length === 0 ? 'Event not present in this meet' : null); // Set error if no events are found
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

  const handleNextEvent = () => {
    if (!selectedEventCode || eventsInfo.length === 0) return;
  
    // Find the index of the current selected event code
    const currentIndex = eventsInfo.findIndex(event => event.eventCode === selectedEventCode);
  
    // Calculate the index of the next event code
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % eventsInfo.length;
  
    // Update the selected event code with the next event code
    setSelectedEventCode(eventsInfo[nextIndex].eventCode);
    handleEventSelect(eventsInfo[nextIndex].eventCode);
  };

  const renderEvents = () => {
    const eventOptions = getUniqueEventOptions(eventsInfo);
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
            <Button onClick={handleNextEvent} className='button-next' type="primary">Next</Button>
          </div>

          <div className="button-container">
            <Button onClick={showModal} className = 'button-singleDownload' type="primary">
              Filter Columns
            </Button>
          </div>
        </div>
        {error ? (
          <div>{error}</div>
        ) : (
          <Table
            dataSource={filteredAthletesInfo}
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
  if (error && !meetid) return <div>{error}</div>;

  return (
    <div>
      <div style={{ padding: '20px' }}>
        <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
          <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
            <Col span={24}>
              <Title level={2} style={{ margin: 0, marginBottom: '10px', color: '#1677FF' }}>Results</Title>
              <Text type="secondary">View all the Results of the Events</Text>
            </Col>
            <Col span={24} style={{ marginTop: '20px' }}>
              <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>{formatEventCode(selectedEventCode)}</Title>
            </Col>
            <Col span={24} style={{ marginTop: '10px' }}>
              <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>Meet ID: {meetid}</Title>
            </Col>
          </Row>
        </Card>
      
      {renderEvents()}
        <div className="button-download">
          <Button type="primary" className='button-singleDownload' onClick={downloadSingleCSV} style={{  marginRight: '10px', marginBottom: '20px'}}>
            Download Single Event CSV
          </Button>
          <Button type="primary" className='button-singleDownload' onClick={downloadCSV} style={{ marginBottom: '20px'}}>Download All Events CSV</Button>
        </div>
      </div>
      <Modal title="Select Columns to Display" open={isModalVisible} footer={[]} onCancel={handleCancel}>
        <div className="checkbox-container">
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.lastName}
              onChange={(e) => handleColumnVisibilityChange('lastName', e.target.checked)}
            >Last Name</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.firstName}
              onChange={(e) => handleColumnVisibilityChange('firstName', e.target.checked)}
            >First Name</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.athleteNum}
              onChange={(e) => handleColumnVisibilityChange('athleteNum', e.target.checked)}
            >Athlete Number</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.athleteClub}
              onChange={(e) => handleColumnVisibilityChange('athleteClub', e.target.checked)}
            >Athlete Club</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.startPos}
              onChange={(e) => handleColumnVisibilityChange('startPos', e.target.checked)}
            >Check In</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.startTime}
              onChange={(e) => handleColumnVisibilityChange('startTime', e.target.checked)}
            >Start Time</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.finishPos}
              onChange={(e) => handleColumnVisibilityChange('finishPos', e.target.checked)}
            >Rank</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.finishTime}
              onChange={(e) => handleColumnVisibilityChange('finishTime', e.target.checked)}
            >Finish Time</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.finalPFPos}
              onChange={(e) => handleColumnVisibilityChange('finalPFPos', e.target.checked)}
            >Final PF Ranking</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.finalPFTime}
              onChange={(e) => handleColumnVisibilityChange('finalPFTime', e.target.checked)}
            >Final PF Time</Checkbox>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Utility function to get unique event codes
const getUniqueEventOptions = (events: EventInfo[]): string[] => {
  const uniqueOptions = new Set<string>();
  events.forEach(event => {
    uniqueOptions.add(event.eventCode);
  });
  return Array.from(uniqueOptions);
};

export default AllResults;
