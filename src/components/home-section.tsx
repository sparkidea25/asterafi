import React from 'react'
import { Building2, TrendingUp, Shield, Users } from 'lucide-react'
import BankAnimation from './bank-animation'

interface HomeSectionProps {
  language: 'es' | 'en'
}

export default function HomeSection({ language }: HomeSectionProps) {
  const translations = {
    es: {
      title: "La seguridad social está muerta",
      subtitle: "Haz clic para destruir el banco",
      description: "Construye tu futuro financiero con DeFi. Invierte en $CAPITAL y asegura tu jubilación.",
      features: {
        decentralized: {
          title: "Descentralizado",
          description: "Sin intermediarios, control total"
        },
        transparent: {
          title: "Transparente", 
          description: "Todas las transacciones son públicas"
        },
        secure: {
          title: "Seguro",
          description: "Protegido por blockchain"
        },
        community: {
          title: "Comunidad",
          description: "Gobernanza descentralizada"
        }
      },
      cta: "Comenzar ahora"
    },
    en: {
      title: "Social security is dead",
      subtitle: "Click to destroy the bank",
      description: "Build your financial future with DeFi. Invest in $CAPITAL and secure your retirement.",
      features: {
        decentralized: {
          title: "Decentralized",
          description: "No intermediaries, full control"
        },
        transparent: {
          title: "Transparent",
          description: "All transactions are public"
        },
        secure: {
          title: "Secure", 
          description: "Protected by blockchain"
        },
        community: {
          title: "Community",
          description: "Decentralized governance"
        }
      },
      cta: "Get started"
    }
  }

  const t = translations[language]

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-green-400"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full p-8 text-center">
        {/* Bank Animation */}
        <div className="mb-8">
          {/*<BankAnimation /> */}
        </div>

        {/* Main heading */}
        <h1 className="text-6xl font-bold text-gray-800 mb-4 max-w-4xl">
          {t.title}
        </h1>
        
        <p className="text-xl text-gray-700 mb-8 max-w-2xl">
          {t.subtitle}
        </p>

        <p className="text-lg text-gray-600 mb-12 max-w-3xl">
          {t.description}
        </p>

        {/* Features grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 max-w-4xl">
          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-gray-800" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t.features.decentralized.title}</h3>
            <p className="text-sm text-gray-700">{t.features.decentralized.description}</p>
          </div>

          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-gray-800" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t.features.transparent.title}</h3>
            <p className="text-sm text-gray-700">{t.features.transparent.description}</p>
          </div>

          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <Shield className="h-8 w-8 text-gray-800" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t.features.secure.title}</h3>
            <p className="text-sm text-gray-700">{t.features.secure.description}</p>
          </div>

          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-800" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t.features.community.title}</h3>
            <p className="text-sm text-gray-700">{t.features.community.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}