import React, { createContext, useState, useContext, ReactNode } from "react";

interface VisibilityContextType {
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export const useVisibility = () => {
    const context = useContext(VisibilityContext);
    if (!context) {
      throw new Error("useVisibility must be used within a VisibilityProvider");
    }
    return context;
  };
  
export const VisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLabels, setShowLabels] = useState<boolean>(false);

  return (
    <VisibilityContext.Provider value={{ showLabels, setShowLabels }}>
      {children}
    </VisibilityContext.Provider>
  );
};