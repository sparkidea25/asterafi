import { Button } from "./ui/button"
import { X } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';

interface SidebarProps {
  language: 'es' | 'en'
  setLanguage: (lang: 'es' | 'en') => void
  translations: {
    learn: string
    invest: string
    retire: string
    contribute: string
    myPlans: string
  }
  activeSection: string
  onSectionClick: (section: 'home' | 'learn' | 'swap' | 'retire' | 'contribute' | 'myPlans') => void
}

export default function Sidebar({ language, setLanguage, translations, activeSection, onSectionClick }: SidebarProps) {
  return (
    <div className="w-64 bg-white/90 backdrop-blur-sm border-r-2 border-gray-300 min-h-screen p-6 shadow-lg">
      {/* Language Toggle */}
      <div className="mb-8">
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => setLanguage('es')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              language === 'es' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ES
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              language === 'en' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ENG
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-4 mb-8">
        {[
          { key: 'learn', label: translations.learn },
          { key: 'swap', label: translations.invest },
          { key: 'retire', label: translations.retire },
          { key: 'myPlans', label: translations.myPlans },
          { key: 'contribute', label: translations.contribute }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => onSectionClick(item.key as any)}
            className={`w-full text-left py-3 px-4 text-lg font-medium rounded-lg transition-colors ${
              activeSection === item.key 
                ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-500' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* X (Twitter) Link */}
      <div className="mt-auto">
        <a
          href="https://x.com/MichaelD725"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <FontAwesomeIcon icon={faXTwitter} />
          {/* <X size={24} /> */}
        </a>
      </div>
    </div>
  )
}
