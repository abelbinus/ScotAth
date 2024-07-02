import React, { useEffect, useState } from 'react';
import { Input, Select, Table, message } from 'antd';
import { getEventPhoto, getEventbyEventId, getEventbyMeetId, getMeetByIdAPI, postPFEventbyEventId, updateEventAPI } from '../apis/api';
import { Axios, AxiosError } from 'axios';
import { useEvents } from '../Provider/EventProvider';

const { Search } = Input;
const { Option } = Select;

const Photofinish: React.FC = () => {
  const {events, setEvents, setError, setLoading, loading, error }: { events: Event[], setEvents: (updatedEvents: Event[]) => void, setError: any, setLoading: (loading: boolean) => void, loading: boolean, error: string | null } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
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
        if (events.length > 0) {
          if(selectedEventCode === '') {
            setSelectedEventCode(events[0].eventCode);
          }
        }
        if(events.length > 0 && selectedEventCode !== '') { 
          console.log('events:', selectedEventCode);
          const folderParams = {
            pfFolder: pfFolder,
            pfOutput: pfOutput,
            meetId: meetid,
            eventCode: selectedEventCode
          }
          try{
            const responsePFEvent = await postPFEventbyEventId(folderParams);
            const status = responsePFEvent.data.status;
            if (status === 'success') {
              const responseEvent = await getEventbyEventId(meetid, selectedEventCode);
              const pfEvent = responseEvent.data.events; // This is a list of events
              console.log('pfevent:', pfEvent);

              // Update the events list with the matching pfEvent data
              const updatedEvents = events.map(event => {
                // Find all corresponding events in the pfEvent list
                const matchingPFEvents = pfEvent.filter((pfEventItem: { eventCode: string; athleteNum: string; }) => 
                  pfEventItem.eventCode === event.eventCode && pfEventItem.athleteNum === event.athleteNum
                );

                // Merge the event with all matching pfEvent objects
                return matchingPFEvents.length > 0 
                  ? matchingPFEvents.map((matchingPFEvent: any) => ({ ...event, ...matchingPFEvent }))
                  : event;
              }).flat();

              setEvents(updatedEvents);
              // Set the initial selected event code to the first event code in the list
              if (events.length > 0) {
                const initialEventCode = selectedEventCode;
                setSelectedEventCode(initialEventCode);
                setFilteredEvents(updatedEvents.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
              } else {
                setFilteredEvents(events); // Initialize filteredEvents with all events if no events are found
              }
              setLoading(false);
            }
          }
          catch(err){
            if (events.length > 0) {
              const initialEventCode = selectedEventCode;
              setSelectedEventCode(initialEventCode);
              setFilteredEvents(events.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
            }
            setLoading(false);
          }
        }
      } catch (err) {
        console.log('Error fetching event:', err);
        setError('Error fetching event');
        setLoading(false);
      }
    };

    fetchEvents();

  }, [meetid, selectedEventCode]);

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
  useEffect(() => {
  }, [selectedEventCode]);

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
    console.log('Selected event:', value);
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
                title: 'Position',
                dataIndex: 'finalPFPos',
                key: 'finalPFPos',
                width: 100
              },
              {
                title: 'Time',
                dataIndex: 'finalPFTime',
                key: 'finalPFTime',
                width: 200
              }
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
