import { useMutation } from '@tanstack/react-query';
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
