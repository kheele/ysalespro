'use client';

import React, { createContext, useState, useContext, type ReactNode } from 'react';

type GeneralHeroContextType = {
  heroSection: ReactNode | null;
  setHeroSection: (actions: ReactNode | null) => void;
};

const GeneralHeroContext = createContext<GeneralHeroContextType>({
  heroSection: null,
  setHeroSection: () => { },
});

export function GeneralHeroProvider({ children }: { children: ReactNode }) {
  const [heroSection, setHeroSection] = useState<ReactNode | null>(null);

  return (
    <GeneralHeroContext.Provider value={{ heroSection, setHeroSection }}>
      {children}
    </GeneralHeroContext.Provider>
  );
}

export function useGeneralHero() {
  return useContext(GeneralHeroContext);
}
