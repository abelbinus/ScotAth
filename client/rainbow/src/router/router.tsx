import { createBrowserRouter, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "../views/Home";
import LoginPage from "../views/Login";
import ProfilePage from "../views/Profile";
import User from "../views/UserManagement";
import Meet from "../views/MeetManagement";
import CheckIn from "../views/Starter";
import ViewMeet from "../views/ViewMeet";
import TrackJudge from "../views/TrackJudge";
import PhotoFinish from "../views/PhotoFinish";
import ViewEvent from "../views/ViewEvent";
import Results from "../views/Results";

// Constants
const INACTIVITY_TIMEOUT = 1 * 60 * 1000; // 24 hours in milliseconds

/**
 * Utility function to check if a user is authenticated.
 * @returns {boolean} Returns `true` if user data exists in session storage, otherwise `false`.
 */
const isAuthenticated = (): boolean => {
  const userJSON = sessionStorage.getItem("user");
  return !!userJSON; // Check if user data exists in session storage
};

/**
 * Router component that handles user authentication and session timeout.
 * Renders the Home component if authenticated, otherwise redirects to the login page.
 * Also includes an inactivity timeout that logs the user out after a specified period of inactivity.
 */
const Router: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    /**
     * Resets the inactivity timer to log out the user after a period of inactivity.
     */
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    /**
     * Handles user logout by clearing session data and redirecting to the login page.
     */
    const handleLogout = () => {
      setAuthenticated(false);
      sessionStorage.removeItem("user"); // Remove user data if session is invalid
      window.location.href = "/login"; // Redirect to login
    };

    /**
     * Checks if the user is authenticated and sets the corresponding state.
     */
    const checkAuthentication = () => {
      if (isAuthenticated()) {
        setAuthenticated(true);
        resetInactivityTimer();
      } else {
        setAuthenticated(false);
      }
      setLoading(false);
    };

    // Initial check on component mount
    checkAuthentication();

    // Set up event listeners for user activity to reset inactivity timer
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);

    return () => {
      clearTimeout(inactivityTimer); // Clear the timeout when component unmounts
      window.removeEventListener("mousemove", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
      window.removeEventListener("click", resetInactivityTimer);
    };
  }, []);

  // Show loading indicator or placeholder content while checking authentication
  if (loading) {
    return <p>Loading...</p>;
  }

  // After loading, render based on authentication status
  return authenticated ? <Home /> : <Navigate to="/login" />;
};

// Create router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <Router />,
    children: [
      { path: "/profile", element: <ProfilePage /> },
      { path: "/admin-dashboard", element: <User /> },
      { path: "/meet-management", element: <Meet /> },
      { path: "/view-meet", element: <ViewMeet /> },
      { path: "/view-event", element: <ViewEvent /> },
      { path: "/checkin", element: <CheckIn /> },
      { path: "/trackjudge", element: <TrackJudge /> },
      { path: "/photofinish", element: <PhotoFinish /> },
      { path: "/results", element: <Results /> },
    ],
  },
  { path: "login", element: <LoginPage /> },
]);

export default router;
