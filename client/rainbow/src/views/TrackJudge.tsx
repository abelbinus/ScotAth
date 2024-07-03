import React, { useEffect, useState } from 'react';
import { Select, Table, Button, message, Divider, Checkbox, Modal, Card, Row, Typography, Col } from 'antd';
import { updateEventAPI } from '../apis/api';

import { TimePicker } from '../components';
import moment from 'moment';
import { useEvents } from '../Provider/EventProvider';
import { formatEventCode } from './Eventutils';

const { Option } = Select;

const EventsList: React.FC = () => {
  const {events, setEvents, setError, loading, error }: { events: Event[], setEvents: (updatedEvents: Event[]) => void, setError: any, loading: boolean, error: string | null } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: string }>({}); // Track selected status values for each athlete
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const meetid = localStorage.getItem('lastSelectedMeetId');
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

  // Function to handle status change for an athlete
  const handleStatusChange = (value: string, athlete: any) => {
    const updatedValues = { ...selectedValues, [athlete.athleteNum]: value };
    setSelectedValues(updatedValues);
    const updatedEvents = events.map(event =>
      event.athleteNum === athlete.athleteNum ? { ...event, finishPos: value } : event
    );
    setEvents(updatedEvents);
    if (selectedEventCode) {
      setFilteredEvents(updatedEvents.filter(event => event.eventCode === selectedEventCode)); // Update filtered events based on the selected event
    } else {
      setFilteredEvents(updatedEvents);
    }
  };
  useEffect(() => {
    if(events.length === 0) return;
    const initialEventCode = events[0].eventCode;
    setSelectedEventCode(initialEventCode);
    setFilteredEvents(events.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
  }, [events]);


  // Function to handle save operation
  const handleSave = async () => {
    try {
      const response = await updateEventAPI(filteredEvents);
      setEvents(filteredEvents)
      message.success('Events status updated successfully!');
    } catch (err) {
      message.error('Error updating events status');
    }
  };

  // Handle event selection from dropdown
  const handleEventSelect = (value: string) => {
    setSelectedEventCode(value);
    if (value === '') {
      setFilteredEvents(events); // Reset to show all events when no event is selected
    } else {
      const filtered = events.filter(event => event.eventCode === value);
      setFilteredEvents(filtered);
      setError(filtered.length === 0 ? 'Event not present in this meet' : null); // Set error if no events are found
    }
  };

  const getUniqueAthleteOptions = (events: Event[]): string[] => {
    const uniqueOptions = new Set<string>();
    let count = 0;
    events.forEach(event => {
        count++;
      uniqueOptions.add(count.toString());
    });
    uniqueOptions.add('DNS');
    uniqueOptions.add('DNF');
    uniqueOptions.add('DQ');

    // Exclude specific values from selectedValuesSet
    const excludedValues = ['DNS', 'DNF', 'DQ'];
    const selectedValuesSet = new Set(Object.values(selectedValues).filter(value => !excludedValues.includes(value)));
    // Convert the Set to an Array before filtering
    return Array.from(uniqueOptions).filter(option => !selectedValuesSet.has(option));
  };

  // Handle time change in TimePicker
  const handlefinishTimeChange = (time: any, record: Event) => {
    console.log(`Time changed for athleteNum ${record.athleteNum} to ${time}`);
    const timeString = time ? time.format('hh:mm:ss:SSS A') : null; // Convert Moment object to 12-hour format string
    const updatedEvents = events.map(event =>
      event.athleteNum === record.athleteNum ? { ...event, finishTime: timeString } : event
    );
    setEvents(updatedEvents);
    if (selectedEventCode) {
      setFilteredEvents(updatedEvents.filter(event => event.eventCode === selectedEventCode));
    } else {
      setFilteredEvents(updatedEvents);
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
                    {getUniqueAthleteOptions(filteredEvents).map(optionValue => (
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
          <Button type="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error && !selectedEventCode) return <div>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, color: '#001529' }}>Track Judge Screen</Title>
            <Text type="secondary">Rank Athletes and set Finish Times</Text>
          </Col>
          <Col span={24} style={{ marginTop: '20px' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>{formatEventCode(selectedEventCode)}</Title>
          </Col>
          <Col span={24} style={{ marginTop: '10px' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Meet ID: {meetid}</Title>
          </Col>
        </Row>
      </Card>
      <Divider style={{ marginTop: 28, marginBottom: 40 }} />
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
          checked={columnVisibility.finishPos}
          onChange={(e) => handleColumnVisibilityChange('finishPos', e.target.checked)}
        >Rank</Checkbox>
        <Checkbox
          checked={columnVisibility.finishTime}
          onChange={(e) => handleColumnVisibilityChange('finishTime', e.target.checked)}
        >Finish Time</Checkbox>
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

export default EventsList;
