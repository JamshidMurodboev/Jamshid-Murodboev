import { MapPin, DollarSign, ExternalLink, BookOpen } from 'lucide-react'

export interface University {
  id: string
  name: string
  country: string
  city: string
  tuitionRange: string
  programs: string[]
  description: string
  applicationLink: string
  active: boolean
  createdAt: unknown
}

interface Props {
  university: University
}

export default function UniversityCard({ university }: Props) {
  return (
    <div className="card p-6 flex flex-col">
      <div className="mb-3">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{university.name}</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {university.city}, {university.country}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {university.tuitionRange}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
        {university.description}
      </p>

      {university.programs.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-2">
            <BookOpen className="h-3 w-3" />
            Popular Programs
          </div>
          <div className="flex flex-wrap gap-1.5">
            {university.programs.slice(0, 3).map((prog) => (
              <span key={prog} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {prog}
              </span>
            ))}
            {university.programs.length > 3 && (
              <span className="text-xs text-gray-400">+{university.programs.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      <a
        href={university.applicationLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
      >
        Apply Info
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  )
}
