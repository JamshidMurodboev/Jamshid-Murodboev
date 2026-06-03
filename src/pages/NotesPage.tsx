import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import NoteCard from '../components/NoteCard';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

interface Note {
  id: string;
  writerId: string;
  recipientId: string;
  groupId: string;
  content: string;
  createdAt: Timestamp;
  isRead: boolean;
  writerName?: string;
  writerPhotoURL?: string;
  writerUniversity?: string;
}

const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'notes'),
          where('recipientId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const rawNotes = snap.docs.map(d => ({ id: d.id, ...d.data() } as Note));

        // Enrich with writer info
        const enriched = await Promise.all(
          rawNotes.map(async (note) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', note.writerId));
              if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                  ...note,
                  writerName: `${data.firstName} ${data.lastName}`,
                  writerPhotoURL: data.photoURL,
                  writerUniversity: data.hostUniversity || data.homeUniversity,
                };
              }
            } catch {
              // ignore
            }
            return note;
          })
        );
        setNotes(enriched);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load notes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Notes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Heartfelt messages written to you</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-32 animate-pulse border border-amber-100 dark:border-slate-700" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            <Mail size={48} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No notes yet</p>
            <p className="text-sm">Notes written to you by your Erasmus group members will appear here</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {notes.map(note => (
              <NoteCard
                key={note.id}
                id={note.id}
                writerName={note.writerName || 'Anonymous'}
                writerPhotoURL={note.writerPhotoURL}
                writerUniversity={note.writerUniversity || ''}
                content={note.content}
                createdAt={note.createdAt?.toDate?.() ?? new Date()}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotesPage;
