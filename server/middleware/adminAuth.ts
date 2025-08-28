
import { Request, Response, NextFunction } from 'express';

interface AdminRequest extends Request {
  isAdmin?: boolean;
}

// Simple admin authentication middleware
// In production, use proper JWT tokens, role-based access control, etc.
export const adminAuth = (req: AdminRequest, res: Response, next: NextFunction) => {
  const adminToken = req.headers.authorization;
  
  // Check for admin token (in production, validate JWT token)
  if (adminToken === 'Bearer admin-token-123' || process.env.NODE_ENV === 'development') {
    req.isAdmin = true;
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Admin only routes protection
export const requireAdmin = (req: AdminRequest, res: Response, next: NextFunction) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};
