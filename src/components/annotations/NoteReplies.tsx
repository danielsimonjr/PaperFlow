import { useState, useRef } from 'react';
import { Reply, Trash2 } from 'lucide-react';
import { useAnnotationStore } from '@stores/annotationStore';
import type { Annotation, AnnotationReply } from '@/types';

interface NoteRepliesProps {
  annotation: Annotation;
  onUpdate: (updates: Partial<Annotation>) => void;
}

/**
 * Replies section for sticky notes.
 * Displays nested replies and allows adding new ones.
 */
export function NoteReplies({ annotation, onUpdate }: NoteRepliesProps) {
  const [isAddingReply, setIsAddingReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addReply = useAnnotationStore((state) => state.addReply);

  const replies = annotation.replies || [];

  const handleAddReply = () => {
    if (replyText.trim()) {
      addReply(annotation.id, replyText.trim(), 'User');
      setReplyText('');
      setIsAddingReply(false);
    }
  };

  const handleDeleteReply = (replyId: string) => {
    const updatedReplies = replies.filter((r) => r.id !== replyId);
    onUpdate({ replies: updatedReplies });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border-t border-black/10">
      {/* Existing Replies */}
      {replies.length > 0 && (
        <div className="max-h-40 overflow-y-auto">
          {replies.map((reply: AnnotationReply) => (
            <div
              key={reply.id}
              className="border-b border-black/5 px-3 py-2 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {reply.author}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatDate(reply.createdAt)}
                  </span>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReply(reply.id);
                    }}
                    title="Delete reply"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-600">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Reply Button / Input */}
      <div className="px-3 py-2">
        {isAddingReply ? (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 rounded border border-black/10 bg-white/50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Type a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  handleAddReply();
                }
                if (e.key === 'Escape') {
                  setIsAddingReply(false);
                  setReplyText('');
                }
              }}
              autoFocus
            />
            <button
              className="rounded bg-primary-500 px-2 py-1 text-xs text-white hover:bg-primary-600"
              onClick={handleAddReply}
            >
              Add
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingReply(true);
            }}
          >
            <Reply size={12} />
            Reply
          </button>
        )}
      </div>
    </div>
  );
}
