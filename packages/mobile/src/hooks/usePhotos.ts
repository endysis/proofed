import { useMutation, useQuery } from '@tanstack/react-query';
import { photosApi, ImageAsset } from '../api/client';

export function usePhotoUpload() {
  return useMutation({
    mutationFn: async ({
      attemptId,
      image,
    }: {
      attemptId: string;
      image: ImageAsset;
    }) => {
      const fileName = image.fileName || `photo_${Date.now()}.jpg`;
      const contentType = image.type || 'image/jpeg';

      const { uploadUrl, key } = await photosApi.getUploadUrl({
        attemptId,
        fileName,
        contentType,
      });
      await photosApi.upload(uploadUrl, image);
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
