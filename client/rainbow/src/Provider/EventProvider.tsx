import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getEventbyMeetId } from '../apis/api'; // Adjust the import path as necessary

/**
 * Context type definition for EventContext.
 * @interface
 * @property {AthleteInfo[]} athletes - List of athletes related to the events.
 * @property {EventInfo[]} eventsInfo - List of events information.
 * @property {function} fetchEvents - Function to fetch events based on the provided meet ID.
 * @property {function} setAthleteinfo - Function to update the athlete information.
 * @property {function} setEventsInfo - Function to update the events information.
 * @property {function} setError - Function to set an error message.
 * @property {function} setLoading - Function to set the loading state.
 * @property {boolean} loading - Boolean indicating whether the events data is currently being loaded.
 * @property {string | null} error - Error message if any occurred during event fetching.
 */
interface EventContextType {
  athletes: AthleteInfo[];
  eventsInfo: EventInfo[];
  fetchEvents: (meetId: any) => Promise<void>;
  setAthleteinfo: (updatedEvent: AthleteInfo[]) => void;
  setEventsInfo: (updatedEvent: EventInfo[]) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  loading: boolean;
  error: string | null;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

/**
 * Custom hook to access the EventContext.
 * @returns {EventContextType} The context value which includes events and related actions.
 * @throws Will throw an error if the hook is used outside the EventProvider.
 */
export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

/**
 * EventProvider component to provide event-related data and actions via context.
 * @component
 * @param {React.ReactNode} children - The child components that will consume the context.
 * @returns {JSX.Element} The EventProvider component with provided context values.
 */
export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [athletes, setAthleteinfo] = useState<AthleteInfo[]>([]);
  const [eventsInfo, setEventsInfo] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [meetId, setMeetId] = useState<string | null>(null);

  /**
   * Function to fetch events based on the meet ID.
   * @param {any} meetId - The ID of the meet to fetch events for.
   * @returns {Promise<void>} A promise that resolves when events are fetched.
   */
  const fetchEvents = useCallback(async (meetId: any) => {
    setLoading(true);
    try {
        if(!meetId) {
          meetId = sessionStorage.getItem("lastSelectedMeetId");
        }
        setMeetId(meetId);
        if (!meetId) {
            setError('Please select a Meet');
            setLoading(false);
            return; // Exit early if meetId is null or undefined
        } else {
            setError(null);
        }

        const response = await getEventbyMeetId(meetId);
        const athleteInfo = response.data.athleteInfo;
        const eventInfo = response.data.eventInfo;

        // Order events based on eventCode
        athleteInfo.sort((event1: { eventCode: string; }, event2: { eventCode: any; }) => event1.eventCode.localeCompare(event2.eventCode));
        eventInfo.sort((event1: { eventCode: string; }, event2: { eventCode: any; }) => event1.eventCode.localeCompare(event2.eventCode));

        if (eventInfo === null || eventInfo.length == 0) {
            setEventsInfo([]); // Reset events info
            setAthleteinfo([]); // Reset athlete info
            setError('No events found');
            setLoading(false);
            return; // Exit early if meetId is null or undefined
        }

        if (athleteInfo === null || athleteInfo.length == 0) {
            setEventsInfo([]); // Reset events info
            setAthleteinfo([]); // Reset athlete info
            setError('No athletes found');
            setLoading(false);
            return; // Exit early if meetId is null or undefined
        }

        setAthleteinfo(athleteInfo);
        setEventsInfo(eventInfo);
      } catch (err) {
        setError('Error fetching events');
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchEvents(meetId); // Call fetchEvents whenever meetId changes
  }, [fetchEvents, meetId]);

  return (
    <EventContext.Provider value={{ athletes, eventsInfo, setAthleteinfo, setEventsInfo, fetchEvents, setError, setLoading, loading, error }}>
      {children}
    </EventContext.Provider>
  );
};
