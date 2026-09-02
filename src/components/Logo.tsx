import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link className="brand" to="/" aria-label="Sim Doc — página inicial">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="img">
          <path d="M10.5 6.5h12.8l6.2 6.2v20.8h-19z" className="brand-paper" />
          <path d="M23.3 6.5v6.8h6.2" className="brand-fold" />
          <path d="m15.6 22.2 3.9 3.8 6.5-8" className="brand-check" />
        </svg>
      </span>
      <span>
        Sim <strong>Doc</strong>
      </span>
    </Link>
  );
}
