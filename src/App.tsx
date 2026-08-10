import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import AppShell from "./components/AppShell";
import DescriptionCard from "./components/DescriptionCard";
import FlickrAuthPanel from "./components/FlickrAuthPanel";
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
  const [flickrSid, setFlickrSid] = useState<string | null>(null);
  const [flickrAuthenticated, setFlickrAuthenticated] = useState(false);
  const [flickrAuthLoading, setFlickrAuthLoading] = useState(false);
  const [flickrAuthError, setFlickrAuthError] = useState<string | null>(null);
  const [flickrSaveLoading, setFlickrSaveLoading] = useState(false);
  const [flickrSaveResult, setFlickrSaveResult] = useState<string | null>(null);
  const [flickrVisibility, setFlickrVisibility] = useState<"public" | "private">("public");

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

  useEffect(() => {
    const storedSid = window.localStorage.getItem("flickrSid");
    if (storedSid) {
      setFlickrSid(storedSid);
    }
  }, []);

  useEffect(() => {
    if (!flickrSid) {
      setFlickrAuthenticated(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/flickr/status?sid=${encodeURIComponent(flickrSid)}`);
        const data = await response.json();
        if (response.ok) {
          setFlickrAuthenticated(Boolean((data as any)?.authenticated));
        }
      } catch {
        setFlickrAuthenticated(false);
      }
    };

    checkStatus();
  }, [flickrSid]);

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

  const startFlickrAuth = async () => {
    setFlickrAuthError(null);
    setFlickrAuthLoading(true);
    setFlickrSaveResult(null);

    try {
      const response = await fetch("/api/flickr/start");
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any)?.error ?? "Failed to start Flickr auth.");
      }

      const { authorizeUrl, sid } = data as { authorizeUrl: string; sid: string };
      window.localStorage.setItem("flickrSid", sid);
      setFlickrSid(sid);
      window.open(authorizeUrl, "_blank", "noopener,noreferrer");
    } catch (fetchError) {
      setFlickrAuthError(fetchError instanceof Error ? fetchError.message : "Unable to start Flickr auth.");
    } finally {
      setFlickrAuthLoading(false);
    }
  };

  const checkFlickrAuth = async () => {
    if (!flickrSid) {
      setFlickrAuthError("No Flickr session found. Connect first.");
      return;
    }

    setFlickrAuthError(null);
    setFlickrAuthLoading(true);

    try {
      const response = await fetch(`/api/flickr/status?sid=${encodeURIComponent(flickrSid)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any)?.error ?? "Failed to check Flickr auth.");
      }

      setFlickrAuthenticated(Boolean((data as any)?.authenticated));
    } catch (fetchError) {
      setFlickrAuthError(fetchError instanceof Error ? fetchError.message : "Unable to check Flickr auth.");
    } finally {
      setFlickrAuthLoading(false);
    }
  };

  const saveToFlickr = async () => {
    setFlickrSaveResult(null);
    setFlickrAuthError(null);

    if (!flickrSid) {
      setFlickrAuthError("No Flickr session found. Connect first.");
      return;
    }

    if (!description || !imageDataUrl) {
      setFlickrSaveResult("No description or image available to save.");
      return;
    }

    setFlickrSaveLoading(true);

    try {
      const response = await fetch("/api/save-to-flickr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageDataUrl,
          description,
          tags,
          visibility: flickrVisibility,
          sid: flickrSid,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data as any)?.error ?? "Failed to save image to Flickr.");
      }

      setFlickrSaveResult("Saved to Flickr successfully.");
    } catch (fetchError) {
      setFlickrSaveResult(fetchError instanceof Error ? fetchError.message : "Unable to save to Flickr.");
    } finally {
      setFlickrSaveLoading(false);
    }
  };

  const handleVisibilityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFlickrVisibility(event.target.value === "private" ? "private" : "public");
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
      {description && (
        <>
          <DescriptionCard description={description} tags={tags} onCopy={handleCopyDescription} />
          <FlickrAuthPanel
            flickrSid={flickrSid}
            authenticated={flickrAuthenticated}
            authLoading={flickrAuthLoading}
            authError={flickrAuthError}
            saveLoading={flickrSaveLoading}
            saveResult={flickrSaveResult}
            visibility={flickrVisibility}
            onConnect={startFlickrAuth}
            onCheckAuth={checkFlickrAuth}
            onSave={saveToFlickr}
            onVisibilityChange={handleVisibilityChange}
          />
        </>
      )}
      {copyStatus && <ToastMessage message={copyStatus} />}
    </AppShell>
  );
}

export default App;
