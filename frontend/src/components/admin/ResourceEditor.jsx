import { useEffect, useState } from "react";
import { apiRequest } from "../../api/apiClient";
export default function ResourceEditor({ resource, fields, row, onClose, onSaved }) {
  const [values, setValues] = useState(() => Object.fromEntries(Object.entries(fields).map(([key, spec]) => [key, row?.[key] ?? (spec.type === "boolean" ? true : "")])));
  const [relations, setRelations] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all(Object.values(fields).filter(f => f.type === "relation").map(async field => {
      const rows = [];
      for (let page = 1; ; page++) {
        const data = await apiRequest("/admin/" + field.resource + "?page=" + page);
        rows.push(...data.rows);
        if (rows.length >= data.count || !data.rows.length) break;
      }
      return [field.resource, rows];
    })).then(entries => { if (active) setRelations(Object.fromEntries(entries)); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [fields]);
  async function save(event) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError("");
    try {
      const payload = Object.fromEntries(Object.entries(fields).map(([key, spec]) => [key, spec.type === "number" ? (values[key] === "" ? null : Number(values[key])) : values[key]]));
      await apiRequest("/admin/" + resource + (row ? "/" + row.id : ""), { method: row ? "PATCH" : "POST", body: JSON.stringify(payload) });
      onSaved();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  return <section className="my-6 rounded-2xl border border-blue-200 bg-white p-6"><h2 className="text-xl font-bold">{row ? "Edit record" : "Create record"}</h2>{error && <p role="alert" className="mt-4 text-red-700">{error}</p>}<form onSubmit={save}><div className="mt-5 grid gap-4 md:grid-cols-2">{Object.entries(fields).map(([key, spec]) => <label key={key} className="block text-sm font-semibold">{spec.label}{spec.required ? " *" : ""}{spec.type === "boolean" ? <input type="checkbox" checked={values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.checked }))} className="ml-3" /> : spec.type === "relation" ? <select required={spec.required} value={values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 p-3"><option value="">Select...</option>{relations[spec.resource]?.map(item => <option value={item.id} key={item.id}>{item.name || item.id}</option>)}</select> : <input required={spec.required} type={spec.type === "number" ? "number" : "text"} min={spec.min} max={spec.max} step={key === "duration_minutes" ? 1 : "any"} maxLength={spec.maxLength} value={values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} className="mt-2 w-full rounded-lg border border-slate-300 p-3" />}</label>)}</div><div className="mt-6 flex gap-3"><button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save"}</button><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-3">Cancel</button></div></form></section>;
}
