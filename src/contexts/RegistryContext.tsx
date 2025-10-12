import { createContext, useContext } from 'react';
import { BlueprintRegistry } from '../core/BlueprintRegistry';

export const RegistryContext = createContext<BlueprintRegistry | null>(null);

export const useRegistry = () => {
  const registry = useContext(RegistryContext);
  if (!registry) {
    throw new Error('useRegistry must be used within RegistryContext.Provider');
  }
  return registry;
};
