import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Slider } from "./ui/slider"
import { Button } from "./ui/button"
import { Calculator, DollarSign, Calendar, TrendingUp, User, Clock } from 'lucide-react'
import vaultAbi from '/abi/vault.json'

interface PensionCalculatorProps {
  language: 'es' | 'en'
}

// Contract addresses (Base Sepolia testnet)
const PENSION_CONTRACT_ADDRESS = '0xE0D7B2FbBA51F8905428decd917046d30d7012De' // Pension contract
const CAPITAL_ADDRESS = '0x80CC64698B305499eE3827BE8974ae47a2B19803' // Mock USDT on Base Sepolia
// USDT_ADDRESS

export default function PensionCalculator({ language }: PensionCalculatorProps) {
  const [desiredPension, setDesiredPension] = useState<string>("1000")
  const [years, setYears] = useState<number[]>([5])
  const [requiredCapital, setRequiredCapital] = useState<number>(0)
  const [account, setAccount] = useState<string | null>(null)
  const [usdtBalance, setUsdtBalance] = useState<string>("0")
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(true)
  const [status, setStatus] = useState<string>("")
  const [isCreatingPlan, setIsCreatingPlan] = useState<boolean>(false)
  const [planId, setPlanId] = useState<string | null>(null)

  const translations = {
    es: {
      title: "Calculadora de Pensiones",
      subtitle: "Calcula el capital necesario para tu jubilación",
      desiredPension: "Pensión mensual deseada ($)",
      retirementYears: "Años de jubilación",
      year: "año",
      years: "años",
      requiredCapital: "Capital necesario",
      assumptions: "Asumiendo 10% de rentabilidad anual",
      monthlyPayment: "Pago mensual requerido",
      startInvesting: "¡Comienza a invertir hoy!",
      createPlan: "Crear Plan de Pensión",
      creatingPlan: "Creando plan...",
      planCreated: "¡Plan creado exitosamente!",
      planId: "ID del Plan",
      connectWallet: "Conectar Billetera",
      walletRequired: "Se requiere billetera conectada",
      insufficientFunds: "Fondos insuficientes",
      approving: "Aprobando CAPITAL...",
      creating: "Creando plan de pensión...",
      approveSuccess: "Aprobación exitosa ✅",
      connectToCreate: "Conecta tu billetera para crear un plan",
      useUsdt: "Usa CAPITAL en Base Sepolia para crear tu plan",
      yourBalance: "Tu balance de CAPITAL:",
      loadingBalance: "Cargando balance..."
    },
    en: {
      title: "Pension Calculator",
      subtitle: "Calculate the capital needed for your retirement",
      desiredPension: "Desired monthly pension ($)",
      retirementYears: "Retirement years",
      year: "year",
      years: "years",
      requiredCapital: "Required capital",
      assumptions: "Assuming 10% annual return",
      monthlyPayment: "Required monthly payment",
      startInvesting: "Start investing today!",
      createPlan: "Create Pension Plan",
      creatingPlan: "Creating plan...",
      planCreated: "Plan created successfully!",
      planId: "Plan ID",
      connectWallet: "Connect Wallet",
      walletRequired: "Wallet connection required",
      insufficientFunds: "Insufficient funds",
      approving: "Approving CAPITAL...",
      creating: "Creating pension plan...",
      approveSuccess: "Approval successful ✅",
      connectToCreate: "Connect your wallet to create a plan",
      useUsdt: "Use CAPITAL on Base Sepolia to create your plan",
      yourBalance: "Your CAPITAL balance:",
      loadingBalance: "Loading balance..."
    }
  }

  const t = translations[language]

  // Fetch USDT balance when account changes
  useEffect(() => {
    const fetchUsdtBalance = async () => {
      if (!account) {
        setUsdtBalance("0")
        setIsBalanceLoading(false)
        return
      }

      setIsBalanceLoading(true)
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const usdtContract = new ethers.Contract(CAPITAL_ADDRESS, [
          "function balanceOf(address) view returns (uint256)"
        ], provider)
        
        const balance = await usdtContract.balanceOf(account)
        const formattedBalance = ethers.formatUnits(balance, 6) // USDT has 6 decimals
        setUsdtBalance(formattedBalance)
      } catch (balanceError) {
        console.warn('Could not fetch CAPITAL balance:', balanceError)
        setUsdtBalance("0")
      } finally {
        setIsBalanceLoading(false)
      }
    }

    fetchUsdtBalance()
  }, [account])

  // Detect connected account
  useEffect(() => {
    const loadAccount = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()
          if (accounts.length > 0) {
            setAccount(accounts[0].address)
          } else {
            setAccount(null)
          }
        } catch (error) {
          console.error('Error loading account:', error)
          setAccount(null)
        }
      }
    }
    
    loadAccount()
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0])
      } else {
        setAccount(null)
        setUsdtBalance("0")
      }
    }
    
    const handleChainChanged = () => {
      // Reload when chain changes
      setTimeout(() => {
        loadAccount()
      }, 1000)
    }
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  // Calculate required capital using present value of annuity formula
  useEffect(() => {
    const monthlyPension = parseFloat(desiredPension) || 0
    const totalYears = years[0]
    const monthlyRate = 0.10 / 12 // 10% annual rate / 12 months
    const totalMonths = totalYears * 12

    if (monthlyPension > 0 && totalYears > 0) {
      // Present Value of Annuity formula: PMT * [(1 - (1 + r)^-n) / r]
      const presentValue = monthlyPension * ((1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate)
      setRequiredCapital(presentValue)
    } else {
      setRequiredCapital(0)
    }
  }, [desiredPension, years])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleCreatePlan = async () => {
    if (!account) {
      setStatus(t.walletRequired)
      return
    }

    if (isCreatingPlan) return

    setIsCreatingPlan(true)
    setStatus(t.creating)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // Parse values
      const monthlyAmount = ethers.parseUnits(desiredPension, 6) // USDT has 6 decimals
      const totalMonths = BigInt(years[0] * 12)
      
      // Create USDT contract instance
      const usdtContract = new ethers.Contract(CAPITAL_ADDRESS, [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address, address) view returns (uint256)",
        "function approve(address, uint256) returns (bool)"
      ], signer)
      
      // Check USDT balance
      const balance = await usdtContract.balanceOf(account)
      const totalRequired = monthlyAmount * totalMonths
      
      if (balance < totalRequired) {
        setStatus(t.insufficientFunds)
        setIsCreatingPlan(false)
        return
      }
      
      // Check allowance
      const currentAllowance = await usdtContract.allowance(account, PENSION_CONTRACT_ADDRESS)
      
      // Approve if needed
      if (currentAllowance < totalRequired) {
        setStatus(t.approving)
        try {
          // Reset allowance first if needed
          if (currentAllowance > 0n) {
            const resetTx = await usdtContract.approve(PENSION_CONTRACT_ADDRESS, 0n)
            await resetTx.wait()
          }
          
          // Set new allowance
          const approveTx = await usdtContract.approve(PENSION_CONTRACT_ADDRESS, totalRequired)
          await approveTx.wait()
          setStatus(t.approveSuccess)
        } catch (approveError: any) {
          console.error('Approval error:', approveError)
          setStatus(`Approval failed: ${approveError.message || 'Unknown error'}`)
          setIsCreatingPlan(false)
          return
        }
      }
      
      // Create pension contract instance
      const pensionContract = new ethers.Contract(PENSION_CONTRACT_ADDRESS, vaultAbi, signer)
      
      // Create pension plan
      setStatus(t.creating)
      const tx = await pensionContract.createPlan(
        account, // beneficiary
        monthlyAmount,
        totalMonths
      )
      
      const receipt = await tx.wait()
      
      // Extract plan ID from events
      const planCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = pensionContract.interface.parseLog(log)
          return parsedLog && parsedLog.name === 'PlanCreated'
        } catch {
          return false
        }
      })
      
      if (planCreatedEvent) {
        const parsedLog = pensionContract.interface.parseLog(planCreatedEvent)
        const newPlanId = parsedLog?.args.planId.toString()
        setPlanId(newPlanId)
      }
      
      setStatus(t.planCreated)
    } catch (error: any) {
      console.error('Error creating plan:', error)
      setStatus(`Error: ${error.message || 'Unknown error'}`)
    } finally {
      setIsCreatingPlan(false)
    }
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t.title}</h1>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Parámetros</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* USDT Balance */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">{t.yourBalance}</div>
                <div className="text-lg font-semibold text-blue-600">
                  {isBalanceLoading 
                    ? t.loadingBalance 
                    : usdtBalance !== "0" 
                      ? `${usdtBalance} CAPITAL` 
                      : "0 CAPITAL"}
                </div>
              </div>
              
              {/* Desired Pension */}
              <div className="space-y-2">
                <Label htmlFor="pension">{t.desiredPension}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="pension"
                    type="number"
                    value={desiredPension}
                    onChange={(e) => setDesiredPension(e.target.value)}
                    className="pl-10"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Years Slider */}
              <div className="space-y-4">
                <Label>{t.retirementYears}</Label>
                <div className="px-2">
                  <Slider
                    value={years}
                    onValueChange={(value) => setYears(value as number[])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1 {t.year}</span>
                  <span className="font-medium text-lg text-gray-800">
                    {years[0]} {years[0] === 1 ? t.year : t.years}
                  </span>
                  <span>10 {t.years}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Resultados</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Required Capital */}
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">{t.requiredCapital}</div>
                <div className="text-4xl font-bold text-blue-600">
                  {formatCurrency(requiredCapital)}
                </div>
                <div className="text-xs text-gray-500 mt-2">{t.assumptions}</div>
              </div>

              {/* Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Pensión mensual</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(parseFloat(desiredPension) || 0)}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Total de meses</span>
                  </div>
                  <span className="font-semibold">{years[0] * 12} meses</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Total a recibir</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCurrency((parseFloat(desiredPension) || 0) * years[0] * 12)}
                  </span>
                </div>
              </div>

              {/* CTA with Create Plan Button */}
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
                  <p className="font-semibold">{t.startInvesting}</p>
                  <p className="text-sm opacity-90">{t.useUsdt}</p>
                </div>
                
                {/* Create Plan Button */}
                <div className="pt-2">
                  {account ? (
                    <Button
                      onClick={handleCreatePlan}
                      disabled={isCreatingPlan}
                      className="w-full"
                    >
                      {isCreatingPlan ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          {t.creatingPlan}
                        </>
                      ) : (
                        <>
                          <User className="mr-2 h-4 w-4" />
                          {t.createPlan}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      {t.connectToCreate}
                    </Button>
                  )}
                  
                  {status && (
                    <p className="mt-2 text-sm text-center text-gray-600">{status}</p>
                  )}
                  
                  {planId && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <span className="font-semibold">{t.planId}:</span> {planId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
