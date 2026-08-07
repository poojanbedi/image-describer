import { useState, type ChangeEvent, type FormEvent } from "react";
import AppShell from "./components/AppShell";
import DescriptionCard from "./components/DescriptionCard";
import ImageUploadForm from "./components/ImageUploadForm";
import ToastMessage from "./components/ToastMessage";

interface DescribeResponse {
  description: string;
  tags: string[];
}

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setDescription("");
    const file = event.target.files?.[0] ?? null;

    const supportedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
      "image/svg+xml"
    ];

    if (!file) {
      setImageFile(null);
      setPreviewUrl(null);
      setImageDataUrl(null);
      setTags([]);
      return;
    }

    if (!supportedTypes.includes(file.type)) {
      setError("Please select a browser-renderable image: JPEG, PNG, WebP, GIF, BMP, or SVG.");
      setImageFile(null);
      setPreviewUrl(null);
      setImageDataUrl(null);
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageDataUrl(null);
    }
  };

  const handleCopyDescription = async () => {
    if (!description) {
      return;
    }

    try {
      await navigator.clipboard.writeText(description);
      setCopyStatus("Copied!");
      window.setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus("Copy failed. Try again.");
      window.setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setDescription("");
    setTags([]);
    setCopyStatus(null);

    if (!imageFile) {
      setError("Please choose an image before submitting.");
      return;
    }

    if (!imageDataUrl) {
      setError("Image not ready. Try again.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/describe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      const result: DescribeResponse = await response.json();

      if (!response.ok) {
        throw new Error((result as any)?.error ?? "Server error while describing image.");
      }

      setDescription(result.description);
      setTags(result.tags ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <ImageUploadForm previewUrl={previewUrl} loading={loading} onFileChange={handleFileChange} onSubmit={handleSubmit} />

      {error && <div className="message message-error">{error}</div>}
      {description && <DescriptionCard description={description} tags={tags} onCopy={handleCopyDescription} />}
      {copyStatus && <ToastMessage message={copyStatus} />}
    </AppShell>
  );
}

export default App;
