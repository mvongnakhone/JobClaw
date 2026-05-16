import { useState } from "react";
import Modal from "../Modal";

export default function VolunteeringModal({ data, onClose, onSave }) {
  const [f, setF] = useState({ role:"", org:"", start:"", end:"", desc:"", ...data });

  return (
    <Modal title={data.id ? "Edit Volunteering" : "Add Volunteering"} onClose={onClose}
      foot={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save</button>
      </>}>
      <div className="g2">
        <div className="field"><label className="lbl">Role</label>
          <input className="inp" placeholder="Mentor" value={f.role}
            onChange={e => setF(x => ({ ...x, role: e.target.value }))} /></div>
        <div className="field"><label className="lbl">Organization</label>
          <input className="inp" placeholder="Out in Tech" value={f.org}
            onChange={e => setF(x => ({ ...x, org: e.target.value }))} /></div>
      </div>
      <div className="g2">
        <div className="field"><label className="lbl">Start</label>
          <input className="inp" placeholder="Jan 2023" value={f.start}
            onChange={e => setF(x => ({ ...x, start: e.target.value }))} /></div>
        <div className="field"><label className="lbl">End</label>
          <input className="inp" placeholder="Present" value={f.end}
            onChange={e => setF(x => ({ ...x, end: e.target.value }))} /></div>
      </div>
      <div className="field"><label className="lbl">Description</label>
        <textarea className="txta" rows={3} value={f.desc}
          onChange={e => setF(x => ({ ...x, desc: e.target.value }))} /></div>
    </Modal>
  );
}
