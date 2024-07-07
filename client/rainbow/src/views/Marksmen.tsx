import React, { useEffect, useState } from 'react';
import { Select, Table, Button, message, Divider, Modal, Checkbox, Card, Row, Col, Typography, Input } from 'antd';
import { updateAthleteAPI, updateEventAPI } from '../apis/api';

import { TimePicker } from '../components';
import moment from 'moment';
import { useEvents } from '../Provider/EventProvider';
import './../styles/CustomCSS.css'
import { formatEventCode } from './Eventutils';

const { Option } = Select;

const EventsList: React.FC = () => {
  const {athletes, eventsInfo, setAthleteinfo, setEventsInfo, fetchEvents, setError, loading, error } = useEvents();
  const [filteredAthletesInfo, setFilteredAthletesInfo] = useState<AthleteInfo[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const meetid = sessionStorage.getItem('lastSelectedMeetId');
  const { Title, Text, Paragraph } = Typography;
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [eventComments, setEventComments] = useState<string>(''); // State to hold event Comment
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
  
  // Function to handle status change for an athlete
  const handleStatusChange = (value: string, athlete: any) => {
    const updatedEvents = athletes.map(event =>
      event.athleteNum === athlete.athleteNum ? { ...event, startPos: value } : event
    );
    setAthleteinfo(updatedEvents);
    if (selectedEventCode) {
      setFilteredAthletesInfo(updatedEvents.filter(event => event.eventCode === selectedEventCode)); // Update filtered events based on the selected event
    } else {
      setFilteredAthletesInfo(updatedEvents);
    }
  };

  useEffect(() => {
    if(eventsInfo.length === 0) return;
    const initialEventCode = eventsInfo[0].eventCode;
    if(!selectedEventCode) {
      setSelectedEventCode(initialEventCode);
      setFilteredAthletesInfo(athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
    }
  }, [meetid]);

  useEffect(() => {
    if (selectedEventCode) {
      setEventComments(eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventComments || '');
    }
  }, [selectedEventCode]);


  // Function to handle save operation
  const handleSave = async () => {
    try {
      await updateAthleteAPI(filteredAthletesInfo);
      // Update the events list with the matching pfEvent data
      const updatedEvents = athletes.map(event => {
        // Find all corresponding events in the pfEvent list
        const matchingAthleteEvents = filteredAthletesInfo.filter((filteredAthletes: { eventCode: string; athleteNum: string; }) => 
          filteredAthletes.eventCode === event.eventCode && filteredAthletes.athleteNum === event.athleteNum
        );

        // Merge the event with all matching athlete objects
        return matchingAthleteEvents.length > 0 
          ? matchingAthleteEvents.map((matchingAthleteEvents: any) => ({ ...event, ...matchingAthleteEvents }))
          : event;
      }).flat();
      setAthleteinfo(updatedEvents);
      message.success('Events status updated successfully!');
    } catch (err) {
      message.error('Error updating events status');
    }
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

  // Handle time change in TimePicker
  const handleStartTimeChange = (time: any, record: AthleteInfo) => {
    console.log(`Time changed for athleteNum ${record.athleteNum} to ${time}`);
    const timeString = time ? time.format('hh:mm:ss:SSS A') : null; // Convert Moment object to 12-hour format string
    const updatedEvents = athletes.map(event =>
      event.athleteNum === record.athleteNum ? { ...event, startTime: timeString } : event
    );
    setAthleteinfo(updatedEvents);
    if (selectedEventCode) {
      setFilteredAthletesInfo(updatedEvents.filter(event => event.eventCode === selectedEventCode));
    } else {
      setFilteredAthletesInfo(updatedEvents);
    }
  };

  const handleSetTime = () => {
    const currentTime = moment().format('hh:mm:ss:SSS A');
    const updatedEvents = filteredAthletesInfo.map(event => {
      if (event.eventCode === selectedEventCode) {
        return {
          ...event,
          startTime: currentTime,
        };
      }
      return event;
    });
    setAthleteinfo(updatedEvents);
    setFilteredAthletesInfo(updatedEvents.filter(event => event.eventCode === selectedEventCode));
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

  const showCommentModal = () => {
    setIsCommentModalVisible(true);
  };

  const handleCommentOk = async () => {
    console.log(eventsInfo.filter((event: { eventCode: any; }) => event.eventCode === selectedEventCode));
    // Find the event with the selected event code and update its Comment
    const updatedEvent = eventsInfo.find(event => event.eventCode === selectedEventCode);
  
    if (!updatedEvent) {
      message.error('Event not found');
      return;
    }
  
    const eventToUpdate = {
      ...updatedEvent,
      eventComments: eventComments,
    };
  
    // Update the local state with the updated event Comment
    const updatedEvents = eventsInfo.map(event =>
      event.eventCode === selectedEventCode ? eventToUpdate : event
    );
    setEventsInfo(updatedEvents);
  
    try {
      // Update the event Comment in the backend
      await updateEventAPI([eventToUpdate]);
      message.success('Comment added successfully!');
    } catch (error) {
      message.error('Failed to update Comment');
    }
  
    setIsCommentModalVisible(false);
  };

  const handleCommentCancel = () => {
    setIsCommentModalVisible(false);
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


  const renderEvents = () => {

    const eventOptions = getUniqueEventOptions(eventsInfo);

    return (
      <div>
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
              {eventOptions.map(eventCode => (
                <Option key={eventCode} value={eventCode}>
                  {formatEventCode(eventCode)}
                </Option>
              ))}
            </Select>
            <Button onClick={handleNextEvent} className='button-next' type="primary">Next</Button>
          </div>

          <div className="button-container">
            <Button onClick={showModal} style={{marginRight:'10px'}} type="primary">
              Filter Columns
            </Button>
            <Button onClick={showCommentModal} type="primary">
              Add Comment
            </Button>
          </div>
        </div>
        {error ? (
          <div>{error}</div>
        ) : (
          <Table
            dataSource={filteredAthletesInfo}
            columns={[
              { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', width: 200 },
              { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 200 },
              { title: 'Athlete Number', dataIndex: 'athleteNum', key: 'athleteNum', width: 175 },
              { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub', width: 300 },
              {
                title: 'Check In',
                dataIndex: 'startPos',
                key: 'startPos',
                width: 100,
                render: (text: string, record: any) => (
                  <Select
                    defaultValue={record.startPos || 'Select'}
                    style={{ width: 120 }}
                    onChange={(value) => handleStatusChange(value, record)}
                  >
                    <Option value="Y">Y</Option>
                    <Option value="DNS">DNS</Option>
                    <Option value="DNF">DNF</Option>
                    <Option value="DQ">DQ</Option>
                  </Select>
                ),
              },
              {
                title: 'Start Time',
                dataIndex: 'startTime',
                key: 'startTime',
                width: 250,
                render: (text: string, record: any) => (

                  <TimePicker
                    value={record.startTime ? moment(record.startTime, 'hh:mm:ss:SSS A') : null} // Provide default moment object in 12-hour format
                    onChange={(time) => handleStartTimeChange(time, record)}
                    format="hh:mm:ss:SSS A"
                    use12Hours
                  />
                ),
              }
            ].filter(column => columnVisibility[column.dataIndex])}
            rowKey="athleteNum"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px'}}>
          <Button type="primary" style={{ marginRight: '10px' }} onClick={handleSetTime}>Set Time</Button>
          <Button type="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    );
  };
  if (loading) return <div>Loading...</div>;
  if (error && !meetid) return <div>{error}</div>;
  return (
    <div style={{ padding: '20px' }}>
      <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, marginBottom: '10px', color: '#1677FF' }}>Marksmen Screen</Title>
            <Text type="secondary">Check In Athletes and set Start Times</Text>
          </Col>
          <Col span={24} style={{ marginTop: '20px' }}>
            <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>{formatEventCode(selectedEventCode)}</Title>
          </Col>
          <Col span={24} style={{ marginTop: '10px' }}>
            <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>Meet ID: {meetid}</Title>
          </Col>
        </Row>
      </Card>
      {eventComments.trim() !== '' && (
          <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
            <Row gutter={[16, 16]} style={{ textAlign: 'center' }}>
              <Col span={24} style={{ marginTop: '20px' }}>
                <Paragraph style={{ whiteSpace: 'pre-line', color: '#1890ff' }}>
                  {eventComments}
                </Paragraph>
              </Col>
            </Row>
          </Card>
        )}
      <Divider style={{ marginTop: 28, marginBottom: 40 }} />
      {renderEvents()}

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

export default EventsList;
