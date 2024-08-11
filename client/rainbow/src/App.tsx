import React, { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { IUser } from "./modals/User";
import router from "./router/router.tsx";
import { EventProvider } from "./Provider/EventProvider.tsx";
import { VisibilityProvider } from "./Provider/VisibilityProvider.tsx";

/**
 * Interface for user context.
 * @interface
 * @property {IUser | null} user - The currently logged-in user or null if no user is logged in.
 * @property {(user: IUser | null) => void} setUser - Function to update the user state.
 */
interface IUserContext {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
}

// Create user context
export const UserContext = React.createContext<IUserContext>({
  user: null,
  setUser: () => {}
});

/**
 * Main application component.
 * @component
 * @returns {JSX.Element} The root application component.
 */
function App(): JSX.Element {
  const [user, setUser] = useState<IUser | null>(null);
  const loginValues = { user, setUser };

  useEffect(() => {
    // Check if user details exist in sessionStorage
    const userJSON = sessionStorage.getItem('user');
    if (userJSON) {
      const parsedUser: IUser = JSON.parse(userJSON);
      setUser(parsedUser);
    }
  }, []);

  return (
    <UserContext.Provider value={loginValues}>
      <EventProvider>
        <VisibilityProvider>
          <div className="App">
            <RouterProvider router={router} />
          </div>
        </VisibilityProvider>
      </EventProvider>
    </UserContext.Provider>
  );
}

export default App;
