import { Code2, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-grid">
        <div className="footer-intro">
          <Logo />
          <p>
            Converta documentos em texto editável com simplicidade, privacidade e sem
            instalar programas.
          </p>
        </div>
        <div>
          <h2>Texto Doc</h2>
          <Link to="/sobre">Sobre o projeto</Link>
          <Link to="/#como-funciona">Como funciona</Link>
          <a href="https://github.com/leonardo-deploy/texto_doc" target="_blank" rel="noreferrer">
            <Code2 size={15} /> GitHub
          </a>
        </div>
        <div>
          <h2>Transparência</h2>
          <Link to="/privacidade">Política de privacidade</Link>
          <Link to="/termos">Termos de uso</Link>
          <Link to="/contato">Contato</Link>
        </div>
      </div>
      <div className="page-shell footer-bottom">
        <span>© {new Date().getFullYear()} Texto Doc.</span>
        <span className="made-with-care">
          Feito com <Heart size={14} aria-label="cuidado" /> no Brasil
        </span>
      </div>
    </footer>
  );
}
