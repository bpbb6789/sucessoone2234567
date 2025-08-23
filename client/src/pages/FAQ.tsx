
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "How do I create a new token?",
    answer: "To create a new token, navigate to the 'Launch Channel' section, fill in your token details including name, symbol, and description, then click 'Create Token'. You'll need to pay a small fee in ETH to deploy the contract.",
    category: "Getting Started"
  },
  {
    id: "2",
    question: "What are the fees for trading?",
    answer: "Trading fees are typically 0.3% of the transaction amount. This includes the swap fee and gas costs. The exact amount depends on network congestion and the size of your trade.",
    category: "Trading"
  },
  {
    id: "3",
    question: "How do I connect my wallet?",
    answer: "Click the 'Connect Wallet' button in the top right corner and select your preferred wallet (MetaMask, WalletConnect, etc.). Make sure you're connected to the Base network.",
    category: "Wallet"
  },
  {
    id: "4",
    question: "What is slippage tolerance?",
    answer: "Slippage tolerance is the maximum price difference you're willing to accept during a trade. Higher slippage allows trades to execute faster but may result in worse prices. We recommend 1-3% for most trades.",
    category: "Trading"
  },
  {
    id: "5",
    question: "Can I edit my token after creation?",
    answer: "Once deployed, token contracts are immutable and cannot be changed. However, you can update the metadata like description and social links through the channel management interface.",
    category: "Tokens"
  },
  {
    id: "6",
    question: "How do I add liquidity to my token?",
    answer: "After creating your token, you can add liquidity by going to the token page and clicking 'Add Liquidity'. You'll need to provide both your token and ETH in equal dollar amounts.",
    category: "Liquidity"
  },
  {
    id: "7",
    question: "What networks are supported?",
    answer: "Currently, we support the Base network (Ethereum Layer 2). This provides low fees and fast transactions while maintaining Ethereum security.",
    category: "Technical"
  },
  {
    id: "8",
    question: "How do I report a suspicious token?",
    answer: "If you encounter a suspicious or fraudulent token, please report it through our community guidelines page. We take security seriously and investigate all reports promptly.",
    category: "Safety"
  }
];

const categories = Array.from(new Set(faqData.map(item => item.category)));

export default function FAQ() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQ = selectedCategory === "All" 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" data-testid="page-faq">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedCategory === "All"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategory === category
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQ.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-0">
              <button
                onClick={() => toggleExpanded(item.id)}
                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{item.question}</h3>
                    <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {item.category}
                    </span>
                  </div>
                  {expandedItems.has(item.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {expandedItems.has(item.id) && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t pt-4 text-gray-600 dark:text-gray-300">
                    {item.answer}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFAQ.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No FAQs Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No questions found for the selected category.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact Section */}
      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Can't find the answer you're looking for? Join our community or contact support.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Join Discord
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Contact Support
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
