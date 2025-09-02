"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown, MessageSquare, Crown, TrendingUp, Sparkles } from "lucide-react"
import { useState } from "react"

export default function TokenTrade() {
  const [currentView, setCurrentView] = useState<"image" | "chart">("chart")
  const [selectedPeriod, setSelectedPeriod] = useState<"1H" | "1D" | "1W" | "1M" | "All">("1D")
  const [activeTab, setActiveTab] = useState("comments")
  const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy")
  const [amount, setAmount] = useState("0.000111")
  const [comment, setComment] = useState("")

  const TokenTabs = () => (
    <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
      <Button variant="ghost" size="sm" className="gap-2 bg-background shadow-sm">
        <MessageSquare className="h-4 w-4" />
        Comments
      </Button>
      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
        <Crown className="h-4 w-4" />
        Holders
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">3</span>
      </Button>
      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        Activity
      </Button>
      <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        Details
      </Button>
    </div>
  )

  const chartData = {
    "1H": { points: "M50,150 L100,140 L150,130 L200,120 L250,110 L300,100 L350,90", price: "$757.53" },
    "1D": { points: "M50,160 L100,150 L150,140 L200,125 L250,105 L300,85 L350,65", price: "$757.53" },
    "1W": { points: "M50,170 L100,160 L150,155 L200,135 L250,115 L300,95 L350,75", price: "$757.53" },
    "1M": { points: "M50,180 L100,170 L150,165 L200,145 L250,125 L300,105 L350,85", price: "$757.53" },
    All: { points: "M50,190 L100,180 L150,175 L200,155 L250,135 L300,115 L350,95", price: "$757.53" },
  }

  const currentData = chartData[selectedPeriod]

  const handleAmountSelect = (newAmount: string) => {
    setAmount(newAmount)
  }

  const handleMaxAmount = () => {
    setAmount("0") // Would calculate max based on balance
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-2 min-h-[600px]">
          <div className="flex-[2] bg-card rounded-2xl p-6 border">
            <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg mb-6 relative overflow-hidden">
              {currentView === "chart" ? (
                <>
                  <svg className="w-full h-full" viewBox="0 0 400 220">
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path d={`${currentData.points} L350,200 L50,200 Z`} fill="url(#areaGradient)" />

                    {/* Line */}
                    <path
                      d={currentData.points}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-semibold border shadow-sm">
                    {currentData.price}
                    <span className="text-green-600 ml-2 text-xs">+48%</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src="/cute-cartoon-hat-token-logo.png"
                    alt="i have a hat token"
                    className="max-w-32 max-h-32 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant={selectedPeriod === "1H" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod("1H")}
              >
                1H
              </Button>
              <Button
                variant={selectedPeriod === "1D" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod("1D")}
              >
                1D
              </Button>
              <Button
                variant={selectedPeriod === "1W" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod("1W")}
              >
                1W
              </Button>
              <Button
                variant={selectedPeriod === "1M" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod("1M")}
              >
                1M
              </Button>
              <Button
                variant={selectedPeriod === "All" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod("All")}
              >
                All
              </Button>
            </div>
          </div>

          <div className="flex-[1] bg-card rounded-2xl p-6 border">
            <TokenTabs />
            <div className="space-y-6 mt-8">
              {/* Market Stats */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Market Cap</span>
                  <span className="text-sm font-medium text-green-500">↗ $757.53</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">24H Volume</span>
                  <span className="text-sm font-medium">⏰ $2.30</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Creator Earnings</span>
                  <span className="text-sm font-medium">$0.02</span>
                </div>
              </div>

              {/* Trading Section */}
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    className={`flex-1 ${tradeMode === "buy" ? "bg-green-500 hover:bg-green-600" : "bg-muted hover:bg-muted/80"}`}
                    onClick={() => setTradeMode("buy")}
                  >
                    Buy
                  </Button>
                  <Button
                    variant="outline"
                    className={`flex-1 ${tradeMode === "sell" ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : "bg-transparent"}`}
                    onClick={() => setTradeMode("sell")}
                  >
                    Sell
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">Balance 0 ETH</div>

                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg border">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                    placeholder="0.000111"
                    step="0.000001"
                    min="0"
                  />
                  <Button variant="outline" size="sm" className="flex items-center space-x-1 bg-background">
                    <span className="text-xs font-medium">ETH</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent hover:bg-muted"
                    onClick={() => handleAmountSelect("0.001")}
                  >
                    0.001 ETH
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent hover:bg-muted"
                    onClick={() => handleAmountSelect("0.01")}
                  >
                    0.01 ETH
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent hover:bg-muted"
                    onClick={() => handleAmountSelect("0.1")}
                  >
                    0.1 ETH
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent hover:bg-muted"
                    onClick={handleMaxAmount}
                  >
                    Max
                  </Button>
                </div>

                <textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 bg-muted rounded-lg text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
                />

                <Button
                  className={`w-full ${tradeMode === "buy" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                >
                  {tradeMode === "buy" ? "Buy" : "Sell"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}