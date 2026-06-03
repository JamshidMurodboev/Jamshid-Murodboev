import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useAutosave } from '../hooks/useAutosave';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import Modal from './Modal';
import toast from 'react-hot-toast';
import { Send, Save, Eye } from 'lucide-react';

interface NoteEditorProps {
  recipientId: string;
  recipientName: string;
  groupId: string;
  onClose: () => void;
}

const MAX_CHARS = 2000;

const NoteEditor: React.FC<NoteEditorProps> = ({ recipientId, recipientName, groupId, onClose }) => {
  const { user } = useAuth();
  const draftKey = `draft_${user?.uid}_${recipientId}`;
  const { clearDraft, getDraft } = useAutosave(draftKey, '');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const draft = getDraft();
    if (draft) setContent(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave every 5 seconds
  useEffect(() => {
    if (!content) return;
    const timer = setInterval(() => {
      localStorage.setItem(draftKey, content);
    }, 5000);
    return () => clearInterval(timer);
  }, [content, draftKey]);

  useBeforeUnload(hasChanges);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleSaveDraft = async () => {
    if (!content.trim() || !user) return;
    try {
      await setDoc(doc(collection(db, 'drafts')), {
        writerId: user.uid,
        recipientId,
        groupId,
        content,
        updatedAt: serverTimestamp(),
      });
      toast.success('Draft saved!');
    } catch {
      toast.error('Failed to save draft');
    }
  };

  const handleSend = async () => {
    if (!content.trim() || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'notes'), {
        writerId: user.uid,
        recipientId,
        groupId,
        content,
        createdAt: serverTimestamp(),
        isRead: false,
        // Firestore security rules should restrict: writer or recipient can read/write
        // writer: request.auth.uid == resource.data.writerId
        // recipient: request.auth.uid == resource.data.recipientId
      });

      // TODO: Trigger email notification via Firebase callable function
      // Example: const sendNotification = httpsCallable(functions, 'sendNoteNotification');
      // await sendNotification({ recipientId, writerId: user.uid });
      console.log('[Stub] Email notification would be sent to recipient:', recipientId);

      clearDraft();
      setHasChanges(false);
      toast.success('Note sent successfully! 🎉');
      onClose();
    } catch {
      toast.error('Failed to send note');
    } finally {
      setSending(false);
      setShowPreview(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          Writing a private note to <span className="font-semibold text-amber-600 dark:text-amber-400">{recipientName}</span>
        </p>
        <textarea
          value={content}
          onChange={handleChange}
          placeholder={`Write something meaningful for ${recipientName}...`}
          maxLength={MAX_CHARS}
          rows={8}
          className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 resize-none transition-colors"
        />
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
          <span>Auto-saved to browser every 5s</span>
          <span className={content.length > MAX_CHARS * 0.9 ? 'text-orange-500' : ''}>
            {content.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSaveDraft}
          disabled={!content.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 dark:border-slate-600 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          Save Draft
        </button>
        <button
          onClick={() => setShowPreview(true)}
          disabled={!content.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 dark:bg-slate-700 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-slate-600 text-sm font-medium transition-colors disabled:opacity-50 ml-auto"
        >
          <Eye size={14} />
          Review & Confirm
        </button>
      </div>

      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Preview Your Note"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">To: <span className="font-semibold">{recipientName}</span></p>
            <p className="text-slate-800 dark:text-white whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Once sent, this note will be private and only visible to you and {recipientName}.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(false)}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {sending ? 'Sending...' : 'Confirm & Send'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoteEditor;
