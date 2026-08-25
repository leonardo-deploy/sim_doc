import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="header-inner page-shell">
        <Logo />
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="main-navigation"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav id="main-navigation" className={open ? "main-nav is-open" : "main-nav"}>
          {isHome ? (
            <>
              <a href="#como-funciona" onClick={close}>Como funciona</a>
              <a href="#seguranca" onClick={close}>Segurança</a>
              <a href="#duvidas" onClick={close}>Dúvidas</a>
            </>
          ) : (
            <Link to="/" onClick={close}>Início</Link>
          )}
          <Link className="nav-cta" to="/#converter" onClick={close}>
            Converter agora
          </Link>
        </nav>
      </div>
    </header>
  );
}
