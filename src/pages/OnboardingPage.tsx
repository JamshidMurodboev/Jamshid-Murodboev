import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { COUNTRIES } from '../lib/countries';
import ImageUpload from '../components/ImageUpload';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

const OnboardingPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [homeUniversity, setHomeUniversity] = useState('');
  const [homeUniversityCountry, setHomeUniversityCountry] = useState('');
  const [hostUniversity, setHostUniversity] = useState('');
  const [hostCountry, setHostCountry] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageSelected = (file: File, previewUrl: string) => {
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!firstName || !lastName || !dateOfBirth || !nationality || !homeUniversity || !hostUniversity || !hostCountry) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      let photoURL = '';
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
        createdAt: new Date().toISOString(),
      });

      await refreshProfile();
      toast.success('Profile created! Welcome to Memory Capsule 🎉');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-midnight transition-colors duration-300">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <span className="font-bold text-slate-800 dark:text-white text-lg">Memory Capsule</span>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-xl bg-amber-100 dark:bg-slate-700 text-amber-700 dark:text-amber-300">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Set Up Your Profile</h1>
          <p className="text-slate-500 dark:text-slate-400">Tell us about your Erasmus journey</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-amber-100 dark:border-slate-700 p-8 space-y-6">
          {/* Photo */}
          <div className="flex flex-col items-center">
            <ImageUpload
              currentImage={photoPreview}
              onImageSelected={handleImageSelected}
              shape="circle"
              size="lg"
              label="Upload Profile Photo"
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
              <input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Date of birth */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth *</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nationality *</label>
            <select
              value={nationality}
              onChange={e => setNationality(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
            >
              <option value="">Select your nationality</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Home University */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Home University *</label>
              <input
                value={homeUniversity}
                onChange={e => setHomeUniversity(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                placeholder="University of..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Home Country *</label>
              <select
                value={homeUniversityCountry}
                onChange={e => setHomeUniversityCountry(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
              >
                <option value="">Select country</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Host University */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Host University *</label>
              <input
                value={hostUniversity}
                onChange={e => setHostUniversity(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                placeholder="Receiving university"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Host Country *</label>
              <select
                value={hostCountry}
                onChange={e => setHostCountry(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
              >
                <option value="">Select country</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Instagram (optional)</label>
            <input
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
              placeholder="@yourhandle"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting up your profile...' : 'Complete Setup →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
