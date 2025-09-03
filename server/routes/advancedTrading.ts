// Advanced Trading Routes with Zora Hook Integration
import type { Express } from "express";
import { zoraHookManager, HookType, AutomatedTradingParams } from "../hooks/zoraHookManager";
import { storage } from "../storage";
// Helper function to handle database errors gracefully
function handleDatabaseError(error: any, operation: string) {
  console.error(`Database error in ${operation}:`, error);
  return {
    error: true,
    message: "Database temporarily unavailable",
    operation
  };
}

export function registerAdvancedTradingRoutes(app: Express) {
  
  // Get Hook Analytics Dashboard
  app.get('/api/trading/hooks/analytics', async (req, res) => {
    try {
      console.log('📊 Fetching hook analytics dashboard...');
      
      // Get all registered hooks
      const registeredHooks = await zoraHookManager.getRegisteredHooks();
      
      // Get analytics for each hook type
      const analyticsPromises = registeredHooks.map(async (hook) => {
        const analytics = await zoraHookManager.getHookAnalytics(hook.hook);
        return {
          ...hook,
          ...analytics
        };
      });
      
      const hookAnalytics = await Promise.all(analyticsPromises);
      
      // Calculate overall platform metrics
      const platformMetrics = {
        totalHooks: registeredHooks.length,
        totalVolume: hookAnalytics.reduce((sum, h) => sum + parseFloat(h.totalVolume), 0),
        totalRewards: hookAnalytics.reduce((sum, h) => sum + parseFloat(h.totalRewardsDistributed), 0),
        averageAPY: hookAnalytics.reduce((sum, h) => sum + h.averageAPY, 0) / hookAnalytics.length || 0
      };
      
      res.json({
        platformMetrics,
        hookAnalytics,
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Hook analytics fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch hook analytics' });
    }
  });

  // Create Advanced Pool with Automated Features
  app.post('/api/trading/pools/advanced', async (req, res) => {
    try {
      const {
        coinId,
        hookType = HookType.CONTENT_COIN,
        minLiquidity = '0.1',
        maxSlippage = 5,
        autoRebalance = true,
        lpRewardPercentage = 33.33,
        marketRewardPercentage = 66.67
      } = req.body;

      if (!coinId) {
        return res.status(400).json({ error: 'Coin ID is required' });
      }

      console.log(`🚀 Creating advanced pool for coin: ${coinId}`);

      // Get coin data
      const coin = await storage.getCreatorCoin(coinId);
      if (!coin || !coin.coinAddress) {
        return res.status(404).json({ error: 'Coin not found or not deployed' });
      }

      // Setup automated trading parameters
      const tradingParams: AutomatedTradingParams = {
        coinAddress: coin.coinAddress,
        hookType: hookType as HookType,
        minLiquidity,
        maxSlippage,
        autoRebalance,
        rewardDistribution: {
          lpPercentage: lpRewardPercentage,
          marketPercentage: marketRewardPercentage
        }
      };

      // Create advanced pool with specialized hook
      const poolResult = await zoraHookManager.createAdvancedPool(tradingParams);

      if (!poolResult.success) {
        return res.status(400).json({ error: poolResult.error });
      }

      // Update coin record with pool information
      await storage.updateCreatorCoin(coinId, {
        uniswapV4Pool: poolResult.poolId,
        hookAddress: poolResult.hookAddress,
        metadata: {
          ...coin.metadata,
          advancedPool: {
            poolId: poolResult.poolId,
            hookAddress: poolResult.hookAddress,
            hookType,
            autoRebalance,
            rewardDistribution: tradingParams.rewardDistribution,
            createdAt: new Date().toISOString()
          }
        }
      });

      console.log(`✅ Advanced pool created successfully: ${poolResult.poolId}`);
      
      res.json({
        success: true,
        poolId: poolResult.poolId,
        hookAddress: poolResult.hookAddress,
        txHash: poolResult.txHash,
        features: {
          automatedRewards: true,
          autoRebalancing: autoRebalance,
          hookType,
          rewardDistribution: tradingParams.rewardDistribution
        }
      });

    } catch (error) {
      console.error('❌ Advanced pool creation failed:', error);
      res.status(500).json({ error: 'Failed to create advanced pool' });
    }
  });

  // Execute Multi-Hop Trading
  app.post('/api/trading/multihop', async (req, res) => {
    try {
      const { tradingPath, amountIn, minAmountOut, traderAddress } = req.body;

      if (!tradingPath || !Array.isArray(tradingPath) || tradingPath.length < 2) {
        return res.status(400).json({ error: 'Valid trading path with at least 2 tokens required' });
      }

      if (!amountIn || !minAmountOut || !traderAddress) {
        return res.status(400).json({ error: 'Amount in, min amount out, and trader address are required' });
      }

      console.log(`🔄 Executing multi-hop trade: ${tradingPath.join(' → ')}`);

      // Execute multi-hop trade through hook system
      const tradeResult = await zoraHookManager.executeMultiHopTrade({
        path: tradingPath,
        amountIn,
        minAmountOut,
        trader: traderAddress
      });

      if (!tradeResult.success) {
        return res.status(400).json({ error: tradeResult.error });
      }

      // Log trade for analytics
      const tradeRecord = {
        id: require('crypto').randomUUID(),
        tradingPath,
        amountIn,
        minAmountOut,
        amountOut: tradeResult.amountOut,
        trader: traderAddress,
        txHash: tradeResult.txHash,
        timestamp: new Date().toISOString(),
        tradeType: 'multihop'
      };

      // Store trade record (you might want to add this to your schema)
      console.log('📝 Trade executed:', tradeRecord);

      res.json({
        success: true,
        amountOut: tradeResult.amountOut,
        txHash: tradeResult.txHash,
        tradingPath,
        executedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Multi-hop trade failed:', error);
      res.status(500).json({ error: 'Failed to execute multi-hop trade' });
    }
  });

  // Distribute Hook Rewards
  app.post('/api/trading/rewards/distribute/:poolId', async (req, res) => {
    try {
      const { poolId } = req.params;
      const { hookAddress } = req.body;

      if (!poolId || !hookAddress) {
        return res.status(400).json({ error: 'Pool ID and hook address are required' });
      }

      console.log(`💰 Distributing rewards for pool: ${poolId}`);

      // Execute reward distribution
      const rewardData = await zoraHookManager.distributeRewards(poolId, hookAddress);

      if (!rewardData) {
        return res.status(400).json({ error: 'Insufficient trading volume for reward distribution' });
      }

      res.json({
        success: true,
        rewardData,
        message: 'Rewards distributed successfully'
      });

    } catch (error) {
      console.error('❌ Reward distribution failed:', error);
      res.status(500).json({ error: 'Failed to distribute rewards' });
    }
  });

  // Get Real-Time Trading Analytics
  app.get('/api/trading/analytics/:coinId', async (req, res) => {
    try {
      const { coinId } = req.params;
      
      console.log(`📈 Fetching trading analytics for coin: ${coinId}`);

      // Get coin data
      const coin = await storage.getCreatorCoin(coinId);
      if (!coin) {
        return res.status(404).json({ error: 'Coin not found' });
      }

      // Get recent trades
      const trades = await storage.getCreatorCoinTrades(coinId, { limit: 100 });
      
      // Calculate analytics
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const oneHourAgo = now - (60 * 60 * 1000);

      const recentTrades = trades.filter(trade => 
        new Date(trade.createdAt!).getTime() > oneDayAgo
      );

      const volume24h = recentTrades.reduce((sum, trade) => 
        sum + parseFloat(trade.amount), 0
      );

      const volumeLastHour = trades
        .filter(trade => new Date(trade.createdAt!).getTime() > oneHourAgo)
        .reduce((sum, trade) => sum + parseFloat(trade.amount), 0);

      const priceChange = recentTrades.length >= 2 
        ? ((parseFloat(recentTrades[0].price) - parseFloat(recentTrades[recentTrades.length - 1].price)) / parseFloat(recentTrades[recentTrades.length - 1].price)) * 100
        : 0;

      // Get hook analytics if available
      let hookAnalytics = null;
      if (coin.hookAddress) {
        hookAnalytics = await zoraHookManager.getHookAnalytics(coin.hookAddress);
      }

      const analytics = {
        coinId,
        currentPrice: coin.currentPrice,
        marketCap: coin.marketCap,
        volume24h: volume24h.toString(),
        volumeLastHour: volumeLastHour.toString(),
        priceChange24h: priceChange,
        totalTrades: trades.length,
        recentTrades: recentTrades.slice(0, 10), // Last 10 trades
        holders: coin.holders || 0,
        hookAnalytics,
        lastUpdated: new Date().toISOString()
      };

      res.json(analytics);

    } catch (error) {
      console.error('❌ Trading analytics fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch trading analytics' });
    }
  });

  // Register Hook with Registry
  app.post('/api/trading/hooks/register', async (req, res) => {
    try {
      const { hookAddress, hookType, version = '1.0.0' } = req.body;

      if (!hookAddress || !hookType) {
        return res.status(400).json({ error: 'Hook address and type are required' });
      }

      console.log(`📝 Registering hook: ${hookAddress} (${hookType})`);

      // Register hook with Zora registry
      const result = await zoraHookManager.registerHook(hookAddress, hookType as HookType, version);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        success: true,
        txHash: result.txHash,
        hookAddress,
        hookType,
        version,
        registeredAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Hook registration failed:', error);
      res.status(500).json({ error: 'Failed to register hook' });
    }
  });

  // Get Hook Registry Data
  app.get('/api/trading/hooks/registry', async (req, res) => {
    try {
      console.log('📋 Fetching hook registry data...');

      const registeredHooks = await zoraHookManager.getRegisteredHooks();
      
      // Enhance with analytics data
      const enhancedHooks = await Promise.all(
        registeredHooks.map(async (hook) => {
          const analytics = await zoraHookManager.getHookAnalytics(hook.hook);
          return {
            ...hook,
            analytics
          };
        })
      );

      res.json({
        totalHooks: registeredHooks.length,
        hooks: enhancedHooks,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Hook registry fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch hook registry' });
    }
  });
}