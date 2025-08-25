
# Doppler V4 vs UniPump Integration

This project integrates with two different systems for different purposes:

## Doppler V4 SDK (Create Pad Feature)

**Purpose**: Price discovery and liquidity bootstrapping for new tokens
**Use Case**: When users want to launch new tokens with gradual dutch auction mechanics

**Features**:
- Gradual dutch auction price discovery
- Automated liquidity migration
- Configurable time parameters and price curves
- Built on Uniswap V4 with custom hooks
- Optional governance contracts

**Implementation**: `server/doppler.ts` using `doppler-v4-sdk`

**Flow**:
1. User creates a "pad" (token launch)
2. Token deployed with Doppler V4 contracts
3. Price discovery phase with gradual dutch auction
4. Automatic migration to full trading when targets are met

## UniPump Contracts (Channel/Creator Feature)

**Purpose**: Direct token creation and bonding curve trading
**Use Case**: When users want to create tokens with immediate trading

**Features**:
- Direct token creation
- Bonding curve mechanics
- Immediate trading capability
- Creator fees and hooks

**Implementation**: Separate UniPump integration (not in current doppler.ts)

**Flow**:
1. User creates a channel/token
2. Token deployed with UniPump contracts
3. Immediate trading available via bonding curves

## Key Differences

| Feature | Doppler V4 (Create Pad) | UniPump (Channels) |
|---------|-------------------------|-------------------|
| Launch Type | Price Discovery | Immediate Trading |
| Price Mechanism | Dutch Auction | Bonding Curve |
| Time Factor | Scheduled epochs | Real-time |
| Liquidity | Bootstrapped then migrated | Immediate |
| Complexity | Higher (more features) | Lower (simpler) |
| Use Case | Serious token launches | Quick meme tokens |

## Network Support

### Doppler V4
- Base Mainnet (8453) ✅
- Base Sepolia (84532) 🧪
- Unichain (130) ✅
- Ink (57073) ✅

### UniPump
- Base Sepolia (84532) ✅ (deployed contracts available)
- Other networks: TBD

## Configuration

Both systems require different contract addresses and configuration:

- **Doppler V4**: Uses `DOPPLER_V4_ADDRESSES` from the SDK
- **UniPump**: Uses custom deployed contract addresses

Make sure to use the correct service for each feature!
