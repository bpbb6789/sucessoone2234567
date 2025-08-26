import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TOKEN_FACTORY_ABI } from '../../../abi/TokenFactoryAbi';
import { TOKEN_FACTORY_ADDRESS } from '../../../lib/addresses';
import { useCreateFee } from '../hooks/useCreateFee';

export default function CreateTokenPage() {
  const { address, isConnected } = useAccount();
  const { createFee, isLoading: isFeeLoading } = useCreateFee();
  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    description: '',
    imageUri: '',
    twitter: '',
    discord: ''
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) return;

    console.log('=== TOKEN CREATION DEBUG ===');
    console.log('Form data:', formData);
    console.log('Create fee:', createFee);
    console.log('Create fee (hex):', createFee?.toString(16));
    console.log('Create fee (decimal):', createFee?.toString());
    console.log('Is connected:', isConnected);
    console.log('Token Factory Address:', TOKEN_FACTORY_ADDRESS);

    if (!createFee) {
      console.error('❌ No create fee available - cannot proceed');
      return;
    }

    try {
      writeContract({
        address: TOKEN_FACTORY_ADDRESS as `0x${string}`,
        abi: TOKEN_FACTORY_ABI,
        functionName: 'deployERC20Token',
        args: [
          formData.name,
          formData.ticker
        ],
        value: createFee,
      });
      console.log('✅ Transaction submitted with value:', createFee.toString());
    } catch (error) {
      console.error('❌ Error submitting transaction:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-white text-center mb-2">Create Your Token</h1>
            <p className="text-gray-400 text-center mb-8">Launch your own token with pump.fun mechanics</p>
            
            {!isConnected ? (
              <div className="text-center">
                <p className="text-gray-400 mb-4">Connect your wallet to create a token</p>
                <ConnectButton />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white mb-2 font-medium">Token Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., My Awesome Token"
                    required
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Ticker Symbol *</label>
                  <input
                    name="ticker"
                    value={formData.ticker}
                    onChange={handleInputChange}
                    placeholder="e.g., MAT"
                    required
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your token project..."
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none min-h-20"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Image URL</label>
                  <input
                    name="imageUri"
                    value={formData.imageUri}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.png"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Twitter</label>
                  <input
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    placeholder="@yourtwitter"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2 font-medium">Discord</label>
                  <input
                    name="discord"
                    value={formData.discord}
                    onChange={handleInputChange}
                    placeholder="Discord invite link"
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit" 
                  disabled={isPending || isConfirming || isFeeLoading || !formData.name || !formData.ticker || !createFee}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  {isFeeLoading ? 'Loading fee...' : isPending ? 'Preparing...' : isConfirming ? 'Creating Token...' : `Create Token (${createFee ? (Number(createFee) / 1e18).toFixed(4) : '0'} ETH)`}
                </button>

                {hash && (
                  <div className="text-center mt-4">
                    <p className="text-gray-400">Transaction Hash:</p>
                    <p className="text-blue-400 break-all text-sm">{hash}</p>
                  </div>
                )}

                {isSuccess && (
                  <div className="text-center p-4 bg-green-900/20 border border-green-500 rounded-lg mt-4">
                    <p className="text-green-400">Token created successfully!</p>
                  </div>
                )}
              </form>
            )}

            <div className="mt-8 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-white font-semibold mb-2">Contract Details</h3>
              <p className="text-gray-400 text-sm">Network: Base Sepolia</p>
              <p className="text-gray-400 text-sm break-all">TokenFactory: {TOKEN_FACTORY_ADDRESS}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}