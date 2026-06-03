import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import GroupCard from '../components/GroupCard';
import Modal from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';
import { Plus, LogIn, Search } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  photoURL: string;
  memberCount: number;
  code: string;
  members: string[];
}

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const DashboardPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupPhotoFile, setGroupPhotoFile] = useState<File | null>(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState('');
  const [creating, setCreating] = useState(false);

  // Join modal
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'groups'), where('members', 'array-contains', user.uid));
      const snap = await getDocs(q);
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as Group)));
    } catch {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !user) return;
    setCreating(true);
    try {
      let photoURL = '';
      if (groupPhotoFile) {
        const id = Date.now().toString();
        const storageRef = ref(storage, `groups/${id}`);
        await uploadBytes(storageRef, groupPhotoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      const code = generateCode();
      await addDoc(collection(db, 'groups'), {
        name: groupName.trim(),
        description: groupDesc.trim(),
        photoURL,
        code,
        members: [user.uid],
        memberCount: 1,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      toast.success(`Group created! Share code: ${code}`);
      setShowCreate(false);
      setGroupName('');
      setGroupDesc('');
      setGroupPhotoFile(null);
      setGroupPhotoPreview('');
      fetchGroups();
    } catch {
      toast.error('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !user) return;
    setJoining(true);
    try {
      const q = query(collection(db, 'groups'), where('code', '==', joinCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error('No group found with that code');
        return;
      }
      const groupDoc = snap.docs[0];
      const groupData = groupDoc.data() as Group;
      if (groupData.members?.includes(user.uid)) {
        toast('You are already in this group!', { icon: 'ℹ️' });
        setShowJoin(false);
        return;
      }
      await updateDoc(doc(db, 'groups', groupDoc.id), {
        members: arrayUnion(user.uid),
        memberCount: (groupData.memberCount || 0) + 1,
      });
      toast.success(`Joined "${groupData.name}"!`);
      setShowJoin(false);
      setJoinCode('');
      fetchGroups();
    } catch {
      toast.error('Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Welcome back, {userProfile?.firstName || 'Erasmus student'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Your Erasmus memory groups</p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-4 p-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Plus size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">Create Group</p>
              <p className="text-amber-100 text-sm">Start a new memory capsule</p>
            </div>
          </button>

          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-4 p-6 bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-700 dark:to-slate-900 rounded-2xl text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <LogIn size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">Join Group</p>
              <p className="text-slate-300 text-sm">Enter a 6-character code</p>
            </div>
          </button>
        </div>

        {/* Groups grid */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Your Groups</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl h-48 animate-pulse border border-amber-100 dark:border-slate-700" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <p className="text-5xl mb-4">✈️</p>
              <p className="text-lg font-medium">No groups yet</p>
              <p className="text-sm">Create or join a group to start capturing memories</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map(g => (
                <GroupCard
                  key={g.id}
                  id={g.id}
                  name={g.name}
                  description={g.description}
                  photoURL={g.photoURL}
                  memberCount={g.memberCount}
                  code={g.code}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create a Group">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div className="flex justify-center">
            <ImageUpload
              currentImage={groupPhotoPreview}
              onImageSelected={(file, url) => { setGroupPhotoFile(file); setGroupPhotoPreview(url); }}
              shape="square"
              size="md"
              label="Add Group Photo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Name *</label>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
              placeholder="Erasmus Barcelona 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={groupDesc}
              onChange={e => setGroupDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm resize-none"
              placeholder="A group for our Erasmus memories..."
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            A unique 6-character code will be generated for others to join.
          </p>
          <button
            type="submit"
            disabled={creating || !groupName.trim()}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </Modal>

      {/* Join Group Modal */}
      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Join a Group">
        <form onSubmit={handleJoinGroup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Code</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-mono tracking-widest"
                placeholder="ABC123"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={joining || joinCode.length !== 6}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join Group'}
          </button>
        </form>
      </Modal>
    </Layout>
  );
};

export default DashboardPage;
