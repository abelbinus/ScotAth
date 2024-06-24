import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getEventbyMeetId } from '../apis/api';
import { Collapse, Input } from 'antd';

const { Panel } = Collapse;
const { Search } = Input;

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
}

const EventsList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const location = useLocation();
  const meetId = location.state?.meetId;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!meetId) {
          return; // Exit early if meetId is null or undefined
        }

        const response = await getEventbyMeetId(meetId);
        setEvents(response.data.events);
        setLoading(false);
        setFilteredEvents(response.data.events); // Initialize filteredEvents with all events
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
        event.title2.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredEvents(filtered);
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

    return (
      <Collapse accordion>
        {Object.keys(eventGroups).map(eventCode => (
          <Panel header={eventCode} key={eventCode}>
            <ul>
              {eventGroups[eventCode].map(athlete => (
                <li key={athlete.athleteNum}>
                  <strong>{athlete.eventName}</strong>: {athlete.familyName} {athlete.firstName} ({athlete.athleteNum}) - {athlete.athleteClub}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </Collapse>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Events List</h2>
      <Search
        placeholder="Search by eventCode or Title"
        allowClear
        enterButton="Search"
        size="large"
        onSearch={value => handleFilter(value)}
        style={{ marginBottom: '16px' }}
      />
      {renderEvents()}
    </div>
  );
};

export default EventsList;
