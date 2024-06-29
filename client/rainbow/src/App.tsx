import React, { useState } from "react";
import { RouterProvider } from "react-router-dom";
import { IUser } from "./modals/User";
import router from "./router/router.tsx";



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
      <div className="App">
        <RouterProvider router={router} />
      </div>
    </UserContext.Provider>
  )
}

export default App