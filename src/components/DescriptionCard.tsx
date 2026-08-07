interface DescriptionCardProps {
  description: string;
  tags: string[];
  onCopy: () => void;
}

export default function DescriptionCard({ description, tags, onCopy }: DescriptionCardProps) {
  return (
    <div className="message message-success description-card">
      <div className="description-header">
        <strong>Description</strong>
        <button type="button" className="copy-button" onClick={onCopy}>
          Copy
        </button>
      </div>
      <pre>{description}</pre>
      {tags.length > 0 && (
        <div className="tags-row">
          <strong>Tags:</strong>
          <div className="tag-list">
            {tags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
