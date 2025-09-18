
import { db } from "./db";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database schema...');
    
    // Create the creator_coins table (most important for your current error)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS creator_coins (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_address TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        content_type TEXT NOT NULL,
        media_cid TEXT NOT NULL,
        thumbnail_cid TEXT,
        metadata_uri TEXT,
        coin_name TEXT NOT NULL,
        coin_symbol TEXT NOT NULL,
        coin_address TEXT,
        zora_factory_address TEXT,
        zora_platform TEXT NOT NULL DEFAULT 'zora',
        uniswap_v4_pool TEXT,
        hook_address TEXT,
        bonding_curve_factory_address TEXT,
        bonding_curve_exchange_address TEXT,
        bonding_curve_deployment_tx_hash TEXT,
        has_bonding_curve BOOLEAN DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'pending',
        deployment_tx_hash TEXT,
        current_price TEXT DEFAULT '0.000001',
        market_cap TEXT DEFAULT '0',
        volume_24h TEXT DEFAULT '0',
        price_change_24h DECIMAL DEFAULT 0,
        holders INTEGER DEFAULT 0,
        total_supply TEXT DEFAULT '1000000',
        bonding_curve_progress TEXT DEFAULT '0',
        currency TEXT DEFAULT 'ETH',
        starting_market_cap TEXT DEFAULT 'LOW',
        twitter TEXT,
        discord TEXT,
        website TEXT,
        original_url TEXT,
        platform TEXT,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_address TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        actor_address TEXT,
        actor_name TEXT,
        actor_avatar TEXT,
        action_url TEXT,
        metadata JSONB,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create wallet_profiles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS wallet_profiles (
        address TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        avatar_url TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create web3_channels table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS web3_channels (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        owner TEXT,
        created_by TEXT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        ticker TEXT,
        coin_address TEXT,
        chain_id INTEGER DEFAULT 8453,
        avatar_cid TEXT,
        cover_cid TEXT,
        category TEXT,
        description TEXT,
        zora_platform TEXT,
        zora_factory_address TEXT,
        metadata_uri TEXT,
        currency TEXT DEFAULT 'ETH',
        tx_hash TEXT,
        holders INTEGER DEFAULT 0,
        current_price TEXT DEFAULT '0',
        market_cap TEXT DEFAULT '0',
        volume_24h TEXT DEFAULT '0',
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create creator_coin_likes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS creator_coin_likes (
        coin_id VARCHAR REFERENCES creator_coins(id) ON DELETE CASCADE,
        user_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (coin_id, user_address)
      )
    `);

    // Create creator_coin_trades table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS creator_coin_trades (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        coin_id VARCHAR REFERENCES creator_coins(id) ON DELETE CASCADE,
        user_address TEXT NOT NULL,
        trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
        amount TEXT NOT NULL,
        price TEXT NOT NULL,
        transaction_hash TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create creator_coin_comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS creator_coin_comments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        coin_id VARCHAR REFERENCES creator_coins(id) ON DELETE CASCADE,
        user_address TEXT NOT NULL,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database schema initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}
