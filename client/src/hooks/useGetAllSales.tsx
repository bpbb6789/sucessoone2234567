import { useQuery } from "@tanstack/react-query";

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
                return { tokenSales: tokens }; // Wrap in tokenSales to match expected structure
            } catch (error) {
                console.error("Error fetching tokens:", error);
                // Return empty array if API fails
                return { tokenSales: [] };
            }
        },
    });
};

export { useGetAllSales };
export default useGetAllSales;
