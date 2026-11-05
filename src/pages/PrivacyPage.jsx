import LegalPage from '../components/LegalPage'
import { useContact } from '../lib/content'

export default function PrivacyPage() {
  const { email } = useContact()
  const mail = email ? (
    <a href={`mailto:${email}`} className="text-amber hover:underline">
      {email}
    </a>
  ) : (
    'the contact form'
  )

  const sections = [
    [
      'Who we are',
      <p key="a">
        Apex Studios is a web design and development studio based in Nairobi, Kenya. We are responsible for the
        personal information collected through this website. You can reach us at {mail}.
      </p>,
    ],
    [
      'What we collect',
      <>
        <p>
          <strong className="font-medium text-paper">When you send us a message.</strong> The contact form asks for your
          name and email address. You may also give a phone number, your company, the service you are interested in and
          a message. We also record the page you sent it from and the date and time.
        </p>
        <p>
          <strong className="font-medium text-paper">To stop spam and abuse.</strong> We briefly keep a counter linked to
          your IP address so one visitor cannot flood the form. These counters expire on their own, after about an hour.
        </p>
        <p>
          <strong className="font-medium text-paper">Visit statistics.</strong> We may use Cloudflare Web Analytics to see
          which pages are visited. It is designed to work without cookies.
        </p>
      </>,
    ],
    [
      'How we use it',
      <p key="a">
        We use your details to reply to your enquiry, to prepare a quote and, if we work together, to run the project. We
        do not sell your information and we do not send marketing emails unless you ask for them. When a new message
        arrives, we may be notified through a private messaging service such as Telegram so that we can reply quickly.
      </p>,
    ],
    [
      'Where it is stored',
      <p key="a">
        Messages are stored with Cloudflare, which hosts this website. Cloudflare and our notification services may
        process data on servers outside Kenya. This site also loads fonts from Google Fonts and Fontshare, so your browser
        contacts those services and they receive your IP address.
      </p>,
    ],
    [
      'How long we keep it',
      <p key="a">
        We keep an enquiry for as long as we need it to reply and, if you become a client, for our business and tax
        records. You can ask us to delete your enquiry at any time.
      </p>,
    ],
    [
      'Your rights',
      <p key="a">
        Under Kenya&apos;s Data Protection Act, 2019, you can ask to see the personal information we hold about you, have it
        corrected or deleted, and object to how we use it. Write to us at {mail} and we will respond. If you are not happy
        with our answer, you can complain to the Office of the Data Protection Commissioner.
      </p>,
    ],
    [
      'Other websites',
      <p key="a">
        Links to WhatsApp, Instagram, TikTok and client websites take you to services we do not control. Their own privacy
        policies apply once you leave this site.
      </p>,
    ],
    [
      'Changes',
      <p key="a">
        If we change how we handle personal information, we will update this page and the date at the top.
      </p>,
    ],
  ]

  return (
    <>
      <title>Privacy Policy | Apex Studios</title>
      <meta name="description" content="What personal information the Apex Studios website collects, why, and how to ask us about it." />
      <LegalPage
        title="Privacy Policy"
        updated="6 November 2026"
        intro="This page explains what personal information this website collects, why we collect it and what you can do about it."
        sections={sections}
      />
    </>
  )
}
