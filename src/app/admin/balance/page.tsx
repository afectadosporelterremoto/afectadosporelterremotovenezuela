import React from "react";
import { getOfficialBalance } from "@/app/actions";
import AdminBalanceForm from "@/components/AdminBalanceForm";

export const metadata = {
  title: "Administrar Balance Oficial | Terremoto Venezuela",
};

export default async function AdminBalancePage() {
  const officialBalance = await getOfficialBalance();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Administrar Balance Oficial</h1>
        <p className="text-xs text-gray-500">
          Modifique manualmente las cifras oficiales del sismo. Estas cifras son de lectura pública en la home.
        </p>
      </div>

      <AdminBalanceForm initialBalance={officialBalance} />
    </div>
  );
}
