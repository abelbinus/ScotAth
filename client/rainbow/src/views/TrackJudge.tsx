import React, { useEffect, useState } from 'react';
import { Input, Select, Table, Button, message } from 'antd';
import { getEventbyMeetId, updateEventAPI } from '../apis/api';

import { TimePicker } from '../components';
import moment from 'moment';
import { useEvents } from '../Provider/EventProvider';

const { Search } = Input;
const { Option } = Select;

const EventsList: React.FC = () => {
  const {events, setEvents, setError, loading, error }: { events: Event[], setEvents: (updatedEvents: Event[]) => void, setError: any, loading: boolean, error: string | null } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: string }>({}); // Track selected status values for each athlete
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const meetid = localStorage.getItem('lastSelectedMeetId');
  
  
  const parseTime = (time: string) => {  
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
  
    return new Date(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

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

  const handleSetTime = () => {
    const currentTime = moment().format('hh:mm:ss:SSS A');
    const updatedEvents = filteredEvents.map(event => {
      if (event.eventCode === selectedEventCode) {
        return {
          ...event,
          finishTime: currentTime,
        };
      }
      return event;
    });
    setEvents(updatedEvents);
    setFilteredEvents(updatedEvents.filter(event => event.eventCode === selectedEventCode));
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
            ]}
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

export default EventsList;
