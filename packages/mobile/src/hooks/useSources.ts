import { useQuery } from '@tanstack/react-query';
import { sourcesApi } from '../api/client';

export function useCustomSources() {
  return useQuery({
    queryKey: ['customSources'],
    queryFn: sourcesApi.listCustom,
  });
}
