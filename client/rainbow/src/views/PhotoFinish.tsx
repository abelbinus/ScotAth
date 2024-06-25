import React, { useEffect, useState } from 'react';
import { Input, Select, Table, message } from 'antd';
import { getEventPhoto, getEventbyMeetId, updateEventAPI } from '../apis/api';

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

const Photofinish: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const meetId = localStorage.getItem('lastSelectedMeetId');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!meetId) {
          setError('Meet ID is not provided');
          setLoading(false);
          return; // Exit early if meetId is null or undefined
        }

        const response = await getEventbyMeetId(meetId);
        setEvents(response.data.events);

        // Set the initial selected event code to the first event code in the list
        if (response.data.events.length > 0) {
          const initialEventCode = response.data.events[0].eventCode;
          setSelectedEventCode(initialEventCode);
          setFilteredEvents(response.data.events.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
        } else {
          setFilteredEvents(response.data.events); // Initialize filteredEvents with all events if no events are found
        }

        setLoading(false);
      } catch (err) {
        setError('Error fetching events');
        setLoading(false);
      }
    };

    fetchEvents();

  }, [meetId]);

  const fetchPhotos = async () => {
    try {
        const photoParams = {
            meetId: meetId,
            eventId: selectedEventCode
        }
        const responsePhoto = await getEventPhoto(photoParams); // Replace with your backend endpoint
        if (!responsePhoto) {
        throw new Error('Failed to fetch photos');
        }
        setPhotos(responsePhoto.data.photos); // Assuming your backend returns an object with a 'photos' array
    } catch (error) {
        console.error('Error fetching photos:', error);
    }
};
  useEffect(() => {
    fetchPhotos();
  }, [selectedEventCode]);
  const handleFilter = (value: string) => {
    setSearchText(value);
    const eventFound = events.find(event => event.eventCode.toLowerCase() === value.toLowerCase());
    if (eventFound) {
      setSelectedEventCode(eventFound.eventCode);
      setFilteredEvents(events.filter(event => event.eventCode === eventFound.eventCode));
      setError(null); // Clear any previous error
    } else {
      setFilteredEvents([]);
      setError('Event not present in this meet'); // Set error if event is not found
    }
  };

  // Function to handle save operation
  const handleSave = async () => {
    try {
      const response = await updateEventAPI(filteredEvents);
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

  const renderEvents = () => {
    const eventOptions = getUniqueEventOptions(events);

    return (
      <div>
        <Select
          placeholder="Select an event"
          style={{ width: 300, marginBottom: '16px' }} // Increase width
          value={selectedEventCode}
          onChange={handleEventSelect}
          showSearch
          filterOption={(input, option) =>
            `${option?.value}`.toLowerCase().indexOf(input.toLowerCase()) >= 0 ?? false
          }
        >
          {eventOptions.map(eventCode => (
            <Option key={eventCode} value={eventCode}>
              {eventCode}
            </Option>
          ))}
        </Select>
        {error ? (
          <div>{error}</div>
        ) : (
          <Table
            dataSource={filteredEvents}
            columns={[
              { title: 'Family Name', dataIndex: 'familyName', key: 'familyName', width: 200 },
              { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 200 },
              { title: 'Athlete Number', dataIndex: 'athleteNum', key: 'athleteNum', width: 175 },
              { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub' },
              {
                title: 'Status',
                dataIndex: 'startListValue',
                key: 'startListValue',
              },
            ]}
            rowKey="athleteNum"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
        <div>
      {photos.map((photo, index) => (
        <img key={index} src={photo} alt={`Photo ${index}`} style={{ maxWidth: '100px', maxHeight: '100px', marginRight: '10px' }} />
      ))}
    </div>
      </div>
      

      
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error && !selectedEventCode) return <div>{error}</div>;

  return (
    <div>
      <h2>Events List for Meet ID: {meetId}</h2>
      {renderEvents()}
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

export default Photofinish;