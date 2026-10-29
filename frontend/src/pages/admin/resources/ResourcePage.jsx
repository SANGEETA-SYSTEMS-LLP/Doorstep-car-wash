import { useState } from "react";
import { useParams } from "react-router-dom";
import useApi from "../../../hooks/useApi";
import { apiRequest } from "../../../api/apiClient";
import ResourceEditor from "../../../components/admin/ResourceEditor";

export default function ResourcePage({ base = "admin", resource: fixedResource }) {
  const { resource: pathResource } = useParams();
  const resource = fixedResource || pathResource;
  return <ResourceTable key={base + resource} base={base} resource={resource} />;
}

function ResourceTable({ base, resource }) {
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const { data, loading, error, refresh } = useApi(`/${base}/${resource}?page=${page}`);
  const rows = (data?.rows || []).filter(row => Object.values(row)
    .some(value => String(value ?? "").toLowerCase().includes(search.toLowerCase())));
  function renderCell(row, column) {
    if (["washers", "supervisors"].includes(resource) && column === "earning_records") {
      const records = Array.isArray(row.earning_records) ? row.earning_records : [];
      if (!records.length) return "No earnings yet";
      return <details className="min-w-56">
        <summary className="cursor-pointer font-semibold text-green-700">View {records.length} earning record(s)</summary>
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
          {records.map((earning, index) => <div key={`${earning.booking_number}-${index}`} className="border-b border-slate-200 pb-2 text-xs last:border-0">
            <p className="font-semibold text-slate-800">{earning.booking_number}</p>
            <p className="mt-0.5 text-slate-600">₹{Number(earning.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} · {earning.status}</p>
            {earning.date && <p className="mt-0.5 text-slate-500">{new Date(earning.date).toLocaleDateString("en-IN")}</p>}
          </div>)}
        </div>
      </details>;
    }
    if (["washers", "supervisors"].includes(resource) && ["total_earnings", "pending_earnings"].includes(column)) {
      return `₹${Number(row[column] || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    }
    return typeof row[column] === "boolean" ? row[column] ? "Yes" : "No" : String(row[column] ?? "-");
  }

  async function deletePackage(row) {
    if (!window.confirm(`Remove “${row.name}” from the customer booking catalog? Existing bookings will be preserved.`)) return;
    setDeletingId(row.id);
    setActionError("");
    try {
      await apiRequest(`/admin/packages/${row.id}`, { method: "DELETE" });
      refresh();
    } catch (requestError) {
      setActionError(requestError.message || "The package could not be removed.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{data?.title || "Records"}</h1>
        <div className="flex gap-4">
          <button onClick={refresh} className="text-green-700 underline">Refresh</button>
          {data?.fields && base === "admin" && <button onClick={() => setEditor({ row: null })} className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white">Add record</button>}
        </div>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {actionError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{actionError}</p>}
      {loading && <p role="status" className="mt-5">Loading records...</p>}
      {resource === "packages" && base === "admin" && <p className="mt-4 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">Create one package per vehicle category and plan. Use names such as “Basic Monthly Plan - Hatchback” for monthly plans. Customer pricing reads directly from these records.</p>}
      {editor && <ResourceEditor resource={resource} fields={data.fields} row={editor.row} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); refresh(); }} />}
      <input aria-label="Filter current page" value={search} onChange={event => setSearch(event.target.value)} placeholder="Filter this page..." className="my-5 w-full max-w-md rounded-xl border border-slate-300 bg-white p-3" />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100"><tr>{data?.columns.map(column => <th key={column} className="whitespace-nowrap p-3 font-semibold capitalize">{column.replaceAll("_", " ")}</th>)}{data?.fields && base === "admin" && <th className="p-3">Actions</th>}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.id} className="border-t border-slate-100">
            {data.columns.map(column => <td key={column} className="max-w-xs break-words p-3">{renderCell(row, column)}</td>)}
            {data.fields && base === "admin" && <td className="whitespace-nowrap p-3">
              <button onClick={() => setEditor({ row })} className="text-green-700 underline">Edit</button>
              {resource === "packages" && row.is_active !== false && <button disabled={deletingId === row.id} onClick={() => deletePackage(row)} className="ml-4 text-red-700 underline disabled:opacity-50">{deletingId === row.id ? "Removing…" : "Delete"}</button>}
              {resource === "packages" && row.is_active === false && <span className="ml-4 text-slate-400">Inactive</span>}
            </td>}
          </tr>)}</tbody>
        </table>
        {!loading && !rows.length && <p className="p-8 text-center text-slate-500">No records to display.</p>}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <button disabled={page === 1} onClick={() => setPage(value => value - 1)} className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40">Previous</button>
        <p className="text-sm text-slate-500">Page {page} · {data?.count || 0} records</p>
        <button disabled={!data || page * data.pageSize >= data.count} onClick={() => setPage(value => value + 1)} className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40">Next</button>
      </div>
    </section>
  );
}
