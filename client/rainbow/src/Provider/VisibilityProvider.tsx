import React, { createContext, useState, useContext, ReactNode } from "react";

/**
 * Interface for VisibilityContext.
 * @interface
 * @property {boolean} showLabels - Boolean indicating whether labels should be shown.
 * @property {function} setShowLabels - Function to update the showLabels state.
 */
interface VisibilityContextType {
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

/**
 * Custom hook to access the VisibilityContext.
 * @returns {VisibilityContextType} The context value that includes the visibility state and setter.
 * @throws Will throw an error if the hook is used outside the VisibilityProvider.
 */
export const useVisibility = () => {
    const context = useContext(VisibilityContext);
    if (!context) {
      throw new Error("useVisibility must be used within a VisibilityProvider");
    }
    return context;
};

/**
 * VisibilityProvider component to manage and provide visibility state via context.
 * @component
 * @param {React.ReactNode} children - The child components that will consume the context.
 * @returns {JSX.Element} The VisibilityProvider component with provided context values.
 */
export const VisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLabels, setShowLabels] = useState<boolean>(false);

  return (
    <VisibilityContext.Provider value={{ showLabels, setShowLabels }}>
      {children}
    </VisibilityContext.Provider>
  );
};
