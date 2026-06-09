import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, updateDoc, deleteDoc, collection, query,
  where, getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ExperienceWall from '../components/ExperienceWall';
import MemberCard from '../components/MemberCard';
import Modal from '../components/Modal';
import NoteEditor from '../components/NoteEditor';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Newspaper, Copy, Settings, Trash2, Edit2, Save, X } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  photoURL: string;
  code: string;
  members: string[];
  memberCount: number;
  createdBy: string;
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

  // Edit group state
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.uid === group?.createdBy;

  const loadGroup = async () => {
    if (!groupId) return;
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

      const memberProfiles: MemberProfile[] = [];
      for (const uid of groupData.members || []) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            memberProfiles.push({ uid, ...userDoc.data() } as MemberProfile);
          }
        } catch {
          // skip
        }
      }
      setMembers(memberProfiles);
    } catch {
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const copyCode = () => {
    if (group?.code) {
      navigator.clipboard.writeText(group.code);
      toast.success('Code copied!');
    }
  };

  const openEdit = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description || '');
    setEditPhotoPreview(group.photoURL || '');
    setEditPhotoFile(null);
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!group || !editName.trim()) return;
    setSaving(true);
    try {
      let photoURL = group.photoURL || '';

      if (editPhotoFile) {
        const storageRef = ref(storage, `groups/${group.id}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, editPhotoFile, {
          contentType: editPhotoFile.type || 'image/jpeg',
        });
        photoURL = await getDownloadURL(snapshot.ref);
      }

      await updateDoc(doc(db, 'groups', group.id), {
        name: editName.trim(),
        description: editDesc.trim(),
        photoURL,
      });

      toast.success('Group updated!');
      setShowEdit(false);
      setEditPhotoFile(null);
      await loadGroup();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    setDeleting(true);
    try {
      // Remove all group notes
      const notesQ = query(collection(db, 'notes'), where('groupId', '==', group.id));
      const notesSnap = await getDocs(notesQ);
      await Promise.all(notesSnap.docs.map(d => deleteDoc(d.ref)));

      // Remove group photo from storage if it exists
      if (group.photoURL) {
        try {
          const photoRef = ref(storage, group.photoURL);
          await deleteObject(photoRef);
        } catch {
          // ignore storage cleanup errors
        }
      }

      await deleteDoc(doc(db, 'groups', group.id));
      toast.success('Group deleted');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete group');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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
          <div className="h-44 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-slate-600 dark:to-slate-700 overflow-hidden relative">
            {group.photoURL ? (
              <img
                src={group.photoURL}
                alt={group.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-full h-full items-center justify-center text-6xl absolute inset-0"
              style={{ display: group.photoURL ? 'none' : 'flex' }}
            >
              ✈️
            </div>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{group.name}</h1>
              {group.description && (
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{group.description}</p>
              )}
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{members.length} members</p>
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-slate-700 border border-amber-200 dark:border-slate-600 text-amber-700 dark:text-amber-300 text-sm font-mono hover:bg-amber-100 dark:hover:bg-slate-600 transition-colors"
              >
                <span className="text-base font-bold tracking-widest">{group.code}</span>
                <Copy size={14} />
              </button>

              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    onClick={openEdit}
                    className="p-2 rounded-xl bg-amber-50 dark:bg-slate-700 border border-amber-200 dark:border-slate-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-slate-600 transition-colors"
                    title="Edit group"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    title="Delete group"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
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

      {/* Edit Group Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Group">
        <div className="space-y-4">
          <div className="flex justify-center">
            <ImageUpload
              currentImage={editPhotoPreview}
              onImageSelected={(file, url) => {
                setEditPhotoFile(file);
                setEditPhotoPreview(url);
              }}
              shape="square"
              size="md"
              label="Change Group Photo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Group Name *
            </label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving || !editName.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to permanently delete "${group?.name}"? This will remove all posts and notes. This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Group'}
        cancelLabel="Keep Group"
        destructive
        onConfirm={handleDeleteGroup}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Settings icon for mobile — only shown if admin */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <button
            onClick={openEdit}
            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      )}
    </Layout>
  );
};

export default GroupPage;
