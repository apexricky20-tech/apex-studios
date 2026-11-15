import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'

const WorkPage = lazy(() => import('./pages/WorkPage'))
const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const WebsiteDesignPage = lazy(() => import('./pages/WebsiteDesignPage'))
const GoogleBusinessProfilePage = lazy(() => import('./pages/GoogleBusinessProfilePage'))
const DevelopmentPage = lazy(() => import('./pages/DevelopmentPage'))
const AutomationPage = lazy(() => import('./pages/AutomationPage'))
const BrandingPage = lazy(() => import('./pages/BrandingPage'))
const MpesaPaymentsPage = lazy(() => import('./pages/MpesaPaymentsPage'))
const WhatsAppAutomationPage = lazy(() => import('./pages/WhatsAppAutomationPage'))
const AiAssistantPage = lazy(() => import('./pages/AiAssistantPage'))
const CarePlansPage = lazy(() => import('./pages/CarePlansPage'))
const ThreeDCreationPage = lazy(() => import('./pages/ThreeDCreationPage'))
const UiUxDesignPage = lazy(() => import('./pages/UiUxDesignPage'))
const MotionDesignPage = lazy(() => import('./pages/MotionDesignPage'))
const ProcessPage = lazy(() => import('./pages/ProcessPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'))
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const ReferPage = lazy(() => import('./pages/ReferPage'))
const NotFound = lazy(() => import('./pages/NotFound'))
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
          <Route path="mpesa-payments" element={<MpesaPaymentsPage />} />
          <Route path="whatsapp-automation" element={<WhatsAppAutomationPage />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
          <Route path="care-plans" element={<CarePlansPage />} />
          <Route path="3d-creation" element={<ThreeDCreationPage />} />
          <Route path="ui-ux-design" element={<UiUxDesignPage />} />
          <Route path="motion-design" element={<MotionDesignPage />} />
          <Route path="process" element={<ProcessPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="articles" element={<ArticlesPage />} />
          <Route path="articles/:slug" element={<ArticlePage />} />
          <Route path="refer" element={<ReferPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
