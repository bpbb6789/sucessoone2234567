import client from "@/lib/client";
import { GetAllSales } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";

const useGetAllSales = () => {
    return useQuery({
        queryKey: ["getAllSales"],
        queryFn: async () => {
            const { data } = await client.query({ query: GetAllSales });
            console.log(
                "Fetched token sales:",
                data.uniPumpCreatorSaless.items,
            );
            return data.uniPumpCreatorSaless.items;
        },
    });
};

export default useGetAllSales;
