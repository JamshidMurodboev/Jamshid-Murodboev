import { Calendar, MapPin, ExternalLink } from 'lucide-react'

export interface Scholarship {
  id: string
  name: string
  country: string
  hostUniversity: string
  fundingType: 'fully-funded' | 'partial'
  deadline: string
  description: string
  eligibility: string
  applicationLink: string
  tags: string[]
  active: boolean
  createdAt: unknown
}

const countryFlags: Record<string, string> = {
  Turkey: '🇹🇷',
  Türkiye: '🇹🇷',
  USA: '🇺🇸',
  'United States': '🇺🇸',
  UK: '🇬🇧',
  'United Kingdom': '🇬🇧',
  Germany: '🇩🇪',
  France: '🇫🇷',
  China: '🇨🇳',
  Japan: '🇯🇵',
  South Korea: '🇰🇷',
  Russia: '🇷🇺',
  UAE: '🇦🇪',
  Canada: '🇨🇦',
  Australia: '🇦🇺',
  Italy: '🇮🇹',
  Spain: '🇪🇸',
  Netherlands: '🇳🇱',
  Sweden: '🇸🇪',
  Norway: '🇳🇴',
  Hungary: '🇭🇺',
  Czech: '🇨🇿',
  Poland: '🇵🇱',
  Malaysia: '🇲🇾',
  Indonesia: '🇮🇩',
  India: '🇮🇳',
  Uzbekistan: '🇺🇿',
}

function getFlag(country: string): string {
  for (const [key, flag] of Object.entries(countryFlags)) {
    if (country.toLowerCase().includes(key.toLowerCase())) return flag
  }
  return '🌍'
}

interface Props {
  scholarship: Scholarship
}

export default function ScholarshipCard({ scholarship }: Props) {
  return (
    <div className="card p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getFlag(scholarship.country)}</span>
          <div>
            <h3 className="font-bold text-gray-900 text-base leading-tight">{scholarship.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{scholarship.hostUniversity}</p>
          </div>
        </div>
        <span
          className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            scholarship.fundingType === 'fully-funded'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {scholarship.fundingType === 'fully-funded' ? 'Fully Funded' : 'Partial'}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {scholarship.country}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Deadline: {scholarship.deadline}
        </span>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
        {scholarship.description}
      </p>

      {scholarship.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {scholarship.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <a
        href={scholarship.applicationLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-amber-500 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
      >
        Learn More
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  )
}
