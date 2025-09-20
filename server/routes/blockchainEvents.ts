
import { Router } from 'express';
import { getBlockchainEventListener } from '../services/blockchainEventListener';

const router = Router();

// Get blockchain event listener status
router.get('/api/blockchain/events/status', (req, res) => {
  try {
    const eventListener = getBlockchainEventListener();
    
    if (!eventListener) {
      return res.status(503).json({
        error: 'Blockchain event listener not initialized'
      });
    }

    res.json({
      success: true,
      status: 'running',
      message: 'Blockchain event listener is monitoring for trading events'
    });
  } catch (error) {
    console.error('❌ Error checking event listener status:', error);
    res.status(500).json({ error: 'Failed to get event listener status' });
  }
});

// Manually restart blockchain event listener
router.post('/api/blockchain/events/restart', async (req, res) => {
  try {
    const eventListener = getBlockchainEventListener();
    
    if (!eventListener) {
      return res.status(503).json({
        error: 'Blockchain event listener not initialized'
      });
    }

    console.log('🔄 Manually restarting blockchain event listener...');
    
    await eventListener.stopListening();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await eventListener.startListening();

    res.json({
      success: true,
      message: 'Blockchain event listener restarted successfully'
    });
  } catch (error) {
    console.error('❌ Error restarting event listener:', error);
    res.status(500).json({ error: 'Failed to restart event listener' });
  }
});

export { router as blockchainEventsRouter };
