
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Script from 'next/script';

interface ScriptLoaderContextType {
  isScriptLoaded: boolean;
}

const ScriptLoaderContext = createContext<ScriptLoaderContextType | undefined>(undefined);

export const ScriptLoaderProvider = ({ children }: { children: ReactNode }) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  return (
    <ScriptLoaderContext.Provider value={{ isScriptLoaded }}>
      {children}
    </ScriptLoaderContext.Provider>
  );
};

export const useScriptLoader = () => {
  const context = useContext(ScriptLoaderContext);
  if (context === undefined) {
    throw new Error('useScriptLoader must be used within a ScriptLoaderProvider');
  }
  return context;
};
