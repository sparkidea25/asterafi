import { useState } from 'react'
import Sidebar from './components/sidebar'
import HomeSection from './components/home-section'
import LearnSection from './components/learn-section'
import SwapSection from './components/swap-section'
import PensionCalculator from './components/pension-calculator'
import ContributeSection from './components/contribute-section'
import MyPlans from './components/my-plans'
import { Building2 } from 'lucide-react'
import { ConnectWalletButton } from './components/Connectkit';
import { useAccount } from 'wagmi'

function App() {
  const [language, setLanguage] = useState<'es' | 'en'>('es')
  const [activeSection, setActiveSection] = useState<'home' | 'learn' | 'swap' | 'retire' | 'contribute' | 'myPlans'>('home')
  const { address: account } = useAccount()

  const translations = {
    es: {
      learn: "Aprende",
      invest: "Invierte", 
      retire: "Jubila",
      contribute: "Contribuye",
      myPlans: "Mis Planes"
    },
    en: {
      learn: "Learn",
      invest: "Invest",
      retire: "Retire", 
      contribute: "Contribute",
      myPlans: "My Plans"
    }
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'learn':
        return <LearnSection language={language} />
      case 'swap':
        return <SwapSection language={language} />
      case 'retire':
        return <PensionCalculator language={language} />
      case 'myPlans':
        return <MyPlans language={language} account={account || null} />
      case 'contribute':
        return <ContributeSection language={language} />
      default:
        return <HomeSection language={language} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-2">
            {/* <Building2 className="h-8 w-8 text-blue-600" /> */}
            <span className="text-xl font-bold text-gray-800">Asterafi</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* https://www.geckoterminal.com/base/pools/0x4d942a0716973e0667a8ac577cfa865de0b659a6 */}
            <a
              href="https://www.geckoterminal.com/base/pools/0x4d942a0716973e0667a8ac577cfa865de0b659a6"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              Compra $CAPITAL
            </a>
            {/* <button className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>connect wallet</span>
            </button> */}
            <ConnectWalletButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 pt-20">
        <Sidebar
          language={language}
          setLanguage={setLanguage}
          translations={translations[language]}
          activeSection={activeSection}
          onSectionClick={setActiveSection}
        />
        {renderActiveSection()}
      </div>
    </div>
  );
}

export default App;
