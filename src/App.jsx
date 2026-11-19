import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import { loaders } from './lib/routes'

const WorkPage = lazy(loaders.work)
const ProjectPage = lazy(loaders.project)
const ServicesPage = lazy(loaders.services)
const WebsiteDesignPage = lazy(loaders.websiteDesign)
const GoogleBusinessProfilePage = lazy(loaders.googleBusinessProfile)
const DevelopmentPage = lazy(loaders.development)
const AutomationPage = lazy(loaders.automation)
const BrandingPage = lazy(loaders.branding)
const MpesaPaymentsPage = lazy(loaders.mpesa)
const WhatsAppAutomationPage = lazy(loaders.whatsapp)
const AiAssistantPage = lazy(loaders.assistant)
const CarePlansPage = lazy(loaders.carePlans)
const ThreeDCreationPage = lazy(loaders.threeD)
const UiUxDesignPage = lazy(loaders.uiux)
const MotionDesignPage = lazy(loaders.motion)
const ProcessPage = lazy(loaders.process)
const AboutPage = lazy(loaders.about)
const ContactPage = lazy(loaders.contact)
const ArticlesPage = lazy(loaders.articles)
const ArticlePage = lazy(loaders.article)
const PrivacyPage = lazy(loaders.privacy)
const TermsPage = lazy(loaders.terms)
const ReferPage = lazy(loaders.refer)
const NotFound = lazy(loaders.notFound)
const Admin = lazy(loaders.admin)

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
