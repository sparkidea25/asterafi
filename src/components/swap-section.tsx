'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { TrendingUp } from 'lucide-react'
import capitalAbi from '/abi/capital.json'
import vaultAbi from '/abi/vault.json'

// Contract addresses
const VAULT_ADDRESS = '0xDAC93F20B8344f78DeADbBe95BDE01582819E6D2'
const CAPITAL_ADDRESS = '0x80CC64698B305499eE3827BE8974ae47a2B19803'

interface SwapSectionProps {
  language: 'es' | 'en'
}

export default function SwapSection({ language }: SwapSectionProps) {
  const [toAmount, setToAmount] = useState('')
  const [lockTime, setLockTime] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const [account, setAccount] = useState<string | null>(null)

  // Detect connected account from injected provider (ConnectKit / wagmi already manages it)
  useEffect(() => {
    const loadAccount = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        console.log(accounts, 'connected accounts')
        if (accounts.length > 0) {
          setAccount(accounts[0].address)
        }
      }
    }
    loadAccount()
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', loadAccount)
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', loadAccount)
      }
    }
  }, [])

  // const handleInvest = async () => {
  //   if (!account || !toAmount || !lockTime) {
  //     setStatus('Please connect wallet and fill all fields')
  //     return
  //   }

  //   try {
  //     setStatus('Preparing transaction...')
  //     const provider = new ethers.BrowserProvider(window.ethereum)
  //     const signer = await provider.getSigner()

  //     // Step 1: Approve vault
  //     setStatus('Approving vault to spend CAPITAL...')
  //     console.log(ethers.parseUnits(toAmount, 18), 'Parsed amount for approval')
  //     const token = new ethers.Contract(CAPITAL_ADDRESS, capitalAbi, signer)
  //     console.log(token, 'check approve function')
  //     // const capital = new ethers.Contract(CAPITAL_ADDRESS, capitalAbi, signer)
  //     const approveTx = await token.approve(
  //       VAULT_ADDRESS,
  //       ethers.parseUnits(toAmount, 18)
  //     )
  //     await approveTx.wait()
  //     setStatus('Approval confirmed ✅')

  //     // Step 2: Deposit into vault
  //     setStatus('Depositing into vault...')
  //     const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, signer)
  //     const depositTx = await vault.deposit(
  //       ethers.parseUnits(toAmount, 18),
  //       BigInt(lockTime)
  //     )
  //     await depositTx.wait()
  //     setStatus('Deposit successful 🎉')
  //   } catch (err: any) {
  //     console.error(err)
  //     setStatus(`Transaction failed: ${err.message}`)
  //   }
  // }

  const handleInvest = async () => {
  if (!account || !toAmount || !lockTime) {
    setStatus('Please connect wallet and fill all fields')
    return
  }

  try {
    setStatus('Preparing transaction...')
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const token = new ethers.Contract(CAPITAL_ADDRESS, capitalAbi, signer)
    
    const amountToInvest = ethers.parseUnits(toAmount, 18)
    console.log('Amount to invest:', amountToInvest.toString())

    // Pre-flight checks
    setStatus('Checking balances and allowances...')
    
const network = await provider.getNetwork();

console.log("Chain ID:", Number(network.chainId));
console.log("Network:", network);
    // Check token balance
    console.log(account, 'log account details')
    const balance = await token.balanceOf(account)
    console.log('Token balance:', balance.toString())
    
    if (balance < amountToInvest) {
      setStatus(`Insufficient CAPITAL balance. You have ${ethers.formatUnits(balance, 18)}, need ${toAmount}`)
      return
    }

    // Check current allowance
    const currentAllowance = await token.allowance(account, VAULT_ADDRESS)
    console.log('Current allowance:', currentAllowance.toString())

    // Only approve if needed
    if (currentAllowance < amountToInvest) {
      setStatus('Approving vault to spend CAPITAL...')
      
      try {
        // Reset allowance to 0 first if it's not 0 (some tokens require this)
        if (currentAllowance > 0n) {
          console.log('Resetting allowance to 0...')
          const resetTx = await token.approve(VAULT_ADDRESS, 0n)
          await resetTx.wait()
          console.log('Allowance reset to 0')
        }

        // Set new allowance
        const approveTx = await token.approve(VAULT_ADDRESS, amountToInvest)
        await approveTx.wait()
        setStatus('Approval confirmed ✅')
        
        // Verify approval
        const newAllowance = await token.allowance(account, VAULT_ADDRESS)
        console.log('New allowance:', newAllowance.toString())
        
        if (newAllowance < amountToInvest) {
          throw new Error('Approval failed - insufficient allowance after approval')
        }
        
      } catch (approveError: any) {
        console.error('Approval error:', approveError)
        if (approveError.code === 'CALL_EXCEPTION') {
          setStatus('Approval failed - please check token contract or try smaller amount')
        } else {
          setStatus(`Approval failed: ${approveError.message}`)
        }
        return
      }
    } else {
      setStatus('Sufficient allowance already exists ✅')
    }

    // Step 2: Deposit into vault
    setStatus('Depositing into vault...')
    
    try {
      const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, signer)
      
      // Estimate gas first
      // const gasEstimate = await vault.deposit.estimateGas(
      //   amountToInvest,
      //   BigInt(lockTime)
      // )

      // const gasEstimate = await signer.estimateGas({
      //   to: VAULT_ADDRESS,
      //   data: vault.interface.encodeFunctionData("deposit", [
      //     amountToInvest,
      //     BigInt(lockTime),
      //   ]),
      // });
      // console.log('Gas estimate:', gasEstimate.toString())

      const depositTx = await vault.deposit(
        amountToInvest,
        BigInt(lockTime),
        // {
        //   gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        // }
      )
      
      await depositTx.wait()
      setStatus('Deposit successful 🎉')
      
      // Refresh balances or update UI as needed
      // await refreshBalances()
      
    } catch (depositError: any) {
      console.error('Deposit error:', depositError)
      if (depositError.code === 'CALL_EXCEPTION') {
        setStatus('Deposit failed - please check vault contract or parameters')
      } else {
        setStatus(`Deposit failed: ${depositError.message}`)
      }
      return
    }

  } catch (err: any) {
    console.error('General error:', err)
    setStatus(`Transaction failed: ${err.message || 'Unknown error'}`)
  }
}


  const translations = {
    es: {
      title: 'Invierte en tu Futuro',
      subtitle: 'Compra $CAPITAL para asegurar tu jubilación',
      invest: 'Invertir',
    },
    en: {
      title: 'Invest in Your Future',
      subtitle: 'Buy $CAPITAL to secure your retirement',
      invest: 'Invest',
    },
  }
  const t = translations[language]

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t.title}</h1>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Invest in $CAPITAL</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Investment Input */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount to Invest</span>
              </div>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" className="px-4">
                  $CAPITAL
                </Button>
              </div>
            </div>

            {/* Unlock Time Input */}
            <div className="space-y-2">
              <label className="font-medium">Select Unlock Date & Time</label>
              <input
                type="datetime-local"
                onChange={(e) => {
                  const date = new Date(e.target.value)
                  if (!isNaN(date.getTime())) {
                    setLockTime(Math.floor(date.getTime() / 1000))
                  }
                }}
                className="p-2 border rounded"
              />
            </div>

            {/* Invest Button */}
            <Button
              onClick={handleInvest}
              className="w-full"
              size="lg"
              disabled={!account}
            >
              {t.invest}
            </Button>

            {status && <p className="text-sm text-gray-700">{status}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
