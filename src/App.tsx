import { useState, type ChangeEvent, type FormEvent } from "react";

interface DescribeResponse {
  description: string;
}

function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
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
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Image Describer</h1>
        <p>Upload an image and receive a detailed full-format description.</p>
      </header>

      <main>
        <form className="upload-form" onSubmit={handleSubmit}>
          <label className="file-label">
            <span>Select image</span>
            <input type="file" accept="image/*" onChange={handleFileChange} />
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

        {error && <div className="message message-error">{error}</div>}
        {description && (
          <div className="message message-success description-card">
            <div className="description-header">
              <strong>Description</strong>
              <button type="button" className="copy-button" onClick={handleCopyDescription}>
                Copy
              </button>
            </div>
            <pre>{description}</pre>
          </div>
        )}
        {copyStatus && <div className="toast">{copyStatus}</div>}
      </main>
    </div>
  );
}

export default App;
