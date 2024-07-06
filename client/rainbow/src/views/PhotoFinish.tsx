import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Divider, Input, Row, Select, Table, Typography, message } from 'antd';
import { getEventPhoto, getEventbyEventId, getEventbyMeetId, getMeetByIdAPI, postPFEventbyEventId, updateEventAPI } from '../apis/api';
import { Axios, AxiosError } from 'axios';
import { useEvents } from '../Provider/EventProvider';
import { formatEventCode } from './Eventutils';

const { Search } = Input;
const { Option } = Select;

const Photofinish: React.FC = () => {
  const {athletes, eventsInfo, setAthleteinfo, setEventsInfo, fetchEvents, setError, setLoading, loading, error } = useEvents();
  const [filteredAthletesInfo, setFilteredAthletesInfo] = useState<AthleteInfo[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  let meetid = sessionStorage.getItem('lastSelectedMeetId');
  const [photos, setPhotos] = useState<string[]>([]);
  const { Title, Text } = Typography;

  useEffect(() => {
    const updateEvents = async () => {
      try {
        if(!meetid) {
          meetid = sessionStorage.getItem('lastSelectedMeetId');
        }
        if (!meetid) {
          setError('Meet ID is not provided');
          setLoading(false);
          return; // Exit early if meetId is null or undefined
        }
        const response = await getMeetByIdAPI(meetid);
        const pfFolder = response.data.meet.pfFolder;
        const pfOutput = response.data.meet.pfOutput;
        if (eventsInfo.length > 0) {
          if(selectedEventCode === '') {
            setSelectedEventCode(eventsInfo[0].eventCode);
          }
        }
        else {
          await fetchEvents(meetid);
        }
        if(eventsInfo.length > 0 && selectedEventCode !== '') { 
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

              // Update the events list with the matching pfEvent data
              const updatedEvents = athletes.map(event => {
                // Find all corresponding events in the pfEvent list
                const matchingPFEvents = pfEvent.filter((pfEventItem: { eventCode: string; athleteNum: string; }) => 
                  pfEventItem.eventCode === event.eventCode && pfEventItem.athleteNum === event.athleteNum
                );

                // Merge the event with all matching pfEvent objects
                return matchingPFEvents.length > 0 
                  ? matchingPFEvents.map((matchingPFEvent: any) => ({ ...event, ...matchingPFEvent }))
                  : event;
              }).flat();

              setAthleteinfo(updatedEvents);
              // Set the initial selected event code to the first event code in the list
              if (athletes.length > 0) {
                const initialEventCode = selectedEventCode;
                setSelectedEventCode(initialEventCode);
                setFilteredAthletesInfo(updatedEvents.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
              } else {
                setFilteredAthletesInfo(athletes); // Initialize filteredEvents with all events if no events are found
              }
              setLoading(false);
            }
            else{
              if (athletes.length > 0) {
                message.error(`Failed to read photo finish results for ${selectedEventCode}`);
                const initialEventCode = selectedEventCode;
                setSelectedEventCode(initialEventCode);
                setFilteredAthletesInfo(athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
              }
              setLoading(false);
            }
          }
          catch(err){
            if (athletes.length > 0) {
              const initialEventCode = selectedEventCode;
              setSelectedEventCode(initialEventCode);
              setFilteredAthletesInfo(athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
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

    updateEvents();

  }, [meetid, selectedEventCode]);

  useEffect(() => {
    if(eventsInfo.length > 0 && selectedEventCode === '') {
      setSelectedEventCode(eventsInfo[0].eventCode);
      setFilteredAthletesInfo(athletes.filter((event: { eventCode: any; }) => event.eventCode === selectedEventCode));
    }
  }, [eventsInfo]);

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

  // Handle event selection from dropdown
  const handleEventSelect = (value: string) => {
    setSelectedEventCode(value);
    console.log("events: " + eventsInfo.filter(event => event.eventCode === value));
    if (value === '') {
      setFilteredAthletesInfo(athletes);
    } else {
      const filteredEvents = eventsInfo.filter(event => event.eventCode === value);
      const filteredAthletes = athletes.filter(event => event.eventCode === value);
      setFilteredAthletesInfo(filteredAthletes);
      setError(filteredEvents.length === 0 ? 'Event not present in this meet' : null); // Set error if no events are found
    }
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

  // Utility function to generate lifFilename from eventCode
const generateFilename = (eventCode: string): string => {
  if (eventCode.length < 7) {
    throw new Error('Event code is too short to generate a lif filename');
  }
  return `${eventCode.substring(0, 5)}-${eventCode.substring(5, 7)}`;
};
const updateAllPF = async () => {
  try {
    //setLoading(true);
    if (!meetid) {
      setError('Meet ID is not provided');
      setLoading(false);
      return;
    }
    // Fetch meet details including pfFolder and pfOutput
    const response = await getMeetByIdAPI(meetid);

    // Function to process each event
    const processEvent = async (event: { eventCode: any; }) => {
      const folderParams = {
        pfFolder: response.data.meet.pfFolder,
        pfOutput: response.data.meet.pfOutput,
        meetId: meetid,
        eventCode: event.eventCode,
      };

      try {
        const result = await postPFEventbyEventId(folderParams);
        return { ...event, pfData: result.status }; // Include pfData in event object
      } catch (error) {
        let errorMessage = 'An unexpected error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
          console.error(`Error fetching PF event data for event ${event.eventCode}:`, errorMessage);
        } else {
          // Handle cases where error is not an instance of Error
          console.error(`An unexpected error occurred for event ${event.eventCode}`);
        }
        return { ...event, pfError: errorMessage };
      }
    };

    // Create promises to fetch PF event data for each event
    const pfEventPromises = athletes.map(processEvent);

    // Wait for all promises to settle
    const results = await Promise.allSettled(pfEventPromises);

    // Extract unique fulfilled eventCodes
    const fulfilledEventCodes = results.reduce<string[]>((acc, result) => {
      if (result.status === 'fulfilled') {
        const eventCode = result.value.eventCode; // Assuming result.value contains eventCode
        if (!acc.includes(eventCode)) {
          acc.push(eventCode);
        }
      }
      return acc;
    }, []);

    // Count the number of unique fulfilled eventCodes
    const uniqueFulfilledCount = fulfilledEventCodes.length;

    // Check if the count matches eventsInfo.length
    const isAllFulfilled = eventsInfo.length - uniqueFulfilledCount;
    if(isAllFulfilled == 0) {
      message.success('All events updated successfully');
    }
    else {
      message.error(`${isAllFulfilled} events failed to update`);
    }
    const responseEvents = await getEventbyMeetId(meetid);
    const athleteInfo = responseEvents.data.athleteInfo;
    const eventInfo = responseEvents.data.eventInfo;

    // Order events based on eventCode
    athleteInfo.sort((event1: { eventCode: string; }, event2: { eventCode: any; }) => event1.eventCode.localeCompare(event2.eventCode));
    eventInfo.sort((event1: { eventCode: string; }, event2: { eventCode: any; }) => event1.eventCode.localeCompare(event2.eventCode));

    if (eventInfo === null || eventInfo.length == 0) {
        setError('No events found');
        setLoading(false);
        return; // Exit early if meetId is null or undefined
    }

    if (athleteInfo === null || athleteInfo.length == 0) {
        setError('No athletes found');
        setLoading(false);
        return; // Exit early if meetId is null or undefined
    }

    setAthleteinfo(athleteInfo);
    setEventsInfo(eventInfo);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching PF details:', error);
    setError('Error fetching PF details');
    setLoading(false);
  }
};

  const renderEvents = () => {
    const eventOptions = getUniqueEventOptions(eventsInfo);

    return (
      <div>
        <div className="container">
          <div className="select-container">
            <Select
              placeholder="Select an event"
              style={{ width: '100%', maxWidth: '300px', marginBottom: '16px' }} // Increase width
              value={selectedEventCode}
              onChange={handleEventSelect}
              className='select'
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
            <Button onClick={updateAllPF} className = 'button-singleDownload' type="primary">
              Update All PF Events
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
  if (error && !meetid) return <div>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, marginBottom: '10px', color: '#1677FF' }}>PhotoFinish Screen</Title>
            <Text type="secondary">View Results from Photofinish</Text>
          </Col>
          <Col span={24} style={{ marginTop: '20px' }}>
            <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>{formatEventCode(selectedEventCode)}</Title>
          </Col>
          <Col span={24} style={{ marginTop: '10px' }}>
            <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>Meet ID: {meetid}</Title>
          </Col>
        </Row>
      </Card>
      <Divider style={{ marginTop: 28, marginBottom: 40 }} />
      {renderEvents()}
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

export default Photofinish;
