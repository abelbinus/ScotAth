import React, { useEffect, useState } from 'react';
import { Select, Table, Button, Popconfirm, Divider, Checkbox, Modal, Card, Row, Col, Typography } from 'antd';
import { useEvents } from '../Provider/EventProvider';
import './../styles/CustomCSS.css'
import { formatEventCode, sortBasedonRank } from './Eventutils';

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
    laneOrder: boolean;
    startPos: boolean;
    startTime: boolean;
    finishPos: boolean;
    finishTime: boolean;
    finalPFPos: boolean;
    finalPFTime: boolean;
    pfStartTime: boolean;
  };
  
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    lastName: true,
    firstName: true,
    athleteNum: true,
    athleteClub: true,
    laneOrder: true,
    startPos: true,
    startTime: true,
    finishPos: true,
    finishTime: true,
    finalPFPos: true,
    finalPFTime: true,
    pfStartTime: true,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const meetid = sessionStorage.getItem('lastSelectedMeetId');

  useEffect(() => {
    if(eventsInfo.length === 0) return;
    const initialEventCode = eventsInfo[0].eventCode;
    if(!selectedEventCode) {
      setSelectedEventCode(initialEventCode);
      const filteredAthletes = athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode);
      const sortedAthletesInfo = sortBasedonRank(filteredAthletes);
      setFilteredAthletesInfo(sortedAthletesInfo);
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
        const filteredAthletes = athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode);
        const sortedAthletesInfo = sortBasedonRank(filteredAthletes);
        setFilteredAthletesInfo(sortedAthletesInfo);
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
      const sortedAthletesInfo = sortBasedonRank(athletes);
      setFilteredAthletesInfo(sortedAthletesInfo); // Reset to show all events when no event is selected
    } else {
      const filteredAthletes = athletes.filter((event: { eventCode: any; }) => event.eventCode === value);
      const sortedAthletesInfo = sortBasedonRank(filteredAthletes);
      setFilteredAthletesInfo(sortedAthletesInfo);
      setError(sortedAthletesInfo.length === 0 ? 'Event not present in this meet' : null); // Set error if no events are found
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
    const renderStartTimes = () => {
      const event = eventsInfo.find(event => event.eventCode === selectedEventCode && event.meetId == meetid);
      return event ? event.eventPFTime : null;
    };
    const columns = [
      { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', className: 'flexible-column' },
      { title: 'First Name', dataIndex: 'firstName', key: 'firstName', className: 'flexible-column'},
      { title: 'Bib', dataIndex: 'athleteNum', key: 'athleteNum', width: 75 },
      { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub', className: 'flexible-desc-column'},
      { title: 'Lane', dataIndex: 'laneOrder', key: 'laneOrder', width: 50 },
      { title: 'PFStartTime', dataIndex: 'pfStartTime', key: 'pfStartTime', width: 100, render: (text: any) => renderStartTimes() },
      { title: 'PFRank', dataIndex: 'finalPFPos', key: 'finalPFPos', width: 75 },
      { title: 'PFTime', dataIndex: 'finalPFTime', key: 'finalPFTime', width: 75 },
      { title: 'CheckIn', dataIndex: 'startPos', key: 'startPos', width: 75 },
      { title: 'StartTime', dataIndex: 'startTime', key: 'startTime', width: 150 },
      { title: 'TJRank', dataIndex: 'finishPos', key: 'finishPos', width: 75 },
      { title: 'TJTime', dataIndex: 'finishTime', key: 'finishTime', width: 150 },
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
                `${option?.children}`.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {eventOptions.map(({ eventCode, eventName }) => (
                <Option key={eventCode} value={eventCode}>
                  {eventName}
                </Option>
              ))}
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
  if (eventsInfo.length === 0 ) return <div>No events found</div>;

  return (
    <div>
      <div className='red-background'>
        <Card bordered={false} style={{ marginBottom: '30px', background: '#ffffff', padding: '20px' }}>
          <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
            <Col span={24}>
              <Title level={2} style={{ margin: 0, marginBottom: '0px', color: '#1677FF' }}>Results</Title>
            </Col>
            <Col span={24}>
              <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>{formatEventCode(selectedEventCode)}</Title>
              <Title level={4} style={{ fontWeight: 'normal', marginBottom: '0px', margin: 0, color: '#1677FF' }}>
                {eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventDate} {eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventTime}
              </Title>
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
              checked={columnVisibility.laneOrder}
              onChange={(e) => handleColumnVisibilityChange('laneOrder', e.target.checked)}
            >Lane</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.pfStartTime}
              onChange={(e) => handleColumnVisibilityChange('pfStartTime', e.target.checked)}
            >PF Start Time</Checkbox>
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
        </div>
      </Modal>
    </div>
  );
};

// Utility function to get unique event codes
const getUniqueEventOptions = (events: EventInfo[]): { eventCode: string; eventName: string }[] => {
  const uniqueOptions = new Map<string, string>();
  
  events.forEach(event => {
    // Use eventCode as the key and eventName as the value in the Map
    uniqueOptions.set(event.eventCode, event.eventName);
  });
  
  // Convert the Map to an array of objects
  return Array.from(uniqueOptions.entries()).map(([eventCode, eventName]) => ({
    eventCode,
    eventName
  }));
};

export default AllResults;
