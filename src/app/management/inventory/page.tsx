import { fetchProductsWithStockAction, fetchStockLocationsAction } from "./actions";
import InventoryTableClient from "@/components/inventory/InventoryTableClient";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const search = typeof params.query === 'string' ? params.query : '';

  const [productsRes, locations] = await Promise.all([
    fetchProductsWithStockAction(search || undefined, page, 50),
    fetchStockLocationsAction(),
  ]);

  const { products, count } = productsRes;

  return (
    <InventoryTableClient 
      products={products as any} 
      locations={locations as any} 
      count={count} 
      initialPage={page} 
      search={search} 
    />
  );
}
