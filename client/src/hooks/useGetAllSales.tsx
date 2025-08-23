import { useQuery } from "@apollo/client/react";
import { GetAllSales } from "../../../lib/queries";
import { PriceService } from "../../../lib/priceService";
import { useState, useEffect, useCallback } from "react";

// Define a type for enriched token data for better type safety
interface EnrichedTokenData {
    memeTokenAddress: string;
    price: string;
    priceChange24h: number;
    volume24h: string;
    marketCap: string;
    holders: number;
    createdAt: Date | null;
    // Add any other properties from the original token data if needed
    [key: string]: any;
}

export const useGetAllSales = () => {
    const [salesData, setSalesData] = useState<EnrichedTokenData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<number>(0);

    const CACHE_DURATION = 30000; // 30 seconds cache

    const fetchSalesData = useCallback(async () => {
        // Don't fetch if we just fetched recently
        const now = Date.now();
        if (now - lastFetch < CACHE_DURATION && salesData.length > 0) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch basic token data from GraphQL
            const result = await client.query({
                query: GetAllSales,
                fetchPolicy: 'network-only', // Ensure we get fresh data from the server
            });

            if (result.errors) {
                console.error("GraphQL Error fetching tokens:", result.errors);
                setError('Failed to fetch token data');
                setIsLoading(false);
                return;
            }

            const tokens = result.data?.uniPumpCreatorSaless?.items || [];
            console.log("Fetched tokens from GraphQL:", tokens);

            if (tokens.length === 0) {
                setSalesData([]);
                setIsLoading(false);
                return;
            }

            // Enrich token data with price, holders, and creation time
            const enrichedTokens = await Promise.all(
                tokens.map(async (token: any) => {
                    try {
                        // Get real price data
                        const priceData = await PriceService.getTokenPrice(token.memeTokenAddress);

                        // Get holder count
                        const holderCount = await PriceService.getHolderCount(token.memeTokenAddress);

                        // Get creation time
                        const creationTime = await PriceService.getTokenCreationTime(token.memeTokenAddress);

                        return {
                            ...token,
                            price: priceData.price,
                            priceChange24h: priceData.priceChange24h,
                            volume24h: priceData.volume24h,
                            marketCap: priceData.marketCap,
                            holders: holderCount,
                            createdAt: creationTime ? new Date(creationTime) : null // Ensure createdAt is a Date object or null
                        };
                    } catch (enrichError) {
                        console.error(`Error enriching token ${token.memeTokenAddress}:`, enrichError);
                        // Return original token with defaults if enrichment fails
                        return {
                            ...token,
                            price: '0.000001',
                            priceChange24h: 0,
                            volume24h: '0',
                            marketCap: '0',
                            holders: 0,
                            createdAt: null
                        };
                    }
                })
            );

            setSalesData(enrichedTokens);
            setLastFetch(now);
        } catch (err) {
            console.error('Error fetching sales data:', err);
            setError('Failed to fetch sales data');
        } finally {
            setIsLoading(false);
        }
    }, [lastFetch, salesData.length]); // Dependency array includes lastFetch and salesData.length

    useEffect(() => {
        fetchSalesData();

        // Set up polling every 60 seconds (reduced from 10)
        const interval = setInterval(fetchSalesData, 60000);

        return () => clearInterval(interval);
    }, [fetchSalesData]);

    return {
        data: salesData,
        loading: isLoading,
        error
    };
};

// Real GraphQL client using fetch API
const client = {
    query: async ({ query }: any) => {
        try {
            const response = await fetch('https://unipump-contracts.onrender.com/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    query: `
                        query GetAllSales {
                            uniPumpCreatorSaless(orderBy: { id: desc }, first: 100) {
                                items {
                                    memeTokenAddress
                                    name
                                    symbol
                                    bio
                                    createdBy
                                    totalSupply
                                    isUSDCToken0
                                    imageUri
                                    twitter
                                    discord
                                }
                            }
                        }
                    `
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.errors) {
                return { data: {}, loading: false, errors: result.errors };
            }

            return { data: result.data, loading: false, errors: undefined };
        } catch (error) {
            console.error('GraphQL fetch error:', error);
            return { data: {}, loading: false, errors: [error] };
        }
    }
};

export default useGetAllSales;