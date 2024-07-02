// EventContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getEventbyMeetId } from '../apis/api'; // Adjust the import path as necessary
  

interface EventContextType {
  events: Event[];
  fetchEvents: (meetId: any) => Promise<void>;
  setEvents: (updatedEvent: Event[]) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  loading: boolean;
  error: string | null;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [meetId, setMeetId] = useState<string | null>(null);

  const fetchEvents = useCallback(async (meetId: any) => {
    setLoading(true);
    try {
        setMeetId(meetId);
        if (!meetId) {
            console.log("Hi");
            setError('Meet ID is not provided');
            setLoading(false);
            return; // Exit early if meetId is null or undefined
        }
        else {
            setError(null);
        }
  

        const response = await getEventbyMeetId(meetId);
        const events = response.data.events;

        // Order events based on eventCode
        events.sort((event1: { eventCode: string; }, event2: { eventCode: any; }) => event1.eventCode.localeCompare(event2.eventCode));

        setEvents(events);
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
    <EventContext.Provider value={{ events, setEvents, fetchEvents, setError, setLoading, loading, error }}>
      {children}
    </EventContext.Provider>
  );
};