/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Col, Divider, Input, Modal, Row, Select, Table, Typography, message } from 'antd';
import { getEventPhoto, getAthletebyEventId, getEventbyMeetId, getMeetByIdAPI, postPFEventbyEventId, updateEventAPI } from '../apis/api';
import { Axios, AxiosError } from 'axios';
import { useEvents } from '../Provider/EventProvider';
import { formatEventCode, sortBasedonRank } from './Eventutils';

const { Search } = Input;
const { Option } = Select;

const Photofinish: React.FC = () => {
  const {athletes, eventsInfo, setAthleteinfo, setEventsInfo, fetchEvents, setError, setLoading, loading, error } = useEvents();
  const [filteredAthletesInfo, setFilteredAthletesInfo] = useState<AthleteInfo[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  let meetid = sessionStorage.getItem('lastSelectedMeetId');
  const [photos, setPhotos] = useState<string[]>([]);
  const { Title, Text } = Typography;

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
    pfStartTime: boolean;
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
    pfStartTime: true,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const updateEvents = async () => {
      try {
        if(!meetid) {
          meetid = sessionStorage.getItem('lastSelectedMeetId');
        }
        if (!meetid) {
          setError('Please select a Meet');
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
              const responseEvent = await getAthletebyEventId(meetid, selectedEventCode);
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
              const sortedAthletesInfo = sortBasedonRank(updatedEvents);
              setAthleteinfo(sortedAthletesInfo);
              // Set the initial selected event code to the first event code in the list
              if (athletes.length > 0) {
                const initialEventCode = selectedEventCode;
                setSelectedEventCode(initialEventCode);
                const filteredAthletes = updatedEvents.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode);
                const sortedAthletesInfo = sortBasedonRank(filteredAthletes);
                setFilteredAthletesInfo(sortedAthletesInfo);
              } else {
                const sortedAthletesInfo = sortBasedonRank(athletes);
                setFilteredAthletesInfo(sortedAthletesInfo); // Initialize filteredEvents with all events if no events are found
              }
              setLoading(false);
            }
            else{
              if (athletes.length > 0) {
                message.error(`Failed to read photo finish results for ${selectedEventCode}`);
                const initialEventCode = selectedEventCode;
                setSelectedEventCode(initialEventCode);
                const sortedAthletesInfo = sortBasedonRank(athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
                setFilteredAthletesInfo(sortedAthletesInfo);
              }
              setLoading(false);
            }
          }
          catch(err){
            if (athletes.length > 0) {
              const initialEventCode = selectedEventCode;
              setSelectedEventCode(initialEventCode);
              const sortedAthletesInfo = sortBasedonRank(athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
              setFilteredAthletesInfo(sortedAthletesInfo);
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
      const filteredAthletes = athletes.filter((event: { eventCode: any; }) => event.eventCode === selectedEventCode);
      const sortedAthletesInfo = sortBasedonRank(filteredAthletes);
      setFilteredAthletesInfo(sortedAthletesInfo);
    }
  }, [eventsInfo]);

  const fetchPhotos = async () => {
    try {
        if (!meetid) {
          throw new Error('Please select a Meet');
        }
        if(!selectedEventCode) {
          throw new Error('Please select an Event');
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
    if (value === '') {
      const sortedAthletesInfo = sortBasedonRank(athletes);
      setFilteredAthletesInfo(sortedAthletesInfo);
    } else {
      const filteredEvents = eventsInfo.filter(event => event.eventCode === value);
      const filteredAthletes = athletes.filter(event => event.eventCode === value);
      const sortedAthletesInfo = sortBasedonRank(filteredAthletes);
      setFilteredAthletesInfo(sortedAthletesInfo);
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
      setError('Please select a Meet');
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
    eventInfo.sort((event1: { eventCode: string; }, event2: { eventCode: any; }) => event1.eventCode.localeCompare(event2.eventCode));

    const sortedAthletesInfo = sortBasedonRank(athleteInfo);

    if (eventInfo === null || eventInfo.length == 0) {
        setError('No events found');
        setLoading(false);
        return; // Exit early if meetId is null or undefined
    }

    if (sortedAthletesInfo === null || sortedAthletesInfo.length == 0) {
        setError('No athletes found');
        setLoading(false);
        return; // Exit early if meetId is null or undefined
    }

    setAthleteinfo(sortedAthletesInfo);
    setEventsInfo(eventInfo);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching PF details:', error);
    setError('Error fetching PF details');
    setLoading(false);
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
    const eventOptions = getUniqueEventOptions(eventsInfo);
    const renderStartTimes = () => {
      const event = eventsInfo.find(event => event.eventCode === selectedEventCode && event.meetId == meetid);
      return event ? event.eventPFTime : null;
    };

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
                `${option?.children}`.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {eventOptions.map(({ eventCode, eventName }) => (
                <Option key={eventCode} value={eventCode}>
                  {eventName}
                </Option>
              ))}
            </Select>
            <Button onClick={handleNextEvent} className='button-next' type="primary">Next</Button>
          </div>
          <div className="button-container">
            <Button onClick={showModal} style = {{marginRight: '10px'}} className = 'button-singleDownload' type="primary">
              Filter Columns
            </Button>
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
              { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', className: 'flexible-column' },
              { title: 'First Name', dataIndex: 'firstName', key: 'firstName', className: 'flexible-column'},
              { title: 'Bib', dataIndex: 'athleteNum', key: 'athleteNum', width: 75 },
              { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub', className: 'flexible-desc-column'},
              { title: 'Lane', dataIndex: 'laneOrder', key: 'laneOrder', width: 50 },
              { title: 'PFStartTime', dataIndex: 'pfStartTime', key: 'pfStartTime', width: 100, render: (text: any) => renderStartTimes() },
              { title: 'PFRank', dataIndex: 'finalPFPos', key: 'finalPFPos', width: 75 },
              { title: 'PFTime', dataIndex: 'finalPFTime', key: 'finalPFTime', width: 75 }
            ].filter(column => columnVisibility[column.dataIndex])}
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
  if (eventsInfo.length === 0 ) return <div>No events found</div>;

  return (
    <div className='pink-background'>
      <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{textAlign: 'center'}}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, marginBottom: '0px', color: '#1677FF' }}>PhotoFinish Screen</Title>
          </Col>
          <Col span={24} >
            <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>{formatEventCode(selectedEventCode)}</Title>
            <Title level={4} style={{ fontWeight: 'normal', marginBottom: '0px', margin: 0, color: '#1677FF' }}>
              {eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventDate} {eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventTime}
            </Title>
          </Col>
        </Row>
      </Card>
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
              checked={columnVisibility.pfStartTime}
              onChange={(e) => handleColumnVisibilityChange('pfStartTime', e.target.checked)}
            >PF Start Time</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.finalPFPos}
              onChange={(e) => handleColumnVisibilityChange('finalPFPos', e.target.checked)}
            >Final Rankings</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.finalPFTime}
              onChange={(e) => handleColumnVisibilityChange('finalPFTime', e.target.checked)}
            >Final Times</Checkbox>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Utility function to get unique event codes
const getUniqueEventOptions = (events: EventInfo[]): { eventCode: string; eventName: string }[] => {
  const uniqueOptions = new Map<string, string>();
  
  events.forEach(event => {
    // Use eventCode as the key and eventName as the value in the Map
    uniqueOptions.set(event.eventCode, event.eventName);
  });
  
  // Convert the Map to an array of objects
  return Array.from(uniqueOptions.entries()).map(([eventCode, eventName]) => ({
    eventCode,
    eventName
  }));
};

export default Photofinish;
