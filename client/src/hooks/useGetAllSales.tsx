import { useQuery } from "@tanstack/react-query";

const useGetAllSales = () => {
    return useQuery({
        queryKey: ["getAllTokens"],
        queryFn: async () => {
            try {
                const response = await fetch('/api/tokens');
                if (!response.ok) {
                    throw new Error('Failed to fetch tokens');
                }
                const tokens = await response.json();
                console.log("Fetched tokens:", tokens);
                return tokens;
            } catch (error) {
                console.error("Error fetching tokens:", error);
                // Return empty array if API fails
                return [];
            }
        },
    });
};

export default useGetAllSales;
