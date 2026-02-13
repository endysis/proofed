import { useMutation, useQuery } from '@tanstack/react-query';
import * as ImageManipulator from 'expo-image-manipulator';
import { photosApi, ImageAsset } from '../api/client';

const MAX_DIMENSION = 1440;
const COMPRESSION_QUALITY = 0.7;

async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export function usePhotoUpload() {
  return useMutation({
    mutationFn: async ({
      attemptId,
      image,
    }: {
      attemptId: string;
      image: ImageAsset;
    }) => {
      const compressedUri = await compressImage(image.uri);

      const fileName = image.fileName || `photo_${Date.now()}.jpg`;
      const contentType = 'image/jpeg';

      const { uploadUrl, key } = await photosApi.getUploadUrl({
        attemptId,
        fileName,
        contentType,
      });
      await photosApi.upload(uploadUrl, {
        uri: compressedUri,
        type: 'image/jpeg',
        fileName,
      });
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
