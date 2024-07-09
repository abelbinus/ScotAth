import React, { useEffect, useState } from 'react';
import { Select, Table, Button, message, Divider, Checkbox, Modal, Card, Row, Typography, Col, Input } from 'antd';
import { updateAthleteAPI, updateEventAPI } from '../apis/api';

import { TimePicker } from '../components';
import moment from 'moment';
import { useEvents } from '../Provider/EventProvider';
import { formatEventCode } from './Eventutils';
import { start } from 'repl';

const { Option } = Select;

const EventsList: React.FC = () => {
  const {athletes, eventsInfo, setAthleteinfo, fetchEvents, setEventsInfo, setError, loading, error } = useEvents();
  const [filteredAthletesInfo, setFilteredAthletesInfo] = useState<AthleteInfo[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: string }>({}); // Track selected status values for each athlete
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
    const updatedValues = { ...selectedValues, [athlete.athleteNum]: value };
    setSelectedValues(updatedValues);
    const updatedEvents = athletes.map(event =>
      event.athleteNum === athlete.athleteNum ? { ...event, finishPos: value } : event
    );
    setAthleteinfo(updatedEvents);
    if (selectedEventCode) {
      setFilteredAthletesInfo(updatedEvents.filter(event => event.eventCode === selectedEventCode)); // Update filtered events based on the selected event
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
      setAthleteinfo(updatedEvents);
      message.success('Events status updated successfully!');
    } catch (err) {
      message.error('Error updating events status');
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

  // Handle event selection from dropdown
  const handleEventSelect = (value: string) => {
    setSelectedEventCode(value);
    if (value === '') {
      setFilteredAthletesInfo(athletes);
    } else {
      const filteredEvents = eventsInfo.filter(event => event.eventCode === value);
      const filteredAthletes = athletes.filter(event => event.eventCode === value);
      setFilteredAthletesInfo(filteredAthletes);
      setError(filteredEvents.length === 0 ? 'Event not present in this meet' : null); // Set error if no events are found
    }
  };

  const getUniqueAthleteOptions = (events: AthleteInfo[]): string[] => {
    const uniqueOptions = new Set<string>();
    const presentOptions = new Set<string>();
    let count = 0;
    events.forEach(event => {
        count++;
        if(event.finishPos !== 'DNS' && event.finishPos !== 'DNF' && event.finishPos !== 'DQ' && event.finishPos !== '' && event.finishPos !== null) {
          presentOptions.add(event.finishPos);
        }
      uniqueOptions.add(count.toString());
    });
    uniqueOptions.add('DNS');
    uniqueOptions.add('DNF');
    uniqueOptions.add('DQ');
    // Exclude specific values from selectedValuesSet
    const excludedValues = ['DNS', 'DNF', 'DQ'];
    const selectedValuesSet = new Set(
      Object.entries(selectedValues)
        .filter(([athleteNum, value]) => events.some(event => event.athleteNum === athleteNum))
        .map(([, value]) => value)
        .filter(value => !excludedValues.includes(value))
    );
  
    // Convert the Set to an Array before filtering
    return Array.from(uniqueOptions)
      .filter(option => !selectedValuesSet.has(option))
      .filter(option => !presentOptions.has(option));
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
      updatedFilteredAthletesInfo.forEach((athlete: any) => {
        tempSelectedValues[athlete.athleteNum] = '';
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
      await updateAthleteAPI(updatedFilteredAthletesInfo);
      
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
              {
                title: 'Rank',
                dataIndex: 'finishPos',
                key: 'finishPos',
                width: 100,
                render: (text: string, record: any) => (
                  <Select
                    style={{ width: 120 }}
                    onChange={(value) => handleStatusChange(value, record)}
                    value={selectedValues[record.athleteNum] || record.finishPos || 'Select'}
                  >
                    {getUniqueAthleteOptions(filteredAthletesInfo).map(optionValue => (
                      <Option key={optionValue} value={optionValue}>
                        {optionValue}
                      </Option>
                    ))}
                  </Select>
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
    <div style={{ padding: '20px' }}>
      <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, marginBottom: '10px', color: '#1677FF' }}>TrackJudge Screen</Title>
            <Text type="secondary">Rank Athletes and set Finish Times</Text>
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
