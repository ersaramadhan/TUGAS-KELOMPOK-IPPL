import { ExpensesManager } from "@/components/dashboard/ExpensesManager";
import { getOwnerExpensesData } from "@/lib/owner-data";

export default async function ExpensesPage() {
  const { metrics, expenses } = await getOwnerExpensesData();

  return (
    <ExpensesManager
      expenses={expenses ?? []}
      metrics={metrics}
    />
  );
}
