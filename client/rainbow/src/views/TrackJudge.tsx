import React, { useEffect, useState } from 'react';
import { Select, Table, Button, message, Divider, Checkbox, Modal, Card, Row, Typography, Col, Input } from 'antd';
import { getAthletebyEventId, updateAthleteAPI, updateEventAPI } from '../apis/api';

import { TimePicker } from '../components';
import moment from 'moment';
import { useEvents } from '../Provider/EventProvider';
import { formatEventCode } from './Eventutils';
import { start } from 'repl';
import { stat } from 'fs';

const { Option } = Select;

const EventsList: React.FC = () => {
  const {athletes, eventsInfo, setAthleteinfo, fetchEvents, setEventsInfo, setError, loading, error } = useEvents();
  const [filteredAthletesInfo, setFilteredAthletesInfo] = useState<AthleteInfo[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: string }>({}); // Track selected status values for each athlete
  const [currentValues, setCurrentValues] = useState<string[]>([]); // Track current status values for each athlete
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [eventComments, setEventComments] = useState<string>(''); // State to hold event description
  const { Title, Text, Paragraph } = Typography;
  const meetid = sessionStorage.getItem('lastSelectedMeetId');

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
  
  // Function to handle status change for an athlete
  const handleStatusChange = (athlete: any) => {
    const statusOptions = currentValues;
    const uniqueValue = athlete.meetId + '-' + athlete.eventCode + '-' + athlete.athleteNum;
    const currentStatus = selectedValues[uniqueValue] || 'Select';
    const currentIndex = statusOptions.indexOf(currentStatus);
    console.log(`Current status for athleteNum ${athlete.athleteNum} is ${currentStatus}`);
    console.log('st: ' + athlete.finishPos);

    // Get a list of current statuses for the filtered athletes
    const filteredUniqueValues = filteredAthletesInfo.map(
      fa => fa.meetId + '-' + fa.eventCode + '-' + fa.athleteNum
    );
    const filteredStatuses = filteredUniqueValues.map(fuv => selectedValues[fuv])
      .filter(status => !['DNS', 'DNF', 'DQ'].includes(status));

    // Find the next available status that is not in filteredStatuses
    let nextIndex = (currentIndex + 1) % statusOptions.length;
    let nextStatus = statusOptions[nextIndex];
    while (filteredStatuses.includes(nextStatus)) {
      nextIndex = (nextIndex + 1) % statusOptions.length;
      nextStatus = statusOptions[nextIndex];
    }

    console.log(`Status changed for athleteNum ${athlete.athleteNum} to ${nextStatus}`);
    const updatedValues = { ...selectedValues, [uniqueValue]: nextStatus };
    setSelectedValues(updatedValues);
    console.log(updatedValues);

    const updatedEvents = athletes.map(event =>
      event.athleteNum === athlete.athleteNum ? { ...event, finishPos: nextStatus } : event
    );
    setAthleteinfo(updatedEvents);
    if (selectedEventCode) {
      setFilteredAthletesInfo(updatedEvents.filter(event => event.eventCode === selectedEventCode));
    } else {
      setFilteredAthletesInfo(updatedEvents);
    }
  };

  useEffect(() => {
    if(eventsInfo.length === 0) {
      return;
    }
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

    const statusOptions = [];

    const length = filteredAthletesInfo.length;

    // Generate numbers 1 to length and add them to statusOptions array
    for (let i = 1; i <= length; i++) {
        statusOptions.push(i.toString());
    }

    statusOptions.push('DNS');
    statusOptions.push('DNF');
    statusOptions.push('DQ');

    setCurrentValues(statusOptions);
  }, [eventsInfo]);

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
  
      // Sort the updated events by finishPos
      updatedEvents.sort((event1: { finishPos: any; }, event2: { finishPos: any; }) => {
        if (event1.finishPos === null && event2.finishPos === null) {
          return 0;
        }
        if (event1.finishPos === null) {
          return -1;
        }
        if (event2.finishPos === null) {
          return 1;
        }
        return event1.finishPos.localeCompare(event2.finishPos);
      });
  
      setAthleteinfo(updatedEvents);
  
      // Sort and set filteredAthletesInfo
      const sortedFilteredAthletesInfo = [...filteredAthletesInfo].sort((event1: { finishPos: any; }, event2: { finishPos: any; }) => {
        if (event1.finishPos === null && event2.finishPos === null) {
          return 0;
        }
        if (event1.finishPos === null) {
          return -1;
        }
        if (event2.finishPos === null) {
          return 1;
        }
        return event1.finishPos.localeCompare(event2.finishPos);
      });
  
      setFilteredAthletesInfo(sortedFilteredAthletesInfo);
  
      message.success('Events status updated successfully!');
    } catch (err) {
      message.error('Error updating events status');
      console.log(err);
    }
  };
  // Function to handle save operation
  const handleReset = async () => {
    try {
      const updatedFilteredAthletesInfo = filteredAthletesInfo.map((athlete: any) => ({
        ...athlete,
        finishPos: null,
        finishTime: null
      }));
      // Initialize a temporary object with the current selectedValues
      let tempSelectedValues = { ...selectedValues };
      // Accumulate updates in tempSelectedValues
      updatedFilteredAthletesInfo.forEach((athlete: any) => {
        const uniqueValue = athlete.meetId + '-' + athlete.eventCode + '-' + athlete.athleteNum;
        tempSelectedValues[uniqueValue] = '';
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
        tempSelectedValues[uniqueValue] = athlete.finishPos || '';
      });
      setSelectedValues(tempSelectedValues);
      const sortedFilteredAthletesInfo = [...filteredAthletes].sort((event1: { finishPos: any; }, event2: { finishPos: any; }) => {
          if (event1.finishPos === null && event2.finishPos === null) {
            return 0;
          }
          if (event1.finishPos === null) {
            return -1;
          }
          if (event2.finishPos === null) {
            return 1;
          }
          return event1.finishPos.localeCompare(event2.finishPos);
        });
    
        setFilteredAthletesInfo(sortedFilteredAthletesInfo);
        setError(filteredEvents.length === 0 ? 'Event not present in this meet' : null); // Set error if no events are found
      }
    };

  // Handle time change in TimePicker
  const handlefinishTimeChange = (time: any, record: AthleteInfo) => {
    // console.log(`Time changed for athleteNum ${record.athleteNum} to ${time}`);
    const timeString = time ? time.format('hh:mm:ss:SSS A') : null; // Convert Moment object to 12-hour format string
    const updatedEvents = athletes.map(event =>
      event.athleteNum === record.athleteNum ? { ...event, finishTime: timeString } : event
    );
    setAthleteinfo(updatedEvents);
    if (selectedEventCode) {
      setFilteredAthletesInfo(updatedEvents.filter(event => event.eventCode === selectedEventCode));
    } else {
      setFilteredAthletesInfo(updatedEvents);
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

  const showCommentModal = () => {
    setIsCommentModalVisible(true);
  };

  const handleCommentOk = async () => {
    // Find the event with the selected event code and update its description
    const updatedEvent = eventsInfo.find(event => event.eventCode === selectedEventCode);
  
    if (!updatedEvent) {
      message.error('Event not found');
      return;
    }
  
    const eventToUpdate = {
      ...updatedEvent,
      eventComments: eventComments,
    };
  
    // Update the local state with the updated event description
    const updatedEvents = eventsInfo.map(event =>
      event.eventCode === selectedEventCode ? eventToUpdate : event
    );
    setEventsInfo(updatedEvents);
  
    try {
      // Update the event description in the backend
      await updateEventAPI([eventToUpdate]);
      message.success('Comment added successfully!');
    } catch (error) {
      message.error('Failed to update comment');
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

  const handleResetAll = async () => {
    try {
      const updatedAthletesInfo = athletes.map((athlete: any) => ({
        ...athlete,
        finishPos: null,
        finishTime: null
      }));

      const updatedFilteredAthletesInfo = updatedAthletesInfo.filter(event => event.eventCode === selectedEventCode)
      
      // Initialize a temporary object with the current selectedValues
      let tempSelectedValues = { ...selectedValues };

      // Accumulate updates in tempSelectedValues
      updatedAthletesInfo.forEach((athlete: any) => {
        const uniqueValue = athlete.meetId + '-' + athlete.eventCode + '-' + athlete.athleteNum;
        tempSelectedValues[uniqueValue] = '';
      });

      //console.log(updatedFilteredAthletesInfo);

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
    if (selectedEventCode) {
      setEventComments(eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventComments || '');
    }
    console.log("Test");
    const statusOptions = [];
    // Assuming athletes.length is 5
    const length = filteredAthletesInfo.length;

    // Generate numbers 1 to 5 and add them to statusOptions array
    for (let i = 1; i <= length; i++) {
        statusOptions.push(i.toString());
    }

    statusOptions.push('DNS');
    statusOptions.push('DNF');
    statusOptions.push('DQ');
    setCurrentValues(statusOptions);
  }, [selectedEventCode]);


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
            <Button onClick={showModal} style={{ marginRight: '10px' }} type="primary">
              Filter Columns
            </Button>
            <Button onClick={showCommentModal} style={{ marginRight: '10px' }} type="primary">
              Add Comments
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
              { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', width: 200 },
              { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 200 },
              { title: 'Athlete Number', dataIndex: 'athleteNum', key: 'athleteNum', width: 175 },
              { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub', width: 300 },
              { title: 'Lane', dataIndex: 'laneOrder', key: 'laneOrder', width: 100 },
              {
                title: 'Rank',
                dataIndex: 'finishPos',
                key: 'finishPos',
                width: 100,
                render: (text: string, record: any) => (
                  <Button
                    style={{ width: 120 }} // Adjust the width as per your requirement
                    onClick={() => handleStatusChange(record)}
                  >
                    {selectedValues[record.meetId + '-' + record.eventCode + '-' + record.athleteNum] || record.finishPos || 'Select'}
                  </Button>
                ),
              },
              {
                title: 'Finish Time',
                dataIndex: 'finishTime',
                key: 'finishTime',
                width: 250,
                render: (text: string, record: any) => (

                  <TimePicker
                    value={record.finishTime ? moment(record.finishTime, 'hh:mm:ss:SSS A') : null} // Provide default moment object in 12-hour format
                    onChange={(time) => handlefinishTimeChange(time, record)}
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
          <Button type="primary" style={{ marginRight: '10px' }} onClick={handleReset}>Reset</Button>
          <Button type="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error && !meetid) return <div>{error}</div>;
  if (eventsInfo.length === 0 ) return <div>No events found</div>;

  return (
    <div className='blue-background'>
      <Card bordered={false} style={{ marginBottom: '30px', background: '#ffffff', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, marginBottom: '10px', color: '#1677FF' }}>Track Judge Screen</Title>
          </Col>
          <Col span={24} >
            <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>{formatEventCode(selectedEventCode)}</Title>
            <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>
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
              checked={columnVisibility.laneOrder}
              onChange={(e) => handleColumnVisibilityChange('laneOrder', e.target.checked)}
            >Lane</Checkbox>
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
const getUniqueEventOptions = (events: EventInfo[]): string[] => {
  const uniqueOptions = new Set<string>();
  events.forEach(event => {
    uniqueOptions.add(event.eventCode);
  });
  return Array.from(uniqueOptions);
};

export default EventsList;
