import React, { useEffect, useState } from 'react';
import { Input, Select, Table, message } from 'antd';
import { getEventPhoto, getEventbyMeetId, getMeetByIdAPI, getPFEventbyMeetId, updateEventAPI } from '../apis/api';
import { Axios, AxiosError } from 'axios';

const { Search } = Input;
const { Option } = Select;

interface Event {
  eventCode: string;
  eventDate: string;
  eventTime: string;
  laneOrder: string;
  athleteNum: string;
  lastName: string;
  firstName: string;
  athleteClub: string;
  eventLength: string;
  eventName: string;
  title2: string;
  sponsor: string;
  startListValue: string;
  finishPos: string;
  finalPFTime: string;
  finalPFPos: string;
}

const Photofinish: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const meetid = localStorage.getItem('lastSelectedMeetId');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!meetid) {
          setError('Meet ID is not provided');
          setLoading(false);
          return; // Exit early if meetId is null or undefined
        }
        const response = await getMeetByIdAPI(meetid);
        const pfFolder = response.data.meet.pfFolder;
        const pfOutput = response.data.meet.pfOutput;
        const folderParams = {
          pfFolder: pfFolder,
          pfOutput: pfOutput,
          meetId: meetid
        }
        const responsePFEvent = await getPFEventbyMeetId(folderParams);
        const status = responsePFEvent.data.status;
        if (status === 'success') {
          const responseEvent = await getEventbyMeetId(meetid);
          const responseEvents = responseEvent.data.events;
          console.log('events:', responseEvents);
          // Order events based on eventCode
          responseEvents.sort((event1: { eventCode: string; }, event2: { eventCode: any; }) => event1.eventCode.localeCompare(event2.eventCode));

          setEvents(responseEvents);

          // Set the initial selected event code to the first event code in the list
          if (responseEvents.length > 0) {
            const initialEventCode = responseEvents.eventCode;
            setSelectedEventCode(initialEventCode);
            setFilteredEvents(responseEvents.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
          } else {
            setFilteredEvents(responseEvents); // Initialize filteredEvents with all events if no events are found
          }
          setLoading(false);
        }
      } catch (err) {
        console.log('Error fetching events:', err);
        setError('Error fetching events');
        setLoading(false);
      }
    };

    fetchEvents();

  }, [meetid]);

  const fetchPhotos = async () => {
    try {
        if (!meetid || !selectedEventCode) {
          throw new Error('Meet ID or event code is not provided');
        }
        const response = await getMeetByIdAPI(meetid);
        const pfFolder = response.data.meet.pfFolder;
        const pfOutput = response.data.meet.pfOutput;
        if(!pfFolder) {
          throw new Error('pfFolder is not provided');
        }
        if(!pfOutput) {
          throw new Error('pfOutput is not provided');
        }
        const filename = generateFilename(selectedEventCode);
        console.log('filename:', filename);
        const photoParams = {
            pfFolder: pfFolder,
            filename: filename
        }
        const responsePhoto = await getEventPhoto(photoParams); // Fetch photos for the selected event
        setPhotos(responsePhoto.data.photos); // Set photos state
        message.success('Photo found for event');
    } catch (error) {
        if (error instanceof AxiosError && error.response && error.response.data && error.response.data.error) {
          message.error(error.response.data.error);
        }
        else {
          console.error('Error fetching photos:', error);
        }
        setPhotos([]); // Clear photos state
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
      await updateEventAPI(filteredEvents);
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

  // Utility function to generate lifFilename from eventCode
const generateFilename = (eventCode: string): string => {
  if (eventCode.length < 7) {
    throw new Error('Event code is too short to generate a lif filename');
  }
  return `${eventCode.substring(0, 5)}-${eventCode.substring(5, 7)}`;
};

  const renderEvents = () => {
    const eventOptions = getUniqueEventOptions(events);

    return (
      <div>
        <Select
          placeholder="Select an event"
          style={{ width: '100%', maxWidth: '300px', marginBottom: '16px' }} // Increase width
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
              { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', width: 200 },
              { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 200 },
              { title: 'Athlete Number', dataIndex: 'athleteNum', key: 'athleteNum', width: 175 },
              { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub', width: 300 },
              {
                title: 'Status',
                dataIndex: 'startListValue',
                key: 'startListValue',
                width: 100
              },
            ]}
            rowKey="athleteNum"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
          {photos.map((photo, index) => (
            <img 
              key={index} 
              src={photo} 
              alt={`Photo ${index}`} 
              style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px', margin: '10px' }} 
            />
          ))}
        </div>
      </div> 
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error && !selectedEventCode) return <div>{error}</div>;

  return (
    <div>
      <h2>Events List for Meet ID: {meetid}</h2>
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
