import React from 'react';
import { FileText, Globe, Video, StickyNote, Trash2, ToggleRight, ToggleLeft, Plus, BookOpen } from 'lucide-react';

interface Source {
  id: string;
  notebookId: string;
  sourceType: 'pdf' | 'url' | 'youtube' | 'paste';
  title: string;
  isActive: boolean;
  createdAt: string;
}

interface SourcesPanelProps {
  sources: Source[];
  handleDeleteSource: (id: string) => void;
  handleToggleSource: (id: string, currentActive: boolean) => void;
  setIsUploadModalOpen: (val: boolean) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf:     <FileText size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />,
  url:     <Globe size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />,
  youtube: <Video size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />,
  paste:   <StickyNote size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />,
};

const TYPE_LABEL: Record<string, string> = {
  pdf: 'PDF Document', url: 'Web Article', youtube: 'YouTube Video', paste: 'Pasted Text',
};

export default function SourcesPanel({ sources, handleDeleteSource, handleToggleSource, setIsUploadModalOpen }: SourcesPanelProps) {
  const activeSources = sources.filter(s => s.isActive);

  return (
    <aside className="sources-panel">
      {/* Header */}
      <div className="sources-header">
        <span className="sources-header-title">
          <BookOpen size={14} style={{ color: 'var(--green)' }} />
          Knowledge Sources
        </span>
        <span className="sources-count">{activeSources.length}/{sources.length}</span>
      </div>

      {/* Sources list */}
      <div className="sources-list">
        {sources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--stone-400)' }}>
            <BookOpen size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--stone-300)' }} />
            <p style={{ fontSize: '0.8125rem', fontWeight: 500, marginBottom: '0.375rem' }}>No sources added</p>
            <p style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>Add PDFs, articles, or videos to ground the AI tutor in your course material.</p>
          </div>
        ) : (
          sources.map((src) => (
            <div
              key={src.id}
              className={`source-item ${!src.isActive ? 'inactive' : ''}`}
            >
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  {TYPE_ICONS[src.sourceType]}
                  <span className="source-item-title" title={src.title}>{src.title}</span>
                </div>
                <button
                  onClick={() => handleDeleteSource(src.id)}
                  className="source-delete-btn"
                  title="Remove source"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Meta + toggle */}
              <div className="source-item-actions">
                <span className="source-item-type">
                  {TYPE_ICONS[src.sourceType]}
                  {TYPE_LABEL[src.sourceType] || src.sourceType}
                </span>
                <button
                  onClick={() => handleToggleSource(src.id, src.isActive)}
                  className={`source-toggle ${src.isActive ? 'active' : ''}`}
                  title={src.isActive ? 'Disable source' : 'Enable source'}
                >
                  {src.isActive ? (
                    <><ToggleRight size={15} /> Active</>
                  ) : (
                    <><ToggleLeft size={15} /> Off</>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Source Button */}
      <div className="sources-add-btn">
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="btn btn-primary btn-full"
          style={{ fontSize: '0.8125rem' }}
        >
          <Plus size={15} />
          Add Source
        </button>
      </div>
    </aside>
  );
}
