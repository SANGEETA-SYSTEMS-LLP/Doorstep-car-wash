import { useState } from "react";
import { useParams } from "react-router-dom";
import useApi from "../../hooks/useApi";
import ResourceEditor from "../../components/admin/ResourceEditor";
export default function ResourcePage({ base = "admin", resource: fixedResource }) {
  const { resource: pathResource } = useParams();
  const resource = fixedResource || pathResource;
  return <ResourceTable key={base + resource} base={base} resource={resource} />;
}
function ResourceTable({ base, resource }) {
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [search, setSearch] = useState("");
  const { data, loading, error, refresh } = useApi("/" + base + "/" + resource + "?page=" + page);
  const rows = (data?.rows || []).filter(row => Object.values(row).some(value => String(value ?? "").toLowerCase().includes(search.toLowerCase())));
  return <section><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-bold">{data?.title || "Records"}</h1><div className="flex gap-4"><button onClick={refresh} className="text-blue-700 underline">Refresh</button>{data?.fields && base === "admin" && <button onClick={() => setEditor({ row: null })} className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white">Add record</button>}</div></div>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}{loading && <p role="status" className="mt-5">Loading records...</p>}{editor && <ResourceEditor resource={resource} fields={data.fields} row={editor.row} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); refresh(); }} />}<input aria-label="Filter current page" value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter this page..." className="my-5 w-full max-w-md rounded-xl border border-slate-300 bg-white p-3" /><div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr>{data?.columns.map(column => <th key={column} className="whitespace-nowrap p-3 font-semibold capitalize">{column.replaceAll("_", " ")}</th>)}{data?.fields && base === "admin" && <th className="p-3">Actions</th>}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t border-slate-100">{data.columns.map(column => <td key={column} className="max-w-xs break-words p-3">{typeof row[column] === "boolean" ? row[column] ? "Yes" : "No" : String(row[column] ?? "—")}</td>)}{data.fields && base === "admin" && <td className="p-3"><button onClick={() => setEditor({ row })} className="text-blue-700 underline">Edit</button></td>}</tr>)}</tbody></table>{!loading && !rows.length && <p className="p-8 text-center text-slate-500">No records to display.</p>}</div><div className="mt-5 flex items-center justify-between gap-3"><button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40">Previous</button><p className="text-sm text-slate-500">Page {page} · {data?.count || 0} records</p><button disabled={!data || page * data.pageSize >= data.count} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-40">Next</button></div></section>;
}
