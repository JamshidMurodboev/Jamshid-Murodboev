import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  authorUniversity: string;
  content: string;
  createdAt: Timestamp;
}

interface ExperienceWallProps {
  groupId: string;
}

const MAX_POST_CHARS = 1000;

const ExperienceWall: React.FC<ExperienceWallProps> = ({ groupId }) => {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'groups', groupId, 'posts'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });
    return unsub;
  }, [groupId]);

  const handlePost = async () => {
    if (!newPost.trim() || !user || !userProfile) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'groups', groupId, 'posts'), {
        authorId: user.uid,
        authorName: `${userProfile.firstName} ${userProfile.lastName}`,
        authorPhotoURL: userProfile.photoURL || '',
        authorUniversity: userProfile.hostUniversity || userProfile.homeUniversity || '',
        content: newPost.trim(),
        createdAt: serverTimestamp(),
      });
      setNewPost('');
      toast.success('Posted!');
    } catch {
      toast.error('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compose */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 p-4 shadow-sm">
        <textarea
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          placeholder="Share your Erasmus reflection..."
          maxLength={MAX_POST_CHARS}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-amber-50 dark:bg-slate-700 border border-amber-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-sm"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">{newPost.length}/{MAX_POST_CHARS}</span>
          <button
            onClick={handlePost}
            disabled={!newPost.trim() || posting}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <Send size={14} />
            {posting ? 'Posting...' : 'Share'}
          </button>
        </div>
      </div>

      {/* Posts feed */}
      {posts.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-lg mb-1">No reflections yet</p>
          <p className="text-sm">Be the first to share your Erasmus experience!</p>
        </div>
      )}
      {posts.map(post => {
        const date = post.createdAt?.toDate?.() ?? new Date();
        return (
          <div key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              {post.authorPhotoURL ? (
                <img src={post.authorPhotoURL} alt={post.authorName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-slate-600 flex items-center justify-center font-bold text-amber-700 dark:text-amber-300 flex-shrink-0">
                  {post.authorName[0]}
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{post.authorName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{post.authorUniversity} · {date.toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
        );
      })}
    </div>
  );
};

export default ExperienceWall;
