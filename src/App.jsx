import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import WorkPage from './pages/WorkPage'
import ProjectPage from './pages/ProjectPage'
import ServicesPage from './pages/ServicesPage'
import WebsiteDesignPage from './pages/WebsiteDesignPage'
import GoogleBusinessProfilePage from './pages/GoogleBusinessProfilePage'
import DevelopmentPage from './pages/DevelopmentPage'
import AutomationPage from './pages/AutomationPage'
import BrandingPage from './pages/BrandingPage'
import ProcessPage from './pages/ProcessPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import ArticlesPage from './pages/ArticlesPage'
import ArticlePage from './pages/ArticlePage'
import NotFound from './pages/NotFound'

const Admin = lazy(() => import('./admin/Admin'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="work" element={<WorkPage />} />
          <Route path="work/:slug" element={<ProjectPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="website-design" element={<WebsiteDesignPage />} />
          <Route path="google-business-profile" element={<GoogleBusinessProfilePage />} />
          <Route path="development" element={<DevelopmentPage />} />
          <Route path="automation" element={<AutomationPage />} />
          <Route path="branding" element={<BrandingPage />} />
          <Route path="process" element={<ProcessPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="articles/:slug" element={<ArticlePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
