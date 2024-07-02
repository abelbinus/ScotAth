import React, { useEffect, useState } from 'react';
import { Select, Table } from 'antd';
import { useEvents } from '../Provider/EventProvider';

const { Option } = Select;

const AllResults: React.FC = () => {
  const {events, setEvents, setError, setLoading, loading, error }: { events: Event[], setEvents: (updatedEvents: Event[]) => void, setError: any, setLoading: (loading: boolean) => void, loading: boolean, error: string | null } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const meetid = localStorage.getItem('lastSelectedMeetId');
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if(events.length === 0) return;
    const initialEventCode = events[0].eventCode;
    setSelectedEventCode(initialEventCode);
    setFilteredEvents(events.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
  }, [events]);

  const downloadCSV = () => {
    const csvContent = [
      Object.keys(events[0]).join(','),
      ...events.map(event => Object.values(event).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  

  const downloadSingleEventCSV = (event: Event) => {
    const csvContent = Object.keys(event).join(',') + '\n' + Object.values(event).join(',');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.eventCode}_event.csv`; // Example: eventCode_event.csv
    a.click();
    URL.revokeObjectURL(url);
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
              { title: 'Check In', dataIndex: 'startPos', key: 'startPos', width: 100 },
              { title: 'Start Time', dataIndex: 'startTime', key: 'startTime', width: 150 },
              { title: 'Rank', dataIndex: 'finishPos', key: 'finishPos', width: 100 },
              { title: 'Finish Time', dataIndex: 'finishTime', key: 'finishTime', width: 150 },
              {
                title: 'Final PF Ranking',
                dataIndex: 'finalPFPos',
                key: 'finalPFPos',
                width: 150
              },
              {
                title: 'Final PF Time',
                dataIndex: 'finalPFTime',
                key: 'finalPFTime',
                width: 150
              }
            ]}
            rowKey="athleteNum"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
        <button onClick={() => {
          const matchingEvents = events.filter(event => event.eventCode === selectedEventCode);
          if (matchingEvents.length > 0) {
            downloadSingleEventCSV(matchingEvents[0]);
          }
        }}>
          Download Single Event CSV
        </button>
        {/* Save All Events as CSV Button */}
        <button onClick={downloadCSV}>Download All Events CSV</button>
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

export default AllResults;
