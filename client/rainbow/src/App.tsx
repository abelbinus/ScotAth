import React, { useState } from "react";
import { RouterProvider } from "react-router-dom";
import { IUser } from "./modals/User";
import router from "./router/router.tsx";
import { EventProvider } from "./Provider/EventProvider.tsx";
import { VisibilityProvider } from "./Provider/VisibilityProvider.tsx";



interface IUserContext {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
}

// Create user context
export const UserContext = React.createContext<IUserContext>({
  user: null,
  setUser: () => {}
});

function App() {
  const [user, setUser] = useState<IUser | null>(null);
  const loginValues = { user, setUser };

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
  )
}

export default App