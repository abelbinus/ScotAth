import React, { useEffect, useState } from 'react';
import { Collapse, Input, Select, Table, Button, message } from 'antd';
import { getEventbyMeetId, updateEventAPI } from '../apis/api';

const { Panel } = Collapse;
const { Search } = Input;
const { Option } = Select;

interface Event {
  eventCode: string;
  eventDate: string;
  eventTime: string;
  laneOrder: string;
  athleteNum: string;
  familyName: string;
  firstName: string;
  athleteClub: string;
  eventLength: string;
  eventName: string;
  title2: string;
  sponsor: string;
  startListValue: string;
  finishPos: string;
}

const EventsList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [sortedFilteredEvents, setSortedFilteredEvents] = useState<Event[]>([]);
  const [sortBy, setSortBy] = useState<'eventCode' | 'eventName' | 'eventTime'>('eventCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const meetId = localStorage.getItem("lastSelectedMeetId");
  // Function to handle status change for an athlete
  const handleStatusChange = (value: string, athlete: any) => {
    const updatedEvents = events.map(event => 
      event.athleteNum === athlete.athleteNum ? { ...event, startListValue: value } : event
    );
    setEvents(updatedEvents);
    setFilteredEvents(updatedEvents); // Also update filtered events
  };

  useEffect(() => {
    // Function to sort events based on sortBy and sortOrder
    const sortEvents = () => {
      const sortedEvents = [...filteredEvents].sort((a, b) => {
        if (sortBy === 'eventCode') {
          return sortOrder === 'asc' ? a.eventCode.localeCompare(b.eventCode) : b.eventCode.localeCompare(a.eventCode);
        } else if (sortBy === 'eventName') {
          return sortOrder === 'asc' ? a.eventName.localeCompare(b.eventName) : b.eventName.localeCompare(a.eventName);
        } else if (sortBy === 'eventTime') {
          return sortOrder === 'asc' ? a.eventTime.localeCompare(b.eventTime) : b.eventTime.localeCompare(a.eventTime);
        }
        return 0;
      });

      setFilteredEvents(sortedEvents);
    };

    sortEvents();
  }, [filteredEvents, sortBy, sortOrder]);

  const handleSort = (sortBy: 'eventCode' | 'eventName' | 'eventTime') => {
    setSortBy(sortBy);
    // Default to ascending order when changing sortBy
    setSortOrder('asc');
  };

  const handleSortOrder = (order: 'asc' | 'desc') => {
    setSortOrder(order);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!meetId) {
            setError('Meet ID is not provided');
            setLoading(false);
            return; // Exit early if meetId is null or undefined
        }
  

        const response = await getEventbyMeetId(meetId);
        const events = response.data.events;

        // Order events based on eventCode
        events.sort((event1: { eventCode: string; }, event2: { eventCode: any; }) => event1.eventCode.localeCompare(event2.eventCode));

        setEvents(events);
        setFilteredEvents(response.data.events); // Initialize filteredEvents with all events
        setLoading(false);
      } catch (err) {
        setError('Error fetching events');
        setLoading(false);
      }
    };

    fetchEvents();
  }, [meetId]);

  const handleFilter = (value: string) => {
    setSearchText(value);
    if (value.trim() === '') {
      setFilteredEvents(events); // Reset filter, show all events
    } else {
      const filtered = events.filter(event =>
        event.eventCode.toLowerCase().includes(value.toLowerCase()) ||
        event.eventName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  const handleMeetSelection = (meetId: string) => {
    localStorage.setItem("lastSelectedMeetId", meetId);
    console.log(meetId);
  };

  // Function to handle save operation
  const handleSave = async (eventGroup: Event[]) => {
    try {
      const response = await updateEventAPI(eventGroup);
      message.success('Events status updated successfully!');
    } catch (err) {
      message.error('Error updating events status');
    }
  };

  const renderEvents = () => {
    const eventGroups: { [key: string]: Event[] } = {};

    filteredEvents.forEach(event => {
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
          <Panel header={`${eventCode} - ${eventGroups[eventCode][0]?.eventName}`} key={eventCode}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Table
                dataSource={eventGroups[eventCode]}
                columns={[
                  { title: 'Family Name', dataIndex: 'familyName', key: 'familyName', width: 200, },
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
    <div>
      <h2>Events List for Meet ID: {meetId}</h2>
      <Search
        placeholder="Search by eventCode or Title"
        allowClear
        enterButton="Search"
        size="large"
        onSearch={value => handleFilter(value)}
        style={{ marginBottom: '16px' }}
      />
      <div>
        <span>Sort By: </span>
        <Select value={sortBy} onChange={(value) => handleSort(value as 'eventCode' | 'eventName' | 'eventTime')}>
          <Option value="eventCode">Event Code</Option>
          <Option value="eventName">Event Name</Option>
          <Option value="eventTime">Event Time</Option>
        </Select>
        <Button onClick={() => handleSortOrder('asc')}>
          {sortOrder === 'asc' ? '▲' : '△'}
        </Button>
        <Button onClick={() => handleSortOrder('desc')}>
          {sortOrder === 'desc' ? '▼' : '▽'}
        </Button>
      </div>
      {renderEvents()}
    </div>
  );
};

export default EventsList;
