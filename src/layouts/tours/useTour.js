import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_TOUR } from "./tours.gql";

export function useTour() {
  const { tourId } = useParams();

  const { data, loading, error, refetch } = useQuery(GET_TOUR, {
    variables: { id: tourId },
    skip: !tourId,
    fetchPolicy: "cache-and-network",
  });

  return {
    tourId,
    tour: data?.getTour || null,
    loading,
    error,
    refetch,
  };
}
