import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import {
  AboutPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
} from "./pages/InfoPages";

const titles: Record<string, string> = {
  "/": "Sim Doc — PDF e foto para Word",
  "/sobre": "Sobre — Sim Doc",
  "/privacidade": "Política de privacidade — Sim Doc",
  "/termos": "Termos de uso — Sim Doc",
  "/contato": "Contato — Sim Doc",
};

function NavigationEffects() {
  const location = useLocation();

  useEffect(() => {
    document.title = titles[location.pathname] ?? titles["/"];
    if (location.hash) {
      window.setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth" }), 0);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location]);

  return null;
}

export default function App() {
  return (
    <>
      <NavigationEffects />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sobre" element={<AboutPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/contato" element={<ContactPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <Footer />
    </>
  );
}
