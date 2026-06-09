import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, serverTimestamp, doc, setDoc, query,
  where, getDocs, updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useAutosave } from '../hooks/useAutosave';
import { useBeforeUnload } from '../hooks/useBeforeUnload';
import Modal from './Modal';
import toast from 'react-hot-toast';
import { Send, Save, Eye, FileEdit } from 'lucide-react';

interface NoteEditorProps {
  recipientId: string;
  recipientName: string;
  groupId: string;
  onClose: () => void;
}

const MAX_CHARS = 2000;

const NoteEditor: React.FC<NoteEditorProps> = ({
  recipientId,
  recipientName,
  groupId,
  onClose,
}) => {
  const { user, userProfile } = useAuth();
  const draftKey = `draft_${user?.uid}_${recipientId}_${groupId}`;
  const { clearDraft, getDraft } = useAutosave(draftKey, '');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Load existing local draft on mount
  useEffect(() => {
    const draft = getDraft();
    if (draft) {
      setContent(draft);
      setHasChanges(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5-second autosave to localStorage
  useEffect(() => {
    if (!content) return;
    const timer = setInterval(() => {
      localStorage.setItem(draftKey, content);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 5000);
    return () => clearInterval(timer);
  }, [content, draftKey]);

  useBeforeUnload(hasChanges);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
    setAutoSaveStatus('idle');
  };

  const handleSaveDraft = async () => {
    if (!content.trim() || !user) return;
    setSaving(true);
    try {
      if (draftId) {
        await updateDoc(doc(db, 'notes', draftId), {
          content,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, 'notes'), {
          writerId: user.uid,
          recipientId,
          groupId,
          content,
          status: 'draft',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setDraftId(docRef.id);
      }
      toast.success('Draft saved!');
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!content.trim() || !user || !userProfile) return;
    setSending(true);
    try {
      let noteId: string;

      if (draftId) {
        // Promote existing draft to sent
        await updateDoc(doc(db, 'notes', draftId), {
          status: 'sent',
          sentAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        noteId = draftId;
      } else {
        // Check for existing draft for this pair
        const existingQ = query(
          collection(db, 'notes'),
          where('writerId', '==', user.uid),
          where('recipientId', '==', recipientId),
          where('groupId', '==', groupId),
          where('status', '==', 'draft')
        );
        const existingSnap = await getDocs(existingQ);
        if (!existingSnap.empty) {
          const existingDoc = existingSnap.docs[0];
          await updateDoc(doc(db, 'notes', existingDoc.id), {
            content,
            status: 'sent',
            sentAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          noteId = existingDoc.id;
        } else {
          const docRef = await addDoc(collection(db, 'notes'), {
            writerId: user.uid,
            recipientId,
            groupId,
            content,
            status: 'sent',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            sentAt: serverTimestamp(),
          });
          noteId = docRef.id;
        }
      }

      // Create in-app notification for recipient
      await addDoc(collection(db, 'notifications'), {
        recipientId,
        senderId: user.uid,
        senderName: `${userProfile.firstName} ${userProfile.lastName}`,
        senderPhotoURL: userProfile.photoURL || '',
        noteId,
        groupId,
        message: `${userProfile.firstName} ${userProfile.lastName} sent you a personal note`,
        read: false,
        createdAt: serverTimestamp(),
      });

      clearDraft();
      setHasChanges(false);
      toast.success('Note sent! 🎉');
      onClose();
    } catch (err) {
      console.error(err);
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
          Writing a private note to{' '}
          <span className="font-semibold text-amber-600 dark:text-amber-400">{recipientName}</span>
        </p>
        <textarea
          value={content}
          onChange={handleChange}
          placeholder={`Write something meaningful for ${recipientName}...`}
          maxLength={MAX_CHARS}
          rows={8}
          className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 resize-none transition-colors"
        />
        <div className="flex justify-between text-xs mt-1">
          <span className={`transition-colors ${autoSaveStatus === 'saved' ? 'text-green-500' : 'text-slate-400 dark:text-slate-500'}`}>
            {autoSaveStatus === 'saved' ? '✓ Auto-saved' : 'Auto-saves every 5s'}
          </span>
          <span className={content.length > MAX_CHARS * 0.9 ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500'}>
            {content.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSaveDraft}
          disabled={!content.trim() || saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 dark:border-slate-600 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? <FileEdit size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Draft'}
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

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Review Your Note">
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-slate-700 rounded-xl p-5 border border-amber-100 dark:border-slate-600">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
              To: <span className="font-semibold text-amber-600 dark:text-amber-400">{recipientName}</span>
            </p>
            <p className="text-slate-800 dark:text-white whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <span className="text-blue-500 text-sm mt-0.5">🔒</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Once sent, this note is <strong>strictly private</strong>. Only you and {recipientName} can ever read it.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
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
