import { useState } from "react";
import Modal from "../Modal";

export default function ExperienceModal({ data, onClose, onSave }) {
  const [f, setF] = useState({ title:"", company:"", type:"Full-time", start:"", end:"", location:"", desc:"", ...data });

  return (
    <Modal title={data.id ? "Edit Experience" : "Add Experience"} onClose={onClose}
      foot={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save</button>
      </>}>
      <div className="g2">
        <div className="field"><label className="lbl">Job title</label>
          <input className="inp" placeholder="Senior PM" value={f.title}
            onChange={e => setF(x => ({ ...x, title: e.target.value }))} /></div>
        <div className="field"><label className="lbl">Company</label>
          <input className="inp" placeholder="Acme Corp" value={f.company}
            onChange={e => setF(x => ({ ...x, company: e.target.value }))} /></div>
      </div>
      <div className="g2">
        <div className="field"><label className="lbl">Start</label>
          <input className="inp" placeholder="Jan 2022" value={f.start}
            onChange={e => setF(x => ({ ...x, start: e.target.value }))} /></div>
        <div className="field"><label className="lbl">End</label>
          <input className="inp" placeholder="Present" value={f.end}
            onChange={e => setF(x => ({ ...x, end: e.target.value }))} /></div>
      </div>
      <div className="g2">
        <div className="field">
          <label className="lbl">Type</label>
          <select className="sel" value={f.type} onChange={e => setF(x => ({ ...x, type: e.target.value }))}>
            {["Full-time","Part-time","Contract","Internship","Freelance"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field"><label className="lbl">Location</label>
          <input className="inp" placeholder="SF, CA / Remote" value={f.location}
            onChange={e => setF(x => ({ ...x, location: e.target.value }))} /></div>
      </div>
      <div className="field"><label className="lbl">Description / Bullets</label>
        <textarea className="txta" rows={4} placeholder="Describe your impact, metrics, key projects…"
          value={f.desc} onChange={e => setF(x => ({ ...x, desc: e.target.value }))} /></div>
    </Modal>
  );
}
