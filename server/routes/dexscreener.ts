
import { Router } from 'express';
import { getDexScreenerData } from '../dexscreener';

const router = Router();

// Get DexScreener data for a token
router.get('/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    
    if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
      return res.status(400).json({ error: 'Invalid token address' });
    }

    const data = await getDexScreenerData(tokenAddress);
    
    if (!data) {
      return res.status(404).json({ error: 'No trading data found for this token' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching DexScreener data:', error);
    res.status(500).json({ error: 'Failed to fetch trading data' });
  }
});

export default router;
