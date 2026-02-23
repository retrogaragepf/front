"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import {
  adminSalesService,
  type AdminSaleRecord,
  type SimpleSaleStatus,
} from "@/src/services/adminSales.services";

type StatusFilter = "all" | SimpleSaleStatus;

function formatDate(iso: string): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCOP(value: number): string {
  return Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function nextStatusLabel(status: SimpleSaleStatus): string {
  if (status === "comprado") return "Marcar enviado";
  if (status === "enviado") return "Marcar recibido";
  return "Recibido";
}

function badgeClass(status: SimpleSaleStatus): string {
  if (status === "comprado") {
    return "border-amber-600 text-amber-800 bg-amber-100";
  }
  if (status === "enviado") {
    return "border-sky-700 text-sky-800 bg-sky-100";
  }
  return "border-emerald-700 text-emerald-800 bg-emerald-100";
}

export default function AdminSalesSection(): ReactElement {
  const [rows, setRows] = useState<AdminSaleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminSalesService.getSalesRecords();
      setRows(data);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((row) => row.statusSimple === filter);
  }, [filter, rows]);

  const handleAdvance = async (row: AdminSaleRecord) => {
    if (row.statusSimple === "recibido") return;

    setError(null);
    setBusyId(row.id);
    try {
      const next = await adminSalesService.advanceStatus(row);
      setRows((prev) =>
        prev.map((current) =>
          current.id === row.id
            ? { ...current, statusSimple: next, statusRaw: next }
            : current,
        ),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo actualizar el estado.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h2 className="font-display text-2xl text-amber-900">
          Control compras y ventas
        </h2>
        <span className="px-3 py-1 rounded-full border-2 border-amber-900 text-xs font-extrabold bg-white text-amber-900">
          {rows.length} registros
        </span>
      </div>

      <p className="text-zinc-700 mb-4">
        Registro básico: quién vendió a quién, producto y estado de entrega.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-lg border-2 font-extrabold ${
            filter === "all"
              ? "bg-amber-200 border-amber-900 text-amber-900"
              : "bg-white border-amber-900 text-amber-900"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("comprado")}
          className={`px-3 py-1 rounded-lg border-2 font-extrabold ${
            filter === "comprado"
              ? "bg-amber-200 border-amber-900 text-amber-900"
              : "bg-white border-amber-900 text-amber-900"
          }`}
        >
          Comprado
        </button>
        <button
          onClick={() => setFilter("enviado")}
          className={`px-3 py-1 rounded-lg border-2 font-extrabold ${
            filter === "enviado"
              ? "bg-amber-200 border-amber-900 text-amber-900"
              : "bg-white border-amber-900 text-amber-900"
          }`}
        >
          Enviado
        </button>
        <button
          onClick={() => setFilter("recibido")}
          className={`px-3 py-1 rounded-lg border-2 font-extrabold ${
            filter === "recibido"
              ? "bg-amber-200 border-amber-900 text-amber-900"
              : "bg-white border-amber-900 text-amber-900"
          }`}
        >
          Recibido
        </button>

        <button
          onClick={load}
          className="ml-auto px-4 py-2 rounded-xl border-2 border-amber-900 font-extrabold bg-white text-amber-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {error ? (
        <div className="mb-4 p-3 rounded-xl border-2 border-red-700 bg-red-100 text-red-800 font-bold">
          {error}
        </div>
      ) : null}

      <div className="bg-amber-100 border-2 border-amber-900 rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,0.85)]">
        <table className="w-full text-sm">
          <thead className="bg-amber-100 border-b-2 border-amber-900">
            <tr className="text-left text-amber-900">
              <th className="p-4">Fecha</th>
              <th className="p-4">Vendedor</th>
              <th className="p-4">Comprador</th>
              <th className="p-4">Producto</th>
              <th className="p-4">Total</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acción</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="p-5 text-zinc-600" colSpan={7}>
                  {loading
                    ? "Cargando registros..."
                    : "No hay compras/ventas para mostrar."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-t border-amber-200 align-top">
                  <td className="p-4 text-zinc-700">{formatDate(row.createdAt)}</td>
                  <td className="p-4 text-zinc-900">
                    <p className="font-bold">{row.sellerName}</p>
                    <p className="text-xs text-zinc-600">
                      {row.sellerEmail || "Sin email"}
                    </p>
                  </td>
                  <td className="p-4 text-zinc-900">
                    <p className="font-bold">{row.buyerName}</p>
                    <p className="text-xs text-zinc-600">
                      {row.buyerEmail || "Sin email"}
                    </p>
                  </td>
                  <td className="p-4 text-zinc-900">
                    <p className="font-bold">{row.productName}</p>
                    <p className="text-xs text-zinc-600">
                      Cant: {row.quantity} · Unit: ${formatCOP(row.unitPrice)}
                    </p>
                    {row.trackingCode ? (
                      <p className="text-xs text-zinc-600 mt-1">
                        Guía: <span className="font-mono">{row.trackingCode}</span>
                      </p>
                    ) : null}
                  </td>
                  <td className="p-4 font-bold text-zinc-900">
                    ${formatCOP(row.total)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold border-2 ${badgeClass(
                        row.statusSimple,
                      )}`}
                    >
                      {row.statusSimple.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleAdvance(row)}
                      className="px-3 py-1 rounded-lg font-extrabold border-2 bg-amber-200 text-amber-900 border-amber-900 disabled:opacity-60"
                      disabled={busyId === row.id || row.statusSimple === "recibido"}
                    >
                      {busyId === row.id
                        ? "Guardando..."
                        : nextStatusLabel(row.statusSimple)}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
