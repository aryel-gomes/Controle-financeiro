import React, { createContext, useContext, useState, useEffect } from 'react';
import { setHideValuesGlobal, getHideValuesGlobal } from '../utils/formatters';

interface PrivacyContextType {
  hideValues: boolean;
  setHideValues: (hide: boolean) => void;
  toggleHideValues: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  hideValues: false,
  setHideValues: () => {},
  toggleHideValues: () => {},
});

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideValues, setHideValuesState] = useState<boolean>(() => {
    return getHideValuesGlobal();
  });

  useEffect(() => {
    setHideValuesGlobal(hideValues);
  }, [hideValues]);

  const setHideValues = (hide: boolean) => {
    setHideValuesState(hide);
    setHideValuesGlobal(hide);
  };

  const toggleHideValues = () => {
    setHideValuesState((prev) => {
      const next = !prev;
      setHideValuesGlobal(next);
      return next;
    });
  };

  return (
    <PrivacyContext.Provider value={{ hideValues, setHideValues, toggleHideValues }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => useContext(PrivacyContext);
