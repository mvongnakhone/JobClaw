import { useState } from "react";
import Modal from "../Modal";

export default function PrefsModal({ prefs, onClose, onSave }) {
  const [f, setF] = useState({ ...prefs });

  const textFields = [
    ["roles",        "Target roles",         "Senior PM, Group PM, Director of Product"],
    ["industries",   "Industries",            "Developer Tools, Fintech, SaaS"],
    ["locations",    "Preferred locations",   "SF Bay Area, NYC, Remote"],
    ["salary_min",   "Minimum salary",        "$150k"],
    ["availability", "Availability",          "2 weeks notice"],
    ["open_to",      "Open to relocation?",   "Yes / No / Specific cities"],
  ];

  return (
    <Modal title="Job Preferences" onClose={onClose}
      foot={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save</button>
      </>}>
      {textFields.map(([k, l, p]) => (
        <div className="field" key={k}>
          <label className="lbl">{l}</label>
          <input className="inp" placeholder={p} value={f[k] || ""}
            onChange={e => setF(x => ({ ...x, [k]: e.target.value }))} />
        </div>
      ))}
      <div className="g2">
        <div className="field">
          <label className="lbl">Work type</label>
          <select className="sel" value={f.work_type || ""} onChange={e => setF(x => ({ ...x, work_type: e.target.value }))}>
            {["Remote","Hybrid","On-site","Remote / Hybrid","Flexible"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="lbl">Job type</label>
          <select className="sel" value={f.job_type || ""} onChange={e => setF(x => ({ ...x, job_type: e.target.value }))}>
            {["Full-time","Part-time","Contract","Internship"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}
