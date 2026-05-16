import { useState } from "react";
import Modal from "../Modal";

export default function ContactModal({ profile, onClose, onSave }) {
  const [f, setF] = useState({
    name:     profile.name,
    email:    profile.email,
    phone:    profile.phone,
    location: profile.location,
    headline: profile.headline,
  });

  const fields = [
    ["name",     "Full name",  "Jane Smith"],
    ["email",    "Email",      "jane@example.com"],
    ["phone",    "Phone",      "(415) 555-0192"],
    ["location", "Location",   "San Francisco, CA"],
    ["headline", "Headline",   "Senior PM · Developer Tools"],
  ];

  return (
    <Modal title="Edit Contact Info" onClose={onClose}
      foot={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save changes</button>
      </>}>
      {fields.map(([k, l, p]) => (
        <div className="field" key={k}>
          <label className="lbl">{l}</label>
          <input className="inp" placeholder={p} value={f[k] || ""}
            onChange={e => setF(x => ({ ...x, [k]: e.target.value }))} />
        </div>
      ))}
    </Modal>
  );
}
