import { type ChangeEvent, type FormEvent } from "react";

interface ImageUploadFormProps {
  previewUrl: string | null;
  loading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function ImageUploadForm({ previewUrl, loading, onFileChange, onSubmit }: ImageUploadFormProps) {
  return (
    <form className="upload-form" onSubmit={onSubmit}>
      <label className="file-label">
        <span>Select image</span>
        <input type="file" accept="image/*" onChange={onFileChange} />
      </label>

      {previewUrl && (
        <div className="preview">
          <img src={previewUrl} alt="Selected preview" />
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Describing..." : "Describe this image"}
      </button>
    </form>
  );
}
