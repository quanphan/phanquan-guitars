import { Outlet } from "react-router-dom";
import Footer from "./Footer.jsx";
import Navbar from "./Navbar.jsx";
import ScrollManager from "./ScrollManager.jsx";

export default function Layout() {
  return (
    <div className="min-h-dvh w-full min-w-0 bg-charcoal text-ivory">
      <ScrollManager />
      <Navbar />
      <main className="min-w-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
