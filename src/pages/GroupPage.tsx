import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ExperienceWall from '../components/ExperienceWall';
import MemberCard from '../components/MemberCard';
import Modal from '../components/Modal';
import NoteEditor from '../components/NoteEditor';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Newspaper, Copy } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  photoURL: string;
  code: string;
  members: string[];
  memberCount: number;
}

interface MemberProfile {
  uid: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  hostUniversity: string;
  homeUniversity: string;
  nationality: string;
}

type Tab = 'wall' | 'members';

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [tab, setTab] = useState<Tab>('wall');
  const [loading, setLoading] = useState(true);

  const [noteRecipient, setNoteRecipient] = useState<MemberProfile | null>(null);

  useEffect(() => {
    if (!groupId) return;
    const load = async () => {
      setLoading(true);
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (!groupDoc.exists()) {
          toast.error('Group not found');
          navigate('/dashboard');
          return;
        }
        const groupData = { id: groupDoc.id, ...groupDoc.data() } as Group;
        setGroup(groupData);

        // Fetch member profiles
        const memberProfiles: MemberProfile[] = [];
        for (const uid of groupData.members || []) {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              memberProfiles.push({ uid, ...userDoc.data() } as MemberProfile);
            }
          } catch {
            // skip member if fetch fails
          }
        }
        setMembers(memberProfiles);
      } catch {
        toast.error('Failed to load group');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId, navigate]);

  const copyCode = () => {
    if (group?.code) {
      navigator.clipboard.writeText(group.code);
      toast.success('Code copied!');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-amber-100 dark:bg-slate-700 rounded-2xl" />
          <div className="h-8 bg-amber-100 dark:bg-slate-700 rounded-xl w-1/3" />
        </div>
      </Layout>
    );
  }

  if (!group) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Group header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="h-40 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-slate-600 dark:to-slate-700 overflow-hidden">
            {group.photoURL ? (
              <img src={group.photoURL} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">✈️</div>
            )}
          </div>
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{group.name}</h1>
              {group.description && (
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{group.description}</p>
              )}
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{members.length} members</p>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-slate-700 border border-amber-200 dark:border-slate-600 text-amber-700 dark:text-amber-300 text-sm font-mono hover:bg-amber-100 dark:hover:bg-slate-600 transition-colors self-start sm:self-auto"
            >
              <span className="text-base font-bold tracking-widest">{group.code}</span>
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-amber-50 dark:bg-slate-800 rounded-2xl p-1 w-fit border border-amber-100 dark:border-slate-700">
          <button
            onClick={() => setTab('wall')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === 'wall'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Newspaper size={16} />
            Experience Wall
          </button>
          <button
            onClick={() => setTab('members')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === 'members'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Users size={16} />
            Group Members
          </button>
        </div>

        {/* Tab content */}
        {tab === 'wall' && groupId && <ExperienceWall groupId={groupId} />}

        {tab === 'members' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {members.map(member => (
              <MemberCard
                key={member.uid}
                uid={member.uid}
                firstName={member.firstName}
                lastName={member.lastName}
                photoURL={member.photoURL}
                university={member.hostUniversity || member.homeUniversity}
                nationality={member.nationality}
                onWriteNote={() => setNoteRecipient(member)}
                isCurrentUser={member.uid === user?.uid}
              />
            ))}
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      <Modal
        isOpen={!!noteRecipient}
        onClose={() => setNoteRecipient(null)}
        title={`Write a Note to ${noteRecipient?.firstName || ''}`}
        maxWidth="max-w-xl"
      >
        {noteRecipient && groupId && (
          <NoteEditor
            recipientId={noteRecipient.uid}
            recipientName={`${noteRecipient.firstName} ${noteRecipient.lastName}`}
            groupId={groupId}
            onClose={() => setNoteRecipient(null)}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default GroupPage;
