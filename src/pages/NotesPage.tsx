import React, { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, doc, getDoc, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import NoteCard from '../components/NoteCard';
import toast from 'react-hot-toast';
import { Mail, Send, Inbox } from 'lucide-react';

interface Note {
  id: string;
  writerId: string;
  recipientId: string;
  groupId: string;
  content: string;
  status: string;
  createdAt: Timestamp;
  sentAt?: Timestamp;
  writerName?: string;
  writerPhotoURL?: string;
  writerUniversity?: string;
  recipientName?: string;
  recipientPhotoURL?: string;
}

type Tab = 'received' | 'sent';

const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const [receivedNotes, setReceivedNotes] = useState<Note[]>([]);
  const [sentNotes, setSentNotes] = useState<Note[]>([]);
  const [enriching, setEnriching] = useState(true);
  const [tab, setTab] = useState<Tab>('received');

  const enrichWithProfile = async (note: Note, role: 'writer' | 'recipient'): Promise<Note> => {
    const uid = role === 'writer' ? note.writerId : note.recipientId;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data();
        const name = `${data.firstName} ${data.lastName}`;
        const photoURL = data.photoURL || '';
        const university = data.hostUniversity || data.homeUniversity || '';
        return role === 'writer'
          ? { ...note, writerName: name, writerPhotoURL: photoURL, writerUniversity: university }
          : { ...note, recipientName: name, recipientPhotoURL: photoURL };
      }
    } catch {
      // ignore
    }
    return note;
  };

  useEffect(() => {
    if (!user) return;

    // Subscribe to received notes (sent status only)
    const receivedQ = query(
      collection(db, 'notes'),
      where('recipientId', '==', user.uid),
      where('status', '==', 'sent'),
      orderBy('sentAt', 'desc')
    );

    const unsubReceived = onSnapshot(receivedQ, async (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Note));
      const enriched = await Promise.all(raw.map(n => enrichWithProfile(n, 'writer')));
      setReceivedNotes(enriched);
      setEnriching(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to load notes');
      setEnriching(false);
    });

    // Subscribe to sent notes
    const sentQ = query(
      collection(db, 'notes'),
      where('writerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubSent = onSnapshot(sentQ, async (snap) => {
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Note));
      const enriched = await Promise.all(raw.map(n => enrichWithProfile(n, 'recipient')));
      setSentNotes(enriched);
    });

    return () => {
      unsubReceived();
      unsubSent();
    };
  }, [user]);

  const tabs = [
    { id: 'received' as Tab, label: 'Received', icon: <Inbox size={16} />, count: receivedNotes.length },
    { id: 'sent' as Tab, label: 'Sent', icon: <Send size={16} />, count: sentNotes.length },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Notes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Private messages between you and your Erasmus friends
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-amber-50 dark:bg-slate-800 rounded-2xl p-1 w-fit border border-amber-100 dark:border-slate-700">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-slate-600 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-center font-bold">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {enriching ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-32 animate-pulse border border-amber-100 dark:border-slate-700" />
            ))}
          </div>
        ) : tab === 'received' ? (
          receivedNotes.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500">
              <Mail size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">No notes received yet</p>
              <p className="text-sm">Notes your Erasmus group members write to you will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {receivedNotes.map(note => (
                <NoteCard
                  key={note.id}
                  id={note.id}
                  writerName={note.writerName || 'Someone special'}
                  writerPhotoURL={note.writerPhotoURL}
                  writerUniversity={note.writerUniversity || ''}
                  content={note.content}
                  createdAt={note.sentAt?.toDate?.() ?? note.createdAt?.toDate?.() ?? new Date()}
                  showExport
                />
              ))}
            </div>
          )
        ) : (
          sentNotes.length === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500">
              <Send size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">No notes sent yet</p>
              <p className="text-sm">Go to a group, open a member's card, and write them a note</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {sentNotes.map(note => (
                <div
                  key={note.id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm p-5 ${
                    note.status === 'draft'
                      ? 'border-amber-300 dark:border-amber-700'
                      : 'border-amber-100 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        To: {note.recipientName || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {note.sentAt?.toDate?.()?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) ??
                          note.createdAt?.toDate?.()?.toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      note.status === 'draft'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {note.status === 'draft' ? 'Draft' : 'Sent'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </Layout>
  );
};

export default NotesPage;
