import { useQuery } from "@apollo/client/react";
import { GetAllSales } from "../../../lib/queries";

const useGetAllSales = () => {
    return useQuery(GetAllSales, {
        onCompleted: (data: any) => {
            console.log("Fetched tokens from GraphQL:", data?.uniPumpCreatorSaless?.items);
        },
        onError: (error: any) => {
            console.error("Error fetching tokens from GraphQL:", error);
        }
    });
};

export { useGetAllSales };
export default useGetAllSales;
