import React from 'react';
import { MessageSquare } from 'lucide-react';

interface MemberCardProps {
  uid: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  university: string;
  nationality: string;
  nationalityFlag?: string;
  onWriteNote: () => void;
  isCurrentUser?: boolean;
}

// Simple nationality to flag emoji map
const flagMap: Record<string, string> = {
  'Uzbekistan': '🇺🇿', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Spain': '🇪🇸',
  'Italy': '🇮🇹', 'Portugal': '🇵🇹', 'Poland': '🇵🇱', 'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪', 'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰',
  'Finland': '🇫🇮', 'Czech Republic': '🇨🇿', 'Hungary': '🇭🇺', 'Romania': '🇷🇴',
  'Bulgaria': '🇧🇬', 'Greece': '🇬🇷', 'Turkey': '🇹🇷', 'Ukraine': '🇺🇦',
  'Russia': '🇷🇺', 'Kazakhstan': '🇰🇿', 'United Kingdom': '🇬🇧', 'Ireland': '🇮🇪',
  'United States': '🇺🇸', 'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
  'South Korea': '🇰🇷', 'China': '🇨🇳', 'India': '🇮🇳', 'Brazil': '🇧🇷',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Morocco': '🇲🇦', 'Egypt': '🇪🇬',
  'Nigeria': '🇳🇬', 'South Africa': '🇿🇦', 'Iran': '🇮🇷', 'Pakistan': '🇵🇰',
  'Indonesia': '🇮🇩', 'Vietnam': '🇻🇳', 'Thailand': '🇹🇭', 'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬', 'Philippines': '🇵🇭', 'Saudi Arabia': '🇸🇦', 'UAE': '🇦🇪',
  'Israel': '🇮🇱', 'Switzerland': '🇨🇭',
};

const MemberCard: React.FC<MemberCardProps> = ({
  firstName,
  lastName,
  photoURL,
  university,
  nationality,
  onWriteNote,
  isCurrentUser,
}) => {
  const flag = flagMap[nationality] || '🌍';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-amber-100 dark:border-slate-700 p-5 flex flex-col items-center text-center gap-3">
      <div className="relative">
        {photoURL ? (
          <img src={photoURL} alt={`${firstName} ${lastName}`} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-amber-200 dark:bg-slate-600 flex items-center justify-center text-xl font-bold text-amber-700 dark:text-amber-300">
            {firstName[0]}{lastName[0]}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 text-lg">{flag}</span>
      </div>
      <div>
        <p className="font-semibold text-slate-800 dark:text-white">{firstName} {lastName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{university}</p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{nationality}</p>
      </div>
      {!isCurrentUser && (
        <button
          onClick={onWriteNote}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors w-full justify-center"
        >
          <MessageSquare size={14} />
          Write Note
        </button>
      )}
      {isCurrentUser && (
        <span className="text-xs text-slate-400 dark:text-slate-500 italic">That's you!</span>
      )}
    </div>
  );
};

export default MemberCard;
