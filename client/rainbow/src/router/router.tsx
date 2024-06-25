import { createBrowserRouter } from "react-router-dom";
import Home from "../views/Home";
import LoginPage from "../views/Login";
import ProfilePage from "../views/Profile";
import User from "../views/UserManagement";
import Meet from "../views/MeetManagement";
import CheckIn from "../views/CheckIn";
import ViewMeet from "../views/ViewMeet";
import TrackJudge from "../views/TrackJudge";
import PhotoFinish from "../views/PhotoFinish";
import ViewEvent from "../views/ViewEvent";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    children: [
      // { index: true, element: <Project />, },
      { path: "/profile", element: <ProfilePage />, },
      { path: "/admin-dashboard", element: <User />, },
      { path: "/meet-management", element: <Meet/>},
      { path: "/view-meet", element: <ViewMeet/>},
      { path: "/view-event", element: <ViewEvent/>},
      { path: "/checkin", element: <CheckIn />},
      { path: "/trackjudge", element: <TrackJudge />},
      { path: "/photofinish", element: <PhotoFinish />},
    ],
  },
  { path: "login", element: <LoginPage /> }, // super router
],
);

export default router; 
