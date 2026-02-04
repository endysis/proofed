import { useMutation, useQuery } from '@tanstack/react-query';
import { photosApi } from '../api/client';

export function usePhotoUpload() {
  return useMutation({
    mutationFn: async ({
      attemptId,
      file,
    }: {
      attemptId: string;
      file: File;
    }) => {
      const { uploadUrl, key } = await photosApi.getUploadUrl({
        attemptId,
        fileName: file.name,
        contentType: file.type,
      });
      await photosApi.upload(uploadUrl, file);
      return key;
    },
  });
}

export function usePhotoUrl(key: string | undefined) {
  return useQuery({
    queryKey: ['photo', key],
    queryFn: async () => {
      if (!key) return null;
      const { downloadUrl } = await photosApi.getDownloadUrl({ key });
      return downloadUrl;
    },
    enabled: !!key,
    staleTime: 1000 * 60 * 30, // URLs valid for 30 min (actual is 1 hour, buffer for safety)
  });
}
