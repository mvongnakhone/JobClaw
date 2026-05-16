import { useState } from "react";
import Modal from "../Modal";

export default function SocialModal({ profile, onClose, onSave }) {
  const [f, setF] = useState({
    linkedin_url:  profile.linkedin_url,
    github_url:    profile.github_url,
    portfolio_url: profile.portfolio_url,
    twitter_url:   profile.twitter_url,
  });

  const fields = [
    ["linkedin_url",  "LinkedIn URL",       "linkedin.com/in/yourname"],
    ["github_url",    "GitHub URL",          "github.com/yourname"],
    ["portfolio_url", "Portfolio / Website", "yoursite.com"],
    ["twitter_url",   "Twitter / X",         "twitter.com/yourname"],
  ];

  return (
    <Modal title="Edit Social Links" onClose={onClose}
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
