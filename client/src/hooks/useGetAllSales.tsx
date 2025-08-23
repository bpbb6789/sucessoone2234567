import { useQuery } from "@apollo/client/react";
import { GetAllSales } from "../../../lib/queries";
import { PriceService } from "../../../lib/priceService";
import { useState, useEffect } from "react";

const useGetAllSales = () => {
    const [enrichedData, setEnrichedData] = useState<any>(null);
    const [enrichedLoading, setEnrichedLoading] = useState(true);
    
    const { data: salesData, loading, error } = useQuery(GetAllSales, {
        pollInterval: 30000, // Poll every 30 seconds for real-time updates
        errorPolicy: 'all', // Return both data and errors
        notifyOnNetworkStatusChange: true,
        onCompleted: (data: any) => {
            console.log("Fetched tokens from GraphQL:", data?.uniPumpCreatorSaless?.items);
        },
        onError: (error: any) => {
            console.error("Error fetching tokens from GraphQL:", error);
        }
    });

    useEffect(() => {
        const enrichTokenData = async () => {
            if (!salesData?.uniPumpCreatorSaless?.items || loading) {
                setEnrichedLoading(loading);
                return;
            }

            setEnrichedLoading(true);
            
            try {
                const enrichedTokens = await Promise.all(
                    salesData.uniPumpCreatorSaless.items.map(async (token: any) => {
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
                                createdAt: creationTime
                            };
                        } catch (error) {
                            console.error(`Error enriching token ${token.memeTokenAddress}:`, error);
                            // Return original token with defaults if enrichment fails
                            return {
                                ...token,
                                price: '0.000001',
                                priceChange24h: 0,
                                volume24h: '0',
                                marketCap: '0',
                                holders: 0,
                                createdAt: new Date()
                            };
                        }
                    })
                );

                setEnrichedData({
                    uniPumpCreatorSaless: {
                        items: enrichedTokens
                    }
                });
            } catch (error) {
                console.error('Error enriching token data:', error);
                setEnrichedData(salesData);
            } finally {
                setEnrichedLoading(false);
            }
        };

        enrichTokenData();
    }, [salesData, loading]);

    return {
        data: enrichedData,
        loading: enrichedLoading,
        error
    };
};

export { useGetAllSales };
export default useGetAllSales;
