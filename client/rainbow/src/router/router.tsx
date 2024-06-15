import { createBrowserRouter } from "react-router-dom";
import Home from "../views/Home";
import LoginPage from "../views/Login";
import ProfilePage from "../views/Profile";
import User from "../views/UserManagement";
import Meet from "../views/MeetList";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    children: [
      // { index: true, element: <Project />, },
      { path: "/profile", element: <ProfilePage />, },
      { path: "/user", element: <User />, },
      { path: "/meet-admin", element: <Meet/>},
    ],
  },
  { path: "login", element: <LoginPage /> }, // super router
],
);

export default router; 
