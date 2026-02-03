import { useRef } from 'react';
import Icon from '../common/Icon';

interface PhotoUploadProps {
  onUpload: (file: File) => void;
  isLoading?: boolean;
}

export default function PhotoUpload({ onUpload, isLoading }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={isLoading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="text-primary text-sm font-bold flex items-center gap-1 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-pastel-pink border-t-primary" />
            Uploading...
          </>
        ) : (
          <>
            <Icon name="add_a_photo" size="sm" />
            Add Photo
          </>
        )}
      </button>
    </div>
  );
}
