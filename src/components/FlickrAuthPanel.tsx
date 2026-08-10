import type { ChangeEvent } from "react";

interface FlickrAuthPanelProps {
  flickrSid: string | null;
  authenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  saveLoading: boolean;
  saveResult: string | null;
  visibility: "public" | "private";
  onConnect: () => void;
  onCheckAuth: () => void;
  onSave: () => void;
  onVisibilityChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export default function FlickrAuthPanel({
  flickrSid,
  authenticated,
  authLoading,
  authError,
  saveLoading,
  saveResult,
  visibility,
  onConnect,
  onCheckAuth,
  onSave,
  onVisibilityChange,
}: FlickrAuthPanelProps) {
  return (
    <section className="flickr-panel">
      <div className="panel-header">
        <strong>Save to Flickr</strong>
        <span className={`status-badge ${authenticated ? "status-ok" : "status-pending"}`}>
          {authenticated ? "Connected" : "Not connected"}
        </span>
      </div>

      {authError && <div className="message message-error">{authError}</div>}

      {!authenticated ? (
        <>
          <p>Connect your Flickr account to save described images.</p>
          <div className="button-row">
            <button type="button" onClick={onConnect} disabled={authLoading}>
              {authLoading ? "Starting..." : "Connect Flickr"}
            </button>
            <button type="button" onClick={onCheckAuth} disabled={authLoading || !flickrSid}>
              {authLoading ? "Checking..." : "Check status"}
            </button>
          </div>
          {flickrSid && <p className="muted-text">After authorizing on Flickr, click Check status.</p>}
        </>
      ) : (
        <>
          <p>Flickr is connected. Choose visibility and save the current description.</p>
          <div className="flickr-visibility-row">
            <label>
              Visibility:
              <select value={visibility} onChange={onVisibilityChange}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>
          <button type="button" onClick={onSave} disabled={saveLoading}>
            {saveLoading ? "Saving..." : "Save to Flickr"}
          </button>
        </>
      )}

      {saveResult && (
        <div className={`message ${saveResult.toLowerCase().includes("success") ? "message-success" : "message-error"}`}>
          {saveResult}
        </div>
      )}
    </section>
  );
}
