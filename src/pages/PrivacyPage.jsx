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
          a message. We also record the page you sent it from, the date and time, and the link or site that brought you here (for example, an Instagram link), so we know which channels work.
        </p>
        <p>
          <strong className="font-medium text-paper">To stop spam and abuse.</strong> We briefly keep a counter linked to
          your IP address so one visitor cannot flood the form or the chat. These counters expire on their own, after about
          an hour.
        </p>
        <p>
          <strong className="font-medium text-paper">When you use the chat assistant.</strong> The chat on this site
          (Ney) is an AI assistant, not a person. The questions you type are sent to Cloudflare&apos;s AI service, which
          writes the reply. We do not keep a copy of the conversation. So you can pick up where you left off, the chat is
          saved in your own browser on your own device; you can delete it from the chat&apos;s Recent chats list at any
          time. If you attach a photo to a question, the photo is sent to Cloudflare&apos;s AI service so the assistant can
          look at it, and we do not keep a copy of it. The assistant never needs your name, phone number or
          payment details, so please do not type passwords, payment details or other private information into it, and
          please do not send photos of people, ID documents or payment cards. If you tap the microphone button, your browser turns your speech into text. In some browsers, such as Chrome, that
          is done by the browser maker&apos;s speech service, not by us, and we do not receive or keep any audio. To
          speak to a person, use WhatsApp or the contact form.
        </p>
        <p>
          <strong className="font-medium text-paper">When you book a call in the chat.</strong> The chat asks for your
          name, a phone number, what you need and when suits you, and you may add a short note and up to three photos.
          This goes to our inbox like a contact form message, and we use it only to arrange and prepare the call. Photos
          are kept privately with Cloudflare, are visible only to us, and are deleted automatically after 30 days, or
          sooner if we delete your message.
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
        We use your details to reply to your enquiry, to prepare a quote and, if we work together, to run the project.
        Chat questions are used only to produce a reply. We
        do not sell your information and we do not send marketing emails unless you ask for them. When a new message
        arrives, we may be notified through a private messaging service such as Telegram so that we can reply quickly.
      </p>,
    ],
    [
      'Where it is stored',
      <p key="a">
        Messages are stored with Cloudflare, which hosts this website. Cloudflare and our notification services may
        process data on servers outside Kenya, and the same goes for the AI service that answers chat questions. This site also loads a font from Fontshare, so your browser contacts that
        service and it receives your IP address.
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
        updated="15 November 2026"
        intro="This page explains what personal information this website collects, why we collect it and what you can do about it."
        sections={sections}
      />
    </>
  )
}
