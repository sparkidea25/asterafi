import { useState, useEffect } from "react"
import { ethers } from "ethers"
import vaultAbi from '/abi/vault.json'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Clock, Calendar, DollarSign, User, CheckCircle, AlertCircle, Wallet, Info } from 'lucide-react'

interface Plan {
  id: bigint
  beneficiary: string
  monthlyAmount: bigint
  totalMonths: bigint
  monthsPaid: bigint
  startTime: bigint
  active: boolean
}

interface MyPlansProps {
  language: 'es' | 'en'
  account: string | null
}

// Contract addresses (Base Sepolia testnet)
const PENSION_CONTRACT_ADDRESS = '0xE0D7B2FbBA51F8905428decd917046d30d7012De'
// '0x12123d469941B880331472DF74b8C9414EC17499'
const USDT_ADDRESS = '0x05105fa9611F7A23ce7008f19Bcc384a24921FE6'

export default function MyPlans({ language, account }: MyPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set())
  const [paymentStatus, setPaymentStatus] = useState<{[key: string]: string}>({})
  
  const translations = {
    es: {
      title: "Mis Planes de Pensión",
      noPlans: "No tienes planes de pensión creados aún.",
      planId: "ID del Plan",
      beneficiary: "Beneficiario",
      monthlyAmount: "Monto Mensual",
      totalMonths: "Meses Totales",
      monthsPaid: "Pagos Recibidos",
      totalDeposited: "Depósito Total",
      totalReceived: "Total Recibido",
      remainingBalance: "Saldo Restante",
      startTime: "Fecha de Inicio",
      active: "Activo",
      processPayment: "Retirar Pago Mensual",
      processing: "Procesando...",
      paymentSuccess: "Pago retirado exitosamente",
      paymentError: "Error al retirar el pago",
      viewPlan: "Ver Plan",
      loadPlans: "Cargar Planes",
      loadingPlans: "Cargando planes...",
      nextPayment: "Próximo pago disponible",
      fundInfo: "Fondo de pensión pre-financiado",
      fundDescription: "Depositaste el total al crear el plan. Ahora puedes retirar pagos mensuales.",
      howItWorks: "Cómo funciona",
      step1Title: "1. Pre-financiación",
      step1Desc: "Al crear el plan, depositas el total del monto (mensualidad × meses) en un contrato seguro.",
      step2Title: "2. Espera el primer mes",
      step2Desc: "El primer pago solo puede retirarse después de 30 días de la fecha de inicio.",
      step3Title: "3. Retira mensualmente",
      step3Desc: "Cada mes, puedes retirar un pago haciendo clic en 'Retirar Pago Mensual'.",
      step4Title: "4. Automatización (futuro)",
      step4Desc: "En el futuro, los pagos se retirarán automáticamente sin intervención manual."
    },
    en: {
      title: "My Pension Plans",
      noPlans: "You don't have any pension plans created yet.",
      planId: "Plan ID",
      beneficiary: "Beneficiary",
      monthlyAmount: "Monthly Amount",
      totalMonths: "Total Months",
      monthsPaid: "Payments Received",
      totalDeposited: "Total Deposit",
      totalReceived: "Total Received",
      remainingBalance: "Remaining Balance",
      startTime: "Start Date",
      active: "Active",
      processPayment: "Withdraw Monthly Payment",
      processing: "Processing...",
      paymentSuccess: "Payment withdrawn successfully",
      paymentError: "Error withdrawing payment",
      viewPlan: "View Plan",
      loadPlans: "Load Plans",
      loadingPlans: "Loading plans...",
      nextPayment: "Next payment available",
      fundInfo: "Pre-financed pension fund",
      fundDescription: "You deposited the total amount when creating the plan. Now you can withdraw monthly payments.",
      howItWorks: "How it works",
      step1Title: "1. Pre-financing",
      step1Desc: "When creating the plan, you deposit the total amount (monthly amount × months) into a secure contract.",
      step2Title: "2. Wait for the first month",
      step2Desc: "The first payment can only be withdrawn after 30 days from the start date.",
      step3Title: "3. Withdraw monthly",
      step3Desc: "Each month, you can withdraw a payment by clicking 'Withdraw Monthly Payment'.",
      step4Title: "4. Automation (future)",
      step4Desc: "In the future, payments will be withdrawn automatically without manual intervention."
    }
  }

  const t = translations[language]

  // Load user's plans
  const loadPlans = async () => {
    if (!account) {
      setPlans([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const pensionContract = new ethers.Contract(PENSION_CONTRACT_ADDRESS, vaultAbi, provider)
      
      // Get total number of plans
      const totalPlans = await pensionContract.planCount()
      console.log("Total plans:", totalPlans.toString())
      
      const userPlans: Plan[] = []
      
      // Iterate through all plans (from 1 to planCount) to find ones belonging to the user
      for (let i = 1n; i <= totalPlans; i++) {
        try {
          const plan = await pensionContract.plans(i)
          console.log(`Plan ${i}:`, plan)
          console.log(`Beneficiary: ${plan.beneficiary.toLowerCase()}`)
          console.log(`Account: ${account.toLowerCase()}`)
          console.log(`Match: ${plan.beneficiary.toLowerCase() === account.toLowerCase()}`)
          
          // Check if the plan is initialized (beneficiary is not zero address)
          const zeroAddress = "0x0000000000000000000000000000000000000000";
          if (plan.beneficiary.toLowerCase() === zeroAddress) {
            console.log(`Plan ${i} is not initialized (zero address)`)
            continue;
          }
          
          // Check if the beneficiary matches the connected account
          if (plan.beneficiary.toLowerCase() === account.toLowerCase()) {
            userPlans.push({
              id: i,
              beneficiary: plan.beneficiary,
              monthlyAmount: plan.monthlyAmount,
              totalMonths: plan.totalMonths,
              monthsPaid: plan.monthsPaid,
              startTime: plan.startTime,
              active: plan.active
            })
          }
        } catch (error) {
          console.warn(`Error fetching plan ${i}:`, error)
        }
      }
      
      setPlans(userPlans)
    } catch (error) {
      console.error("Error loading plans:", error)
    } finally {
      setLoading(false)
    }
  }

  // Process payment for a plan
  const processPayment = async (planId: bigint) => {
    if (!account) return
    
    const planIdStr = planId.toString()
    setProcessingPayments(prev => new Set(prev).add(planIdStr))
    setPaymentStatus(prev => ({ ...prev, [planIdStr]: '' }))
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const pensionContract = new ethers.Contract(PENSION_CONTRACT_ADDRESS, vaultAbi, signer)
      
      // Send transaction to process payment
      const tx = await pensionContract.processPayment(planId)
      setPaymentStatus(prev => ({ ...prev, [planIdStr]: t.processing }))
      
      // Wait for transaction confirmation
      await tx.wait()
      
      setPaymentStatus(prev => ({ ...prev, [planIdStr]: t.paymentSuccess }))
      
      // Reload plans to update monthsPaid
      setTimeout(() => {
        loadPlans()
        setProcessingPayments(prev => {
          const newSet = new Set(prev)
          newSet.delete(planIdStr)
          return newSet
        })
      }, 2000)
    } catch (error: any) {
      console.error("Error processing payment:", error)
      setPaymentStatus(prev => ({ ...prev, [planIdStr]: `${t.paymentError}: ${error.message || 'Unknown error'}` }))
      
      setTimeout(() => {
        setProcessingPayments(prev => {
          const newSet = new Set(prev)
          newSet.delete(planIdStr)
          return newSet
        })
      }, 3000)
    }
  }

  // Format date
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')
  }

  // Format currency
  const formatCurrency = (amount: bigint) => {
    return ethers.formatUnits(amount, 6) // USDT has 6 decimals
  }

  // Calculate next payment date
  const getNextPaymentDate = (startTime: bigint, monthsPaid: bigint) => {
    const startDate = new Date(Number(startTime) * 1000)
    // Add (monthsPaid + 1) months to get the next payment date
    startDate.setMonth(startDate.getMonth() + Number(monthsPaid) + 1)
    return startDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')
  }

  // Calculate total deposited amount
  const getTotalDeposited = (monthlyAmount: bigint, totalMonths: bigint) => {
    return monthlyAmount * totalMonths
  }

  // Calculate total received amount
  const getTotalReceived = (monthlyAmount: bigint, monthsPaid: bigint) => {
    return monthlyAmount * monthsPaid
  }

  // Calculate remaining balance
  const getRemainingBalance = (monthlyAmount: bigint, totalMonths: bigint, monthsPaid: bigint) => {
    const totalDeposited = getTotalDeposited(monthlyAmount, totalMonths)
    const totalReceived = getTotalReceived(monthlyAmount, monthsPaid)
    return totalDeposited - totalReceived
  }

  // Load plans when account changes
  useEffect(() => {
    loadPlans()
  }, [account])

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t.title}</h1>
          <p className="text-lg text-gray-600">
            {account 
              ? `${t.viewPlan} ${account.substring(0, 6)}...${account.substring(38)}` 
              : t.noPlans}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{t.loadingPlans}</p>
          </div>
        ) : plans.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noPlans}</h3>
              <p className="text-gray-500 mb-4">
                {account 
                  ? t.noPlans 
                  : "Conecta tu billetera para ver tus planes de pensión."}
              </p>
              {!account && (
                <Button onClick={() => window.dispatchEvent(new Event('connect-wallet'))}>
                  Conectar Billetera
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {plans.map((plan) => {
              const totalDeposited = getTotalDeposited(plan.monthlyAmount, plan.totalMonths)
              const totalReceived = getTotalReceived(plan.monthlyAmount, plan.monthsPaid)
              const remainingBalance = getRemainingBalance(plan.monthlyAmount, plan.totalMonths, plan.monthsPaid)
              
              return (
                <Card key={plan.id.toString()}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Plan #{plan.id.toString()}</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        plan.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.active ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t.active}
                          </>
                        ) : 'Inactivo'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Fund Info */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Wallet className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-semibold text-blue-800">{t.fundInfo}</h3>
                      </div>
                      <p className="text-sm text-blue-700">{t.fundDescription}</p>
                    </div>
                    
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">{t.totalDeposited}</p>
                        <p className="text-xl font-bold text-gray-800">${formatCurrency(totalDeposited)} CAPITAL</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">{t.totalReceived}</p>
                        <p className="text-xl font-bold text-green-800">${formatCurrency(totalReceived)} CAPITAL</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">{t.remainingBalance}</p>
                        <p className="text-xl font-bold text-orange-800">${formatCurrency(remainingBalance)} CAPITAL</p>
                      </div>
                    </div>
                    
                    {/* Plan Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">{t.beneficiary}</p>
                        <p className="font-medium">
                          {plan.beneficiary.substring(0, 6)}...{plan.beneficiary.substring(38)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">{t.monthlyAmount}</p>
                        <p className="font-medium">${formatCurrency(plan.monthlyAmount)} CAPITAL</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">{t.totalMonths}</p>
                        <p className="font-medium">{plan.totalMonths.toString()} meses</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">{t.monthsPaid}</p>
                        <p className="font-medium">{plan.monthsPaid.toString()} de {plan.totalMonths.toString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">{t.startTime}</p>
                        <p className="font-medium">{formatDate(plan.startTime)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">{t.nextPayment}</p>
                        <p className="font-medium">
                          {getNextPaymentDate(plan.startTime, plan.monthsPaid)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="pt-4">
                      <Button 
                        onClick={() => processPayment(plan.id)}
                        disabled={processingPayments.has(plan.id.toString()) || !plan.active}
                        className="w-full"
                      >
                        {processingPayments.has(plan.id.toString()) ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            {t.processing}
                          </>
                        ) : (
                          <>
                            <DollarSign className="mr-2 h-4 w-4" />
                            {t.processPayment}
                          </>
                        )}
                      </Button>
                      
                      {paymentStatus[plan.id.toString()] && (
                        <p className={`mt-2 text-center text-sm ${
                          paymentStatus[plan.id.toString()] === t.paymentSuccess 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {paymentStatus[plan.id.toString()]}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {/* How it works section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-600" />
                  {t.howItWorks}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                    <span className="text-blue-800 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{t.step1Title}</h3>
                    <p className="text-gray-600">{t.step1Desc}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                    <span className="text-blue-800 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{t.step2Title}</h3>
                    <p className="text-gray-600">{t.step2Desc}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                    <span className="text-blue-800 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{t.step3Title}</h3>
                    <p className="text-gray-600">{t.step3Desc}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-1">
                    <span className="text-blue-800 text-sm font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{t.step4Title}</h3>
                    <p className="text-gray-600">{t.step4Desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center pt-4">
              <Button variant="outline" onClick={loadPlans}>
                {t.loadPlans}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}