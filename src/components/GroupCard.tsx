import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

interface GroupCardProps {
  id: string;
  name: string;
  description: string;
  photoURL?: string;
  memberCount: number;
  code: string;
}

const GroupCard: React.FC<GroupCardProps> = ({ id, name, description, photoURL, memberCount }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md border border-amber-100 dark:border-slate-700 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1"
      onClick={() => navigate(`/group/${id}`)}
    >
      <div className="h-40 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-slate-600 dark:to-slate-700 overflow-hidden">
        {photoURL ? (
          <img src={photoURL} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">✈️</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate">{name}</h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-1 mt-3 text-sm text-slate-500 dark:text-slate-400">
          <Users size={14} />
          <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
