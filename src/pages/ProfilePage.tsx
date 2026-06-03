import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { db, storage, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { COUNTRIES } from '../lib/countries';
import Layout from '../components/Layout';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit2, Save, X, LogOut } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [homeUniversity, setHomeUniversity] = useState('');
  const [homeUniversityCountry, setHomeUniversityCountry] = useState('');
  const [hostUniversity, setHostUniversity] = useState('');
  const [hostCountry, setHostCountry] = useState('');
  const [instagram, setInstagram] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [notesWritten, setNotesWritten] = useState(0);
  const [notesReceived, setNotesReceived] = useState(0);

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName || '');
      setLastName(userProfile.lastName || '');
      setDateOfBirth(userProfile.dateOfBirth || '');
      setNationality(userProfile.nationality || '');
      setHomeUniversity(userProfile.homeUniversity || '');
      setHomeUniversityCountry(userProfile.homeUniversityCountry || '');
      setHostUniversity(userProfile.hostUniversity || '');
      setHostCountry(userProfile.hostCountry || '');
      setInstagram(userProfile.instagram || '');
      setPhotoPreview(userProfile.photoURL || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (!user) return;
    const fetchCounts = async () => {
      try {
        const writtenQ = query(collection(db, 'notes'), where('writerId', '==', user.uid));
        const receivedQ = query(collection(db, 'notes'), where('recipientId', '==', user.uid));
        const [writtenSnap, receivedSnap] = await Promise.all([getDocs(writtenQ), getDocs(receivedQ)]);
        setNotesWritten(writtenSnap.size);
        setNotesReceived(receivedSnap.size);
      } catch {
        // ignore
      }
    };
    fetchCounts();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let photoURL = userProfile?.photoURL || '';
      if (photoFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName,
        lastName,
        photoURL,
        dateOfBirth,
        nationality,
        homeUniversity,
        homeUniversityCountry,
        hostUniversity,
        hostCountry,
        instagram,
        profileComplete: true,
      }, { merge: true });
      await refreshProfile();
      toast.success('Profile updated!');
      setEditing(false);
      setPhotoFile(null);
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
    toast.success('Logged out');
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm";
  const selectClass = inputClass;
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const valueClass = "text-slate-800 dark:text-white font-medium";
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => { setEditing(false); setPhotoFile(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 dark:bg-slate-700 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
              >
                <Edit2 size={14} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Avatar + name */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 p-6 flex items-center gap-5 shadow-sm">
          {editing ? (
            <ImageUpload
              currentImage={photoPreview}
              onImageSelected={(file, url) => { setPhotoFile(file); setPhotoPreview(url); }}
              shape="circle"
              size="md"
              label="Change photo"
            />
          ) : (
            <div className="relative">
              {(userProfile?.photoURL) ? (
                <img src={userProfile.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-amber-200 dark:border-slate-600" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-amber-200 dark:bg-slate-600 flex items-center justify-center text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {userProfile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {userProfile?.firstName} {userProfile?.lastName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{user?.email}</p>
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{notesWritten}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Notes Written</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{notesReceived}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Notes Received</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelClass}>First Name</p>
              {editing ? (
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
              ) : (
                <p className={valueClass}>{userProfile?.firstName || '-'}</p>
              )}
            </div>
            <div>
              <p className={labelClass}>Last Name</p>
              {editing ? (
                <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
              ) : (
                <p className={valueClass}>{userProfile?.lastName || '-'}</p>
              )}
            </div>
          </div>

          <div>
            <p className={labelClass}>Date of Birth</p>
            {editing ? (
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className={inputClass} />
            ) : (
              <p className={valueClass}>{userProfile?.dateOfBirth || '-'}</p>
            )}
          </div>

          <div>
            <p className={labelClass}>Nationality</p>
            {editing ? (
              <select value={nationality} onChange={e => setNationality(e.target.value)} className={selectClass}>
                <option value="">Select nationality</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            ) : (
              <p className={valueClass}>{userProfile?.nationality || '-'}</p>
            )}
          </div>

          <div>
            <p className={labelClass}>Instagram</p>
            {editing ? (
              <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@yourhandle" className={inputClass} />
            ) : (
              <p className={valueClass}>{userProfile?.instagram || '-'}</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">University Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelClass}>Home University</p>
              {editing ? (
                <input value={homeUniversity} onChange={e => setHomeUniversity(e.target.value)} className={inputClass} />
              ) : (
                <p className={valueClass}>{userProfile?.homeUniversity || '-'}</p>
              )}
            </div>
            <div>
              <p className={labelClass}>Home Country</p>
              {editing ? (
                <select value={homeUniversityCountry} onChange={e => setHomeUniversityCountry(e.target.value)} className={selectClass}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              ) : (
                <p className={valueClass}>{userProfile?.homeUniversityCountry || '-'}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelClass}>Host University</p>
              {editing ? (
                <input value={hostUniversity} onChange={e => setHostUniversity(e.target.value)} className={inputClass} />
              ) : (
                <p className={valueClass}>{userProfile?.hostUniversity || '-'}</p>
              )}
            </div>
            <div>
              <p className={labelClass}>Host Country</p>
              {editing ? (
                <select value={hostCountry} onChange={e => setHostCountry(e.target.value)} className={selectClass}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              ) : (
                <p className={valueClass}>{userProfile?.hostCountry || '-'}</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </Layout>
  );
};

export default ProfilePage;
