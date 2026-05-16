import { useState } from "react";
import Modal from "../Modal";

export default function ProjectModal({ data, onClose, onSave }) {
  const [f, setF] = useState({
    name:"", url:"", desc:"",
    ...data,
    tags: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || ""),
  });

  function handleSave() {
    onSave({ ...f, tags: f.tags.split(",").map(t => t.trim()).filter(Boolean) });
  }

  return (
    <Modal title={data.id ? "Edit Project" : "Add Project"} onClose={onClose}
      foot={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-grad btn-sm" onClick={handleSave}>Save</button>
      </>}>
      <div className="field"><label className="lbl">Project name</label>
        <input className="inp" placeholder="DevDash" value={f.name}
          onChange={e => setF(x => ({ ...x, name: e.target.value }))} /></div>
      <div className="field"><label className="lbl">URL / Link</label>
        <input className="inp" placeholder="github.com/you/project" value={f.url}
          onChange={e => setF(x => ({ ...x, url: e.target.value }))} /></div>
      <div className="field"><label className="lbl">Description</label>
        <textarea className="txta" rows={3} placeholder="What it does, impact, stars…"
          value={f.desc} onChange={e => setF(x => ({ ...x, desc: e.target.value }))} /></div>
      <div className="field"><label className="lbl">Tags (comma separated)</label>
        <input className="inp" placeholder="React, Python, Open Source" value={f.tags}
          onChange={e => setF(x => ({ ...x, tags: e.target.value }))} /></div>
    </Modal>
  );
}
