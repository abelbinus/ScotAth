import React, { useEffect, useState } from 'react';
import { Select, Table, Button, message, Divider, Modal, Checkbox, Card, Row, Col, Typography, Input } from 'antd';
import { getAthletebyEventId, updateAthleteAPI, updateEventAPI } from '../apis/api';

import { TimePicker } from '../components';
import moment from 'moment';
import { useEvents } from '../Provider/EventProvider';
import './../styles/CustomCSS.css'
import { formatEventCode } from './Eventutils';
import { start } from 'repl';

const { Option } = Select;

const EventsList: React.FC = () => {
  const {athletes, eventsInfo, setAthleteinfo, setEventsInfo, fetchEvents, setError, loading, error } = useEvents();
  const [filteredAthletesInfo, setFilteredAthletesInfo] = useState<AthleteInfo[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: string }>({}); // Track selected status values for each athlete
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
    laneOrder: boolean;
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
    laneOrder: true,
    startPos: true,
    startTime: true,
    finishPos: true,
    finishTime: true,
    finalPFPos: true,
    finalPFTime: true,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const statusOptions = ['Y', 'DNS', 'DNF', 'DQ'];

  // Function to handle status change for an athlete
  const handleStatusChange = (athlete: any) => {
    const currentStatus = selectedValues[athlete.athleteNum] || athlete.startPos || 'Select';
    const currentIndex = statusOptions.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const nextStatus = statusOptions[nextIndex];
    
    const updatedValues = { ...selectedValues, [athlete.athleteNum]: nextStatus };
    setSelectedValues(updatedValues);
    const updatedEvents = athletes.map(event =>
      event.athleteNum === athlete.athleteNum ? { ...event, startPos: nextStatus } : event
    );
    setAthleteinfo(updatedEvents);
    if (selectedEventCode) {
      const selectedEvent = sortBasedonLane(updatedEvents.filter(event => event.eventCode === selectedEventCode));
      setFilteredAthletesInfo(selectedEvent); // Update filtered events based on the selected event
    } else {
      setFilteredAthletesInfo(updatedEvents);
    }
  };

  const sortBasedonLane = (selectedAthletes: any[]) => {
    if(selectedAthletes) {
        // Sort the updated events by finishPos
        selectedAthletes.sort((event1: { laneOrder: any; }, event2: { laneOrder: any; }) => {
          if (event1.laneOrder === null && event2.laneOrder === null) {
            return 0;
          }
          if (event1.laneOrder === null) {
            return -1;
          }
          if (event2.laneOrder === null) {
            return 1;
          }
          return event1.laneOrder.localeCompare(event2.laneOrder);
        });
    }
    return selectedAthletes;
  }

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
  
        // Merge the event with all matching pfEvent objects
        return matchingAthleteEvents.length > 0 
          ? matchingAthleteEvents.map((matchingAthleteEvents: any) => ({ ...event, ...matchingAthleteEvents }))
          : event;
      }).flat();
  
      const sortedUpdatedEvents = sortBasedonLane(updatedEvents);
  
      setAthleteinfo(sortedUpdatedEvents);
  
      // Sort and set filteredAthletesInfo
      const sortedFilteredAthletesInfo = sortedUpdatedEvents.filter((event: { eventCode: any; }) => event.eventCode === selectedEventCode);
      setFilteredAthletesInfo(sortedFilteredAthletesInfo);
  
      setFilteredAthletesInfo(sortedFilteredAthletesInfo);
  
      message.success('Events status updated successfully!');
    } catch (err) {
      message.error('Error updating events status');
      console.log(err);
    }
  };

  // Handle event selection from dropdown
  const handleEventSelect = async (value: string) => {
    setSelectedEventCode(value);
    if (value === '') {
      setFilteredAthletesInfo(athletes);
    } else {
      const filteredEvents = eventsInfo.filter(event => event.eventCode === value);
      const response = await getAthletebyEventId(meetid, value);
      const filteredAthletes = response.data.events;
      // Initialize a temporary object with the current selectedValues
      let tempSelectedValues = { ...selectedValues };
      // Accumulate updates in tempSelectedValues
      filteredAthletes.forEach((athlete: any) => {
        const uniqueValue = athlete.meetId + '-' + athlete.eventCode + '-' + athlete.athleteNum;
        tempSelectedValues[uniqueValue] = athlete.startPos || '';
      });
      setSelectedValues(tempSelectedValues);
      const sortedFilteredAthletesInfo = [...filteredAthletes].sort((event1: { laneOrder: any; }, event2: { laneOrder: any; }) => {
          if (event1.laneOrder === null && event2.laneOrder === null) {
            return 0;
          }
          if (event1.laneOrder === null) {
            return -1;
          }
          if (event2.laneOrder === null) {
            return 1;
          }
          return event1.laneOrder.localeCompare(event2.laneOrder);
        });
    
        setFilteredAthletesInfo(sortedFilteredAthletesInfo);
        setError(filteredEvents.length === 0 ? 'Event not present in this meet' : null); // Set error if no events are found
      }
    };

  // Handle time change in TimePicker
  const handleStartTimeChange = (time: any, record: AthleteInfo) => {
    //console.log(`Time changed for athleteNum ${record.athleteNum} to ${time}`);
    const timeString = time ? time.format('hh:mm:ss:SSS A') : null; // Convert Moment object to 12-hour format string
    const updatedAthletes = athletes.map(event =>
      event.athleteNum === record.athleteNum ? { ...event, startTime: timeString } : event
    );
    const updatedFilteredAthletes = filteredAthletesInfo.map(event =>
      event.athleteNum === record.athleteNum ? { ...event, startTime: timeString } : event
    );
    setAthleteinfo(updatedAthletes);
    if (selectedEventCode) {
      setFilteredAthletesInfo(updatedFilteredAthletes);
    } else {
      setFilteredAthletesInfo(updatedAthletes);
    }
  };

  const handleSetTime = () => {
    const currentTime = moment().format('hh:mm:ss:SSS A');
    const updatedFilteredAthletesInfo = filteredAthletesInfo.map((athlete: any) => ({
      ...athlete,
      startTime: currentTime
    }));
    const updatedEvents = athletes.map(event => {
      // Find all corresponding events in the pfEvent list
      const matchingAthleteEvents = updatedFilteredAthletesInfo.filter((filteredAthletes: { eventCode: string; athleteNum: string; }) => 
        filteredAthletes.eventCode === event.eventCode && filteredAthletes.athleteNum === event.athleteNum
      );

      // Merge the event with all matching pfEvent objects
      return matchingAthleteEvents.length > 0 
        ? matchingAthleteEvents.map((matchingAthleteEvents: any) => ({ ...event, ...matchingAthleteEvents }))
        : event;
    }).flat();
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
    //console.log(eventsInfo.filter((event: { eventCode: any; }) => event.eventCode === selectedEventCode));
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

  // Function to handle save operation
  const handleReset = async () => {
    try {
      const updatedFilteredAthletesInfo = filteredAthletesInfo.map((athlete: any) => ({
        ...athlete,
        startPos: null,
        startTime: null
      }));
      // Initialize a temporary object with the current selectedValues
      let tempSelectedValues = { ...selectedValues };
      // Accumulate updates in tempSelectedValues
      updatedFilteredAthletesInfo.forEach((athlete: any) => {
        tempSelectedValues[athlete.athleteNum] = '';
      });

      // Update selectedValues state once with the accumulated changes
      setSelectedValues(tempSelectedValues);
      // Update the events list with the matching pfEvent data
      const updatedEvents = athletes.map(event => {
        // Find all corresponding events in the pfEvent list
        const matchingAthleteEvents = updatedFilteredAthletesInfo.filter((filteredAthletes: { eventCode: string; athleteNum: string; }) => 
          filteredAthletes.eventCode === event.eventCode && filteredAthletes.athleteNum === event.athleteNum
        );

        // Merge the event with all matching pfEvent objects
        return matchingAthleteEvents.length > 0 
          ? matchingAthleteEvents.map((matchingAthleteEvents: any) => ({ ...event, ...matchingAthleteEvents }))
          : event;
      }).flat();
      setAthleteinfo(updatedEvents);
      setFilteredAthletesInfo(updatedFilteredAthletesInfo);
      await updateAthleteAPI(updatedFilteredAthletesInfo);
      message.success('Current events reset successfully!');
    } catch (err) {
      message.error('Error resetting current event');
    }
  };

  const handleResetAll = async () => {
    try {
      const updatedAthletesInfo = athletes.map((athlete: any) => ({
        ...athlete,
        startPos: null,
        startTime: null
      }));

      const updatedFilteredAthletesInfo = updatedAthletesInfo.filter(event => event.eventCode === selectedEventCode);
      
      // Initialize a temporary object with the current selectedValues
      let tempSelectedValues = { ...selectedValues };

      // Accumulate updates in tempSelectedValues
      updatedAthletesInfo.forEach((athlete: any) => {
        tempSelectedValues[athlete.athleteNum] = '';
      });

      // Update selectedValues state once with the accumulated changes
      setSelectedValues(tempSelectedValues);
      
      // Update the local state with the reset values
      setAthleteinfo(updatedAthletesInfo);
      if (selectedEventCode) {
        setFilteredAthletesInfo(updatedFilteredAthletesInfo);
      } else {
        setFilteredAthletesInfo(updatedAthletesInfo);
      }
      
      // Update the backend with the reset values
      await updateAthleteAPI(updatedAthletesInfo);
      
      // Success message
      message.success('Current events reset successfully!');
    } catch (err) {
      message.error('Error resetting current event');
    }
  };

  useEffect(() => {
    const updateEvents = async () => {
      if(eventsInfo.length === 0 && meetid) {
        await fetchEvents(meetid);
      }
    }
    updateEvents();
    if(eventsInfo.length === 0) {
      return;
    }
    const initialEventCode = eventsInfo[0].eventCode;
    if(!selectedEventCode) {
      setSelectedEventCode(initialEventCode);
      const sortedAthletes = sortBasedonLane(athletes);
      const selectedAthletes = athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode)
      setFilteredAthletesInfo(selectedAthletes);
    }
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
            <Button onClick={showModal} style={{marginRight:'10px'}} type="primary">
              Filter Columns
            </Button>
            <Button onClick={showCommentModal} style={{ marginRight: '10px' }} type="primary">
              Add Comment
            </Button>
            <Button onClick={handleResetAll} type="primary">
              Reset All
            </Button>
          </div>
        </div>
        {error ? (
          <div>{error}</div>
        ) : (
          <Table
            dataSource={filteredAthletesInfo}
            columns={[
              { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', className: 'flexible-column' },
              { title: 'First Name', dataIndex: 'firstName', key: 'firstName', className: 'flexible-column'},
              { title: 'Bib', dataIndex: 'athleteNum', key: 'athleteNum', width: 75 },
              { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub', className: 'flexible-desc-column'},
              { title: 'Lane', dataIndex: 'laneOrder', key: 'laneOrder', width: 50 },
              {
                title: 'Check In',
                dataIndex: 'startPos',
                key: 'startPos',
                width: 100,
                render: (text: any, record: any) => (
                  <Button onClick={() => handleStatusChange(record)} style={{ width: '80px' }}>
                    {selectedValues[record.athleteNum] || record.startPos || 'Select'}
                  </Button>
                )
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
          <div className = 'button-div'>
            <Button type="primary" style={{ marginRight: '10px' }} onClick={handleReset}>Reset</Button>
            <Button type="primary" style={{ marginRight: '10px' }} onClick={handleSetTime}>Set Time</Button>
            <Button type="primary" className = 'button-save' onClick={handleSave}>Save</Button>
          </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error && !meetid) return <div>{error}</div>;
  if (eventsInfo.length === 0 ) return <div>No events found</div>;

  return (
    <div className="green-background">
      <Card bordered={false} style={{ marginBottom: '30px', background: '#ffffff', padding: '20px', borderRadius: '12px'}}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, marginBottom: '0px', color: '#1677FF' }}>Starter's Assistant Screen</Title>
          </Col>
          <Col span={24} >
            <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>{formatEventCode(selectedEventCode)}</Title>
            <Title level={4} style={{ fontWeight: 'normal', marginBottom: '0px', margin: 0, color: '#1677FF' }}>
              {eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventDate} {eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventTime}
            </Title>
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
              checked={columnVisibility.laneOrder}
              onChange={(e) => handleColumnVisibilityChange('laneOrder', e.target.checked)}
            >Lane</Checkbox>
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
      <Modal title="Add Comment" open={isCommentModalVisible} onOk={handleCommentOk} onCancel={handleCommentCancel}>
        <Input.TextArea
          rows={4}
          value={eventComments}
          onChange={(e) => setEventComments(e.target.value)}
          placeholder="Enter Comment"
        />
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

export default EventsList;
