import type { ChangeEvent } from "react";

interface FlickrAuthPanelProps {
  flickrSid: string | null;
  authenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  saveLoading: boolean;
  saveResult: string | null;
  visibility: "public" | "private";
  publishTarget: "flickr" | "instagram";
  instagramFormat: "portrait" | "square" | "landscape";
  instagramConnected: boolean;
  instagramAuthLoading: boolean;
  instagramAuthError: string | null;
  onConnect: () => void;
  onCheckAuth: () => void;
  onSave: () => void;
  onVisibilityChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onPublishTargetChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onInstagramFormatChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onConnectInstagram: () => void;
}

export default function FlickrAuthPanel({
  flickrSid,
  authenticated,
  authLoading,
  authError,
  saveLoading,
  saveResult,
  visibility,
  publishTarget,
  instagramFormat,
  instagramConnected,
  instagramAuthLoading,
  instagramAuthError,
  onConnect,
  onCheckAuth,
  onSave,
  onVisibilityChange,
  onPublishTargetChange,
  onInstagramFormatChange,
  onConnectInstagram,
}: FlickrAuthPanelProps) {
  return (
    <section className="flickr-panel">
      <div className="panel-header">
        <strong>Publish options</strong>
        <span className={`status-badge ${authenticated ? "status-ok" : "status-pending"}`}>
          {authenticated ? "Connected" : "Not connected"}
        </span>
      </div>

      {authError && <div className="message message-error">{authError}</div>}
      {instagramAuthError && <div className="message message-error">{instagramAuthError}</div>}

      <div className="flickr-visibility-row">
        <label>
          Publish target:
          <select value={publishTarget} onChange={onPublishTargetChange}>
            <option value="flickr">Flickr</option>
            <option value="instagram">Instagram</option>
          </select>
        </label>
      </div>

      {publishTarget === "instagram" ? (
        <div className="flickr-visibility-row">
          <label>
            Instagram format:
            <select value={instagramFormat} onChange={onInstagramFormatChange}>
              <option value="portrait">Portrait 4:5</option>
              <option value="square">Square</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
        </div>
      ) : null}

      {publishTarget === "instagram" && !instagramConnected ? (
        <div className="button-row">
          <button type="button" onClick={onConnectInstagram} disabled={instagramAuthLoading}>
            {instagramAuthLoading ? "Connecting..." : "Connect Instagram"}
          </button>
        </div>
      ) : null}

      {!authenticated && publishTarget === "flickr" ? (
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
          {publishTarget === "flickr" && (
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
            </>
          )}
          {publishTarget === "instagram" && instagramConnected && (
            <p>Instagram-ready image will be resized and prepared before publishing.</p>
          )}
          {publishTarget === "instagram" && instagramConnected ? (
            <button type="button" onClick={onSave} disabled={saveLoading}>
              {saveLoading ? "Publishing..." : "Publish to Instagram"}
            </button>
          ) : publishTarget === "flickr" ? (
            <button type="button" onClick={onSave} disabled={saveLoading}>
              {saveLoading ? "Preparing..." : "Save to Flickr"}
            </button>
          ) : null}
        </>
      )}

      {saveResult && (
        <div className={`message ${saveResult.toLowerCase().includes("success") || saveResult.toLowerCase().includes("ready") ? "message-success" : "message-error"}`}>
          {saveResult}
        </div>
      )}
    </section>
  );
}
