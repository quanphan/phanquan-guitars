import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/admin/AdminRoute.jsx";
import CustomerRoute from "./components/auth/CustomerRoute.jsx";
import Layout from "./components/Layout.jsx";
import About from "./pages/About.jsx";
import BuildProcess from "./pages/BuildProcess.jsx";
import Account from "./pages/Account.jsx";
import CustomBuild from "./pages/CustomBuild.jsx";
import Gallery from "./pages/Gallery.jsx";
import GuitarDetail from "./pages/GuitarDetail.jsx";
import Guitars from "./pages/Guitars.jsx";
import Home from "./pages/Home.jsx";
import InStock from "./pages/InStock.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminIndex from "./pages/admin/AdminIndex.jsx";
import AdminInquiries from "./pages/admin/AdminInquiries.jsx";
import AdminInquiryDetail from "./pages/admin/AdminInquiryDetail.jsx";
import AdminBrandSettings from "./pages/admin/AdminBrandSettings.jsx";
import AdminMessages from "./pages/admin/AdminMessages.jsx";
import AdminMessageDetail from "./pages/admin/AdminMessageDetail.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminUserDetail from "./pages/admin/AdminUserDetail.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminCatalog from "./pages/admin/AdminCatalog.jsx";
import CatalogKindPage from "./pages/admin/CatalogKindPage.jsx";
import CatalogProductEditor from "./pages/admin/CatalogProductEditor.jsx";
import CatalogProductsPage from "./pages/admin/CatalogProductsPage.jsx";
import CatalogTermEditor from "./pages/admin/CatalogTermEditor.jsx";
import AdminCustomBuildSetup from "./pages/admin/AdminCustomBuildSetup.jsx";
import WizardOptionEditor from "./pages/admin/WizardOptionEditor.jsx";
import Contact from "./pages/Contact.jsx";
import StockDetail from "./pages/StockDetail.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/guitars" element={<Guitars />} />
        <Route path="/guitars/:id" element={<GuitarDetail />} />
        <Route path="/in-stock" element={<InStock />} />
        <Route path="/in-stock/:slug" element={<StockDetail />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/custom-build" element={<CustomBuild />} />
        <Route path="/build-process" element={<BuildProcess />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<CustomerRoute />}>
          <Route path="/account" element={<Account />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminIndex />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          <Route path="/admin/inquiries" element={<AdminInquiries />} />
          <Route path="/admin/inquiries/:id" element={<AdminInquiryDetail />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/messages/:id" element={<AdminMessageDetail />} />
          <Route path="/admin/settings/brand" element={<AdminBrandSettings />} />
          <Route path="/admin/custom-build-setup" element={<AdminCustomBuildSetup />} />
          <Route path="/admin/custom-build-setup/:categoryId/new" element={<WizardOptionEditor />} />
          <Route path="/admin/custom-build-setup/:categoryId/:optionId" element={<WizardOptionEditor />} />
          <Route path="/admin/catalog" element={<AdminCatalog />}>
            <Route index element={<Navigate to="categories" replace />} />
            <Route path="products" element={<CatalogProductsPage />} />
            <Route path="products/:id" element={<CatalogProductEditor />} />
            <Route path=":kind" element={<CatalogKindPage />} />
            <Route path=":kind/:id" element={<CatalogTermEditor />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
