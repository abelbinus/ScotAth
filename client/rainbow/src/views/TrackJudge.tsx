import React, { useState, useEffect } from 'react';
import { Select, Table, Button, message, Divider, Checkbox, Modal, Card, Row, Typography, Col, Input, Switch } from 'antd';
import { getAthletebyEventId, updateAthleteAPI, updateEventAPI } from '../apis/api';
import { TimePicker } from '../components';
import moment from 'moment';
import { useEvents } from '../Provider/EventProvider';
import { formatEventCode } from './Eventutils';

const { Option } = Select;

/**
 * TrackJudge component provides an interface for track judges to manage race results.
 * Judges can view athlete details, update rankings, finish times, and add comments.
 * 
 * @component
 */
const TrackJudge: React.FC = () => {
  const { athletes, eventsInfo, setAthleteinfo, fetchEvents, setEventsInfo, setError, loading, error } = useEvents();
  const [filteredAthletesInfo, setFilteredAthletesInfo] = useState<AthleteInfo[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: string }>({}); // Track selected status values for each athlete
  const [currentValues, setCurrentValues] = useState<string[]>([]); // Track current status values for each athlete
  const [selectedEventCode, setSelectedEventCode] = useState<string>(''); // State to hold selected event code
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [eventComments, setEventComments] = useState<string>(''); // State to hold event description
  const { Title, Paragraph } = Typography;
  const meetid = sessionStorage.getItem('lastSelectedMeetId');
  const [isColorMode, setIsColorMode] = useState(false); // State for color mode

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
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  /**
   * Handles the status change for an athlete.
   * Updates the athlete's ranking based on the current state.
   * 
   * @param {any} athlete - The athlete whose status is being changed.
   */
  const handleStatusChange = (athlete: any) => {
    const statusOptions = currentValues;
    const uniqueValue = athlete.meetId + '-' + athlete.eventCode + '-' + athlete.athleteNum;
    const currentStatus = selectedValues[uniqueValue] || 'Select';
    const currentIndex = statusOptions.indexOf(currentStatus);

    // Get a list of current statuses for the filtered athletes
    const filteredUniqueValues = filteredAthletesInfo.map(
      filteredAthletes => filteredAthletes.meetId + '-' + filteredAthletes.eventCode + '-' + filteredAthletes.athleteNum
    );

    const filteredStatuses = filteredUniqueValues.map(filteredValues => selectedValues[filteredValues])
      .filter(status => !['DNS', 'DNF', 'DQ'].includes(status));

    // Find the next available status that is not in filteredStatuses
    let nextIndex = (currentIndex + 1) % statusOptions.length;
    let nextStatus = statusOptions[nextIndex];
    while (filteredStatuses.includes(nextStatus)) {
      nextIndex = (nextIndex + 1) % statusOptions.length;
      nextStatus = statusOptions[nextIndex];
    }
    const updatedValues = { ...selectedValues, [uniqueValue]: nextStatus };
    setSelectedValues(updatedValues);
    const updatedAthletes = athletes.map(event =>
      event.athleteNum === athlete.athleteNum ? { ...event, finishPos: nextStatus } : event
    );

    setAthleteinfo(updatedAthletes);
    if (selectedEventCode) {
      const updatedFilteredAthlete = filteredAthletesInfo.map(event =>
        event.athleteNum === athlete.athleteNum ? { ...event, finishPos: nextStatus } : event
      );
      setFilteredAthletesInfo(updatedFilteredAthlete);
    }
  };

  /**
   * Sorts athletes based on their finish positions.
   * If finish position is not available, athletes are sorted by lane order.
   * 
   * @param {any[]} selectedAthletes - The list of selected athletes.
   * @returns {any[]} The sorted list of athletes.
   */
  const sortBasedonRes = (selectedAthletes: any[]) => {
    if (selectedAthletes) {
      // Check if finishPos is empty for all athletes
      const isFinalPFPosEmptyForAll = selectedAthletes.every(
        athlete => athlete.finishPos === null || athlete.finishPos === ''
      );

      if (isFinalPFPosEmptyForAll) {
        // If finishPos is empty for all athletes, sort by laneOrder
        selectedAthletes.sort((event1: { laneOrder: any }, event2: { laneOrder: any }) => {
          return compareWithPadding(event1.laneOrder, event2.laneOrder);
        });
      } else {
        // Otherwise, sort by finishPos
        selectedAthletes.sort((event1: { finishPos: any }, event2: { finishPos: any }) => {
          return compareWithPadding(event1.finishPos, event2.finishPos);
        });
      }
    }
    return selectedAthletes;
  };

  /**
   * Pads strings with leading zeros and compares them.
   * 
   * @param {string | null} val1 - The first value to compare.
   * @param {string | null} val2 - The second value to compare.
   * @returns {number} The comparison result.
   */
  const compareWithPadding = (val1: string | null, val2: string | null): number => {
    if (val1 === null && val2 === null) return 0;
    if (val1 === null) return -1;
    if (val2 === null) return 1;

    // Convert values to strings
    const str1 = val1.toString();
    const str2 = val2.toString();

    // Determine the maximum length
    const maxLength = Math.max(str1.length, str2.length);

    // Pad strings with leading zeros
    const paddedStr1 = str1.padStart(maxLength, '0');
    const paddedStr2 = str2.padStart(maxLength, '0');

    // Compare padded strings
    return paddedStr1.localeCompare(paddedStr2);
  };

  /**
   * Handles the save operation for athlete rankings and times.
   * Updates the backend with the current state of the athletes.
   */
  const handleSave = async () => {
    try {
      await updateAthleteAPI(filteredAthletesInfo);

      // Update the events list with the matching pfEvent data
      const updatedEvents = athletes.map(event => {
        // Find all corresponding events in the pfEvent list
        const matchingAthleteEvents = filteredAthletesInfo.filter((filteredAthletes: { eventCode: string; athleteNum: string; }) =>
          filteredAthletes.eventCode === event.eventCode && filteredAthletes.athleteNum === event.athleteNum
        );

        // Merge the event with all matching pfEvent objects
        return matchingAthleteEvents.length > 0
          ? matchingAthleteEvents.map((matchingAthleteEvents: any) => ({ ...event, ...matchingAthleteEvents }))
          : event;
      }).flat();

      const sortedUpdatedEvents = sortBasedonRes(updatedEvents);

      setAthleteinfo(sortedUpdatedEvents);

      // Sort and set filteredAthletesInfo
      const sortedFilteredAthletesInfo = sortedUpdatedEvents.filter((event: { eventCode: any; }) => event.eventCode === selectedEventCode);
      setFilteredAthletesInfo(sortedFilteredAthletesInfo);

      message.success('Events status updated successfully!');
    } catch (err) {
      message.error('Error updating events status');
      console.log(err);
    }
  };

  /**
   * Handles the reset operation for the current event.
   * Resets all athlete rankings and times to their initial state.
   */
  const handleReset = async () => {
    try {
      const updatedFilteredAthletesInfo = filteredAthletesInfo.map((athlete: any) => ({
        ...athlete,
        finishPos: null,
        finishTime: null
      }));
      // Initialize a temporary object with the current selectedValues
      let tempSelectedValues = { ...selectedValues };
      // Accumulate updates in tempSelectedValues
      updatedFilteredAthletesInfo.forEach((athlete: any) => {
        const uniqueValue = athlete.meetId + '-' + athlete.eventCode + '-' + athlete.athleteNum;
        tempSelectedValues[uniqueValue] = '';
      });

      // Update selectedValues state once with the accumulated changes
      setSelectedValues(tempSelectedValues);
      // Update the events list with the matching pfEvent data
      const updatedEvents = athletes.map(event => {
        // Find all corresponding events in the pfEvent list
        const matchingAthleteEvents = updatedFilteredAthletesInfo.filter((filteredAthletes: { eventCode: string; athleteNum: string; }) =>
          filteredAthletes.eventCode === event.eventCode && filteredAthletes.athleteNum === event.athleteNum
        );

        // Merge the event with all matching pfEvent objects
        return matchingAthleteEvents.length > 0
          ? matchingAthleteEvents.map((matchingAthleteEvents: any) => ({ ...event, ...matchingAthleteEvents }))
          : event;
      }).flat();
      const sortedAthletes = sortBasedonRes(updatedEvents);
      const sortedFilteredAthletesInfo = sortBasedonRes(updatedFilteredAthletesInfo);
      setAthleteinfo(sortedAthletes);
      setFilteredAthletesInfo(sortedFilteredAthletesInfo);
      await updateAthleteAPI(sortedFilteredAthletesInfo);
      message.success('Current events reset successfully!');
    } catch (err) {
      message.error('Error resetting current event');
    }
  };

  /**
   * Handles event selection from the dropdown menu.
   * Filters athletes based on the selected event code.
   * 
   * @param {string} value - The selected event code.
   */
  const handleEventSelect = async (value: string) => {
    setSelectedEventCode(value);
    if (value === '') {
      setFilteredAthletesInfo(athletes);
    } else {
      const filteredEvents = eventsInfo.filter(event => event.eventCode === value);
      const response = await getAthletebyEventId(meetid, value);
      const filteredAthletes = response.data.events;
      // Initialize a temporary object with the current selectedValues
      let tempSelectedValues = { ...selectedValues };
      // Accumulate updates in tempSelectedValues
      filteredAthletes.forEach((athlete: any) => {
        const uniqueValue = athlete.meetId + '-' + athlete.eventCode + '-' + athlete.athleteNum;
        tempSelectedValues[uniqueValue] = athlete.finishPos || '';
      });
      setSelectedValues(tempSelectedValues);
        const sortedFilteredAthletesInfo = sortBasedonRes(filteredAthletes);
        setFilteredAthletesInfo(sortedFilteredAthletesInfo);
      }
    };

  /**
   * Handles finish time changes in the TimePicker component.
   * 
   * @param {any} time - The selected time.
   * @param {AthleteInfo} record - The athlete record being updated.
   */
  const handlefinishTimeChange = (time: any, record: AthleteInfo) => {
    const timeString = time ? time.format('HH:mm') : null; // Convert Moment object to 12-hour format string
    const updatedAthletes = athletes.map(event =>
      event.athleteNum === record.athleteNum ? { ...event, finishTime: timeString } : event
    );
    const updatedFilteredAthletes = filteredAthletesInfo.map(event =>
      event.athleteNum === record.athleteNum ? { ...event, finishTime: timeString } : event
    );
    setAthleteinfo(updatedAthletes);
    if (selectedEventCode) {
      setFilteredAthletesInfo(updatedFilteredAthletes);
    } else {
      setFilteredAthletesInfo(updatedAthletes);
    }
  };

  /**
   * Handles the visibility of columns in the table.
   * 
   * @param {string} column - The column to toggle visibility for.
   * @param {boolean} isChecked - Whether the column should be visible or not.
   */
  const handleColumnVisibilityChange = (column: string, isChecked: boolean) => {
    setColumnVisibility(prev => ({ ...prev, [column]: isChecked }));
  };

  /**
   * Shows the column visibility modal.
   */
  const showModal = () => {
    setIsModalVisible(true);
  };

  /**
   * Closes the column visibility modal.
   */
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  /**
   * Shows the comment modal for adding comments to events.
   */
  const showCommentModal = () => {
    setIsCommentModalVisible(true);
  };

  /**
   * Handles the submission of comments for the selected event.
   */
  const handleCommentOk = async () => {
    // Find the event with the selected event code and update its description
    const updatedEvent = eventsInfo.find(event => event.eventCode === selectedEventCode);

    if (!updatedEvent) {
      message.error('Event not found');
      return;
    }

    const eventToUpdate = {
      ...updatedEvent,
      eventComments: eventComments,
    };

    // Update the local state with the updated event description
    const updatedEvents = eventsInfo.map(event =>
      event.eventCode === selectedEventCode ? eventToUpdate : event
    );
    setEventsInfo(updatedEvents);

    try {
      // Update the event description in the backend
      await updateEventAPI([eventToUpdate]);
      message.success('Comment added successfully!');
    } catch (error) {
      message.error('Failed to update comment');
    }

    setIsCommentModalVisible(false);
  };

  /**
   * Closes the comment modal.
   */
  const handleCommentCancel = () => {
    setIsCommentModalVisible(false);
  };

  /**
   * Handles the navigation to the next event.
   */
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

  /**
   * Handles the reset of all athletes' statuses and times.
   * Resets the current event and updates the backend.
   */
  const handleResetAll = async () => {
    try {
      const updatedAthletesInfo = athletes.map((athlete: any) => ({
        ...athlete,
        finishPos: null,
        finishTime: null
      }));

      const updatedFilteredAthletesInfo = updatedAthletesInfo.filter(event => event.eventCode === selectedEventCode)
      
      // Initialize a temporary object with the current selectedValues
      let tempSelectedValues = { ...selectedValues };

      // Accumulate updates in tempSelectedValues
      updatedAthletesInfo.forEach((athlete: any) => {
        const uniqueValue = athlete.meetId + '-' + athlete.eventCode + '-' + athlete.athleteNum;
        tempSelectedValues[uniqueValue] = '';
      });

      const sortedAthletes = sortBasedonRes(updatedAthletesInfo);
      const sortedFilteredAthletesInfo = sortBasedonRes(updatedFilteredAthletesInfo);

      // Update selectedValues state once with the accumulated changes
      setSelectedValues(tempSelectedValues);
      // Update the local state with the reset values
      setAthleteinfo(sortedAthletes);
      if (selectedEventCode) {
        setFilteredAthletesInfo(sortedFilteredAthletesInfo);
      } else {
        setFilteredAthletesInfo(sortedAthletes);
      }

      // Update the backend with the reset values
      await updateAthleteAPI(updatedAthletesInfo);

      // Success message
      message.success('Current events reset successfully!');
    } catch (err) {
      message.error('Error resetting current event');
    }
  };

  /**
   * Handles the navigation to the previous event.
   */
  const handlePrevEvent = () => {
    if (!selectedEventCode || eventsInfo.length === 0) return;

    // Find the index of the current selected event code
    const currentIndex = eventsInfo.findIndex(event => event.eventCode === selectedEventCode);

    // Calculate the index of the previous event code
    const prevIndex = currentIndex === -1 ? eventsInfo.length - 1 : (currentIndex - 1 + eventsInfo.length) % eventsInfo.length;

    // Update the selected event code with the previous event code
    setSelectedEventCode(eventsInfo[prevIndex].eventCode);
    handleEventSelect(eventsInfo[prevIndex].eventCode);
  };

  /**
   * Fetches events and updates the state when the component is mounted or meetId changes.
   * Also initializes the selected event code and athlete information.
   */
  useEffect(() => {
    const updateEvents = async () => {
      if (eventsInfo.length === 0 && meetid) {
        await fetchEvents(meetid);
      }
    }
    updateEvents();

    if (eventsInfo.length === 0) {
      return;
    }
    const initialEventCode = eventsInfo[0].eventCode;
    if (!selectedEventCode) {
      setSelectedEventCode(initialEventCode);
      const sortedAthletes = sortBasedonRes(athletes);
      setAthleteinfo(sortedAthletes);
      const selectedAthletes = sortedAthletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode)
      setFilteredAthletesInfo(selectedAthletes);
    }

  }, [meetid]);

  /**
   * Updates the state when eventsInfo or selectedEventCode changes.
   */
  useEffect(() => {
    if (eventsInfo.length > 0 && selectedEventCode === '') {
      const initialEventCode = eventsInfo[0].eventCode;
      if (!selectedEventCode) {
        setSelectedEventCode(initialEventCode);
        const selectedAthletes = sortBasedonRes(athletes.filter((event: { eventCode: any; }) => event.eventCode === initialEventCode));
        setFilteredAthletesInfo(selectedAthletes);
      }
    }
  }, [eventsInfo]);

  /**
   * Updates event comments and selected values when filteredAthletesInfo changes.
   */
  useEffect(() => {
    if (selectedEventCode) {
      setEventComments(eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventComments || '');
    }
    const statusOptions = [];
    let tempSelectedValues = { ...selectedValues };

    // Accumulate updates in tempSelectedValues
    filteredAthletesInfo.forEach((athlete: any) => {
      const uniqueValue = athlete.meetId + '-' + athlete.eventCode + '-' + athlete.athleteNum;
      tempSelectedValues[uniqueValue] = athlete.finishPos || '';
    });

    setSelectedValues(tempSelectedValues);
    // Assuming athletes.length is 5
    const length = filteredAthletesInfo.length;
    // Generate numbers 1 to 5 and add them to statusOptions array
    for (let i = 1; i <= length; i++) {
      statusOptions.push(i.toString());
    }

    statusOptions.push('DNS');
    statusOptions.push('DNF');
    statusOptions.push('DQ');
    setCurrentValues(statusOptions);
  }, [filteredAthletesInfo]);

  /**
   * Renders the event selection dropdown and the table of athletes for the selected event.
   */
  const renderEvents = () => {
    const eventOptions = getUniqueEventOptions(eventsInfo);

    return (
      <div>
        <div className="container">
          <div className="select-container">
            <Button onClick={handlePrevEvent} style={{ marginRight: '20px', marginBottom: '10px' }} className='button-next' type="primary">Prev</Button>
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
            <Button onClick={handleNextEvent} style={{ marginRight: '20px', marginBottom: '10px' }} className='button-next' type="primary">Next</Button>
          </div>
          <div className="button-container">
            <Switch
              checkedChildren="Color"
              unCheckedChildren="Default"
              checked={isColorMode}
              onChange={() => setIsColorMode(!isColorMode)}
            />
            <Button onClick={showModal} style={{ marginLeft: '20px' }} type="primary">
              Filter Columns
            </Button>
            <Button onClick={showCommentModal} style={{ marginLeft: '10px' }} type="primary">
              Add Comments
            </Button>
            <Button onClick={handleResetAll} style={{ marginLeft: '10px' }} type="primary">
              Reset All
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
              { title: 'First Name', dataIndex: 'firstName', key: 'firstName', className: 'flexible-column' },
              { title: 'Bib', dataIndex: 'athleteNum', key: 'athleteNum', width: 75 },
              { title: 'Athlete Club', dataIndex: 'athleteClub', key: 'athleteClub', className: 'flexible-desc-column' },
              { title: 'Lane', dataIndex: 'laneOrder', key: 'laneOrder', width: 50 },
              {
                title: 'Rank',
                dataIndex: 'finishPos',
                key: 'finishPos',
                width: 100,
                render: (text: string, record: any) => (
                  <Button
                    style={{ width: 120 }} // Adjust the width as per your requirement
                    onClick={() => handleStatusChange(record)}
                  >
                    {selectedValues[record.meetId + '-' + record.eventCode + '-' + record.athleteNum] || record.finishPos || 'Select'}
                  </Button>
                ),
              },
              {
                title: 'Finish Time',
                dataIndex: 'finishTime',
                key: 'finishTime',
                width: 250,
                render: (text: string, record: any) => (

                  <TimePicker
                    value={record.finishTime ? moment(record.finishTime, 'HH:mm') : null} // Provide default moment object in 12-hour format
                    onChange={(time) => handlefinishTimeChange(time, record)}
                    format="HH:mm"
                  />
                ),
              }
            ].filter(column => columnVisibility[column.dataIndex])}
            rowKey="athleteNum"
            pagination={false}
            scroll={{ x: 'max-content' }}
          />
        )}
        <div className='button-div'>
          <Button onClick={handlePrevEvent} className='button-bottom' type="primary">Prev</Button>
          <Button type="primary" className='button-bottom' onClick={handleReset}>Reset</Button>
          <Button type="primary" className='button-bottom' onClick={handleSave}>Save</Button>
          <Button onClick={handleNextEvent} className='button-bottom' type="primary">Next</Button>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error && !meetid) return <div>{error}</div>;
  if (eventsInfo.length === 0) return <div>No events found</div>;

  return (
    <div className={isColorMode ? 'orange-background' : 'default-background'}>
      <Card bordered={false} style={{ marginBottom: '30px', background: isColorMode ? '#ffffff' : '#f0f2f5', padding: '20px' }}>
        <Row gutter={[16, 16]} style={{ textAlign: 'center' }}>
          <Col span={24}>
            <Title level={2} style={{ margin: 0, marginBottom: '0px', color: '#1677FF' }}>Track Judge Screen</Title>
          </Col>
          <Col span={24} >
            <Title level={4} style={{ fontWeight: 'normal', margin: 0, color: '#1677FF' }}>{formatEventCode(selectedEventCode)}</Title>
            <Title level={4} style={{ fontWeight: 'normal', marginBottom: '0px', margin: 0, color: '#1677FF' }}>
              {eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventDate} {eventsInfo.find(event => event.eventCode === selectedEventCode)?.eventTime}
            </Title>
          </Col>
        </Row>
      </Card>
      {eventComments.trim() !== '' && (
        <Card bordered={false} style={{ marginBottom: '30px', background: '#f0f2f5', padding: '20px' }}>
          <Row gutter={[16, 16]} style={{ textAlign: 'center' }}>
            <Col span={24} style={{ marginTop: '20px' }}>
              <Paragraph style={{ whiteSpace: 'pre-line', color: '#1890ff' }}>
                {eventComments}
              </Paragraph>
            </Col>
          </Row>
        </Card>
      )}
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
              checked={columnVisibility.finishPos}
              onChange={(e) => handleColumnVisibilityChange('finishPos', e.target.checked)}
            >Rank</Checkbox>
          </div>
          <div className="checkbox-row">
            <Checkbox
              checked={columnVisibility.finishTime}
              onChange={(e) => handleColumnVisibilityChange('finishTime', e.target.checked)}
            >Finish Time</Checkbox>
          </div>
        </div>
      </Modal>
      <Modal title="Add Comment" open={isCommentModalVisible} onOk={handleCommentOk} onCancel={handleCommentCancel}>
        <Input.TextArea
          rows={4}
          value={eventComments}
          onChange={(e) => setEventComments(e.target.value)}
          placeholder="Enter Comment"
        />
      </Modal>
    </div>
  );
};

/**
 * Utility function to get unique event codes and their names.
 * 
 * @param {EventInfo[]} events - The list of events.
 * @returns {Object[]} An array of objects containing event codes and names.
 */
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

export default TrackJudge;
