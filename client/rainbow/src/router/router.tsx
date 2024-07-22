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

// Declare Router component first
const Router: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    const checkAuthentication = () => {
      const userJSON = sessionStorage.getItem('user');
      if (userJSON) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
      }
      setLoading(false); // Set loading to false after authentication check
    };

    // Initial check on component mount
    checkAuthentication();

    // Optionally, you can use events like 'storage' to detect changes in sessionStorage
    window.addEventListener('storage', checkAuthentication);

    return () => {
      window.removeEventListener('storage', checkAuthentication);
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