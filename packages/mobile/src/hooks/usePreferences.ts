// Re-export context hook
export { usePreferences } from '../contexts/PreferencesContext';

// Convenience hooks for specific preferences
import { usePreferences as usePreferencesContext } from '../contexts/PreferencesContext';

export function useTemperatureUnit(): 'F' | 'C' {
  const { temperatureUnit } = usePreferencesContext();
  return temperatureUnit;
}

// Future convenience hooks:
// export function useLanguage(): string {
//   const { preferences } = usePreferencesContext();
//   return preferences?.language ?? 'en';
// }

// export function useMeasurementSystem(): 'metric' | 'imperial' {
//   const { preferences } = usePreferencesContext();
//   return preferences?.measurementSystem ?? 'imperial';
// }
