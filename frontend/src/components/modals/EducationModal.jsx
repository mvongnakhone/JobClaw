import { useState } from "react";
import Modal from "../Modal";

export default function EducationModal({ data, onClose, onSave }) {
  const [f, setF] = useState({ degree:"", school:"", start:"", end:"", gpa:"", notes:"", ...data });

  return (
    <Modal title={data.id ? "Edit Education" : "Add Education"} onClose={onClose}
      foot={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save</button>
      </>}>
      <div className="field"><label className="lbl">Degree / Credential</label>
        <input className="inp" placeholder="BS Computer Science" value={f.degree}
          onChange={e => setF(x => ({ ...x, degree: e.target.value }))} /></div>
      <div className="field"><label className="lbl">School / Institution</label>
        <input className="inp" placeholder="UC Berkeley" value={f.school}
          onChange={e => setF(x => ({ ...x, school: e.target.value }))} /></div>
      <div className="g2">
        <div className="field"><label className="lbl">Start year</label>
          <input className="inp" placeholder="2015" value={f.start}
            onChange={e => setF(x => ({ ...x, start: e.target.value }))} /></div>
        <div className="field"><label className="lbl">End year</label>
          <input className="inp" placeholder="2019" value={f.end}
            onChange={e => setF(x => ({ ...x, end: e.target.value }))} /></div>
      </div>
      <div className="g2">
        <div className="field"><label className="lbl">GPA (optional)</label>
          <input className="inp" placeholder="3.8" value={f.gpa}
            onChange={e => setF(x => ({ ...x, gpa: e.target.value }))} /></div>
        <div className="field"><label className="lbl">Notes</label>
          <input className="inp" placeholder="Honors, Dean's List…" value={f.notes}
            onChange={e => setF(x => ({ ...x, notes: e.target.value }))} /></div>
      </div>
    </Modal>
  );
}
