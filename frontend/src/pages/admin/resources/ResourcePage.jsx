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
          <button onClick={refresh} className="text-blue-700 underline">Refresh</button>
          {data?.fields && base === "admin" && <button onClick={() => setEditor({ row: null })} className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white">Add record</button>}
        </div>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {actionError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{actionError}</p>}
      {loading && <p role="status" className="mt-5">Loading records...</p>}
      {resource === "packages" && base === "admin" && <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Create one package per vehicle category and plan. Use names such as “Basic Monthly Plan - Hatchback” for monthly plans. Customer pricing reads directly from these records.</p>}
      {editor && <ResourceEditor resource={resource} fields={data.fields} row={editor.row} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); refresh(); }} />}
      <input aria-label="Filter current page" value={search} onChange={event => setSearch(event.target.value)} placeholder="Filter this page..." className="my-5 w-full max-w-md rounded-xl border border-slate-300 bg-white p-3" />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100"><tr>{data?.columns.map(column => <th key={column} className="whitespace-nowrap p-3 font-semibold capitalize">{column.replaceAll("_", " ")}</th>)}{data?.fields && base === "admin" && <th className="p-3">Actions</th>}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.id} className="border-t border-slate-100">
            {data.columns.map(column => <td key={column} className="max-w-xs break-words p-3">{typeof row[column] === "boolean" ? row[column] ? "Yes" : "No" : String(row[column] ?? "—")}</td>)}
            {data.fields && base === "admin" && <td className="whitespace-nowrap p-3">
              <button onClick={() => setEditor({ row })} className="text-blue-700 underline">Edit</button>
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
