import React, { useEffect, useMemo, useState } from 'react';
import { Collapse, Input, Select, Table, Button, message, Divider, Card, Row, Col, Typography } from 'antd';
import { getEventbyMeetId, updateEventAPI } from '../apis/api';
import { useEvents } from '../Provider/EventProvider';
import { formatEventCode } from './Eventutils';

const { Panel } = Collapse;
const { Search } = Input;
const { Option } = Select;

const EventsList: React.FC = () => {
  const {events, fetchEvents, loading, error } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [sortBy, setSortBy] = useState<'eventCode' | 'eventName' | 'eventDate'>('eventCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchText, setSearchText] = useState<string>('');
  const meetid = localStorage.getItem("lastSelectedMeetId");
  const { Title, Text } = Typography;

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchEvents(meetid);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
  
    fetchData();
  }, [meetid]);

  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  const parseDateTime = (date: string, time: string) => {
    let separator = '.';
    if (date.includes(',')) {
      separator = ',';
    } else if (date.includes('-')) {
      separator = '-';
    }
  
    const dateParts = date.split(separator);
    const day = dateParts[0];
    const month = dateParts[1];
    const year = dateParts[2];
  
    let hours = 0;
    let minutes = 0;
  
    if (time.includes(':')) {
      // Check for 12-hour format (AM/PM)
      if (time.includes('AM') || time.includes('PM')) {
        const timeParts = time.split(':');
        const hourPart = timeParts[0];
        const minutePart = timeParts[1].substr(0, 2); // Ensure to only take first two characters of minutes part
        const modifier = timeParts[1].substr(2); // Grab AM/PM part
  
        hours = parseInt(hourPart, 10);
        minutes = parseInt(minutePart, 10);
  
        if (modifier === 'PM' && hours < 12) {
          hours += 12;
        }
        if (modifier === 'AM' && hours === 12) {
          hours = 0;
        }
      } else { // 24-hour format
        const timeParts = time.split(':');
        hours = parseInt(timeParts[0], 10);
        minutes = parseInt(timeParts[1], 10);
      }
    }
  
    return new Date(`${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const sortedAndFilteredEvents = useMemo(() => {
    let sortedEvents = [...filteredEvents];
    if (sortBy === 'eventCode') {
      sortedEvents.sort((a, b) => sortOrder === 'asc' ? a.eventCode.localeCompare(b.eventCode) : b.eventCode.localeCompare(a.eventCode));
    } else if (sortBy === 'eventName') {
      sortedEvents.sort((a, b) => sortOrder === 'asc' ? a.eventName.localeCompare(b.eventName) : b.eventName.localeCompare(a.eventName));
    } else if (sortBy === 'eventDate') {
      sortedEvents.sort((a, b) => {
        const dateTimeA = parseDateTime(a.eventDate, a.eventTime);
        const dateTimeB = parseDateTime(b.eventDate, b.eventTime);
        return sortOrder === 'asc' ? dateTimeA.getTime() - dateTimeB.getTime() : dateTimeB.getTime() - dateTimeA.getTime();
      });
    }

    return sortedEvents.filter(event =>
      event.eventCode.toLowerCase().includes(searchText.toLowerCase()) ||
      event.eventName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [filteredEvents, searchText, sortBy, sortOrder]);

  const handleSort = (sortBy: 'eventCode' | 'eventName' | 'eventDate') => {
    setSortBy(sortBy);
    // Default to ascending order when changing sortBy
    setSortOrder('asc');
  };

  const handleSortOrder = () => {
    setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const handleFilter = (value: string) => {
    setSearchText(value);
    if (value.trim() === '') {
      setFilteredEvents(events); // Reset filter, show all events
    } else {
      const filtered = events.filter((event: { eventCode: string; eventName: string; }) => {
        const formattedEventCode = formatEventCode(event.eventCode).toLowerCase();
        const lowerCaseValue = value.toLowerCase();
        return (
          event.eventCode.toLowerCase().includes(lowerCaseValue) ||
          event.eventName.toLowerCase().includes(lowerCaseValue) ||
          formattedEventCode.includes(lowerCaseValue)
        );
      });
      setFilteredEvents(filtered);
    }
  };

  const renderEvents = () => {
    const eventGroups: { [key: string]: Event[] } = {};

    sortedAndFilteredEvents.forEach(event => {
      if (!eventGroups[event.eventCode]) {
        eventGroups[event.eventCode] = [];
      }
      eventGroups[event.eventCode].push(event);
    });
    const eventCodeCount = Object.keys(eventGroups).length;
    // console.log(eventCodeCount);
    // if (Object.keys(eventGroups).length === 0) {
    //     return <div>No events available for this meet ID.</div>;
    // }
    return (
      <Collapse accordion>
        {Object.keys(eventGroups).map(eventCode => (
          <Panel 
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{formatEventCode(eventCode)} - {eventGroups[eventCode][0]?.eventName}</span>
                {eventGroups[eventCode][0]?.eventDate && eventGroups[eventCode][0]?.eventTime ? (
                  <span>{`${eventGroups[eventCode][0]?.eventDate} - ${eventGroups[eventCode][0]?.eventTime}`}</span>
                ) : null}
              </div>
            }
            key={eventCode}
          >
    
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Table
                dataSource={eventGroups[eventCode]}
                columns={[
                  { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', width: 200, },
                  { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 200, },
                  { title: 'Athlete Number', dataIndex: 'athleteNum', key: 'athleteNum', width: 175, },
                  { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub' },
                ]}
                rowKey="athleteNum"
                pagination={false}
                scroll={{ x: 'max-content' }}
              />
            </div>
          </Panel>
        ))}
      </Collapse>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
      <div style={{ padding: '20px' }}>
      <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, color: '#001529' }}>View Events</Title>
          </Col>
          <Col span={24} style={{ marginTop: '10px' }}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Meet ID: {meetid}</Title>
          </Col>
        </Row>
      </Card>
      <Search
        placeholder="Search by eventCode or Title"
        allowClear
        enterButton="Search"
        size="large"
        onSearch={value => handleFilter(value)}
        style={{ marginBottom: 30 }}
      />
      <div style={{ marginBottom: 30, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{ marginRight: '8px' }}>Sort By:</span>
        <Select value={sortBy} onChange={(value) => handleSort(value as 'eventCode' | 'eventName' | 'eventDate')}>
          <Option value="eventCode">Event Code</Option>
          <Option value="eventName">Event Name</Option>
          <Option value="eventDate">Event Date</Option>
        </Select>
        <Button onClick={handleSortOrder} style={{ marginLeft: '8px' }}>
          {sortOrder === 'asc' ? '▲' : '▼'}
        </Button>
      </div>
      {renderEvents()}
    </div>
  );
};

export default EventsList;
