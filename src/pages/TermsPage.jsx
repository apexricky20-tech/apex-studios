import { Link } from 'react-router-dom'
import LegalPage from '../components/LegalPage'

export default function TermsPage() {
  const sections = [
    [
      'Using this website',
      <p key="a">
        By using this website you agree to these terms. If you do not agree, please do not use it. These terms cover the
        website only. Work for clients is agreed separately in a quote or agreement.
      </p>,
    ],
    [
      'Information on this site',
      <p key="a">
        We try to keep the information here accurate and up to date, but it is general information and not an offer.
        Prices and timelines are confirmed in a written quote after a first call, as described on our{' '}
        <Link to="/contact" className="text-amber hover:underline">
          contact page
        </Link>
        .
      </p>,
    ],
    [
      'Our work and other people’s',
      <p key="a">
        The design, text and images on this site belong to Apex Studios unless stated otherwise. Names, logos and
        screenshots of client projects belong to those clients and appear here only to show our work. Please do not copy or
        reuse them without permission.
      </p>,
    ],
    [
      'Links to other sites',
      <p key="a">
        We link to client websites and social media. We do not control those sites and are not responsible for what is on
        them.
      </p>,
    ],
    [
      'Liability',
      <p key="a">
        This website is provided as it is. To the extent the law allows, Apex Studios is not liable for any loss that comes
        from using it or from relying on its content, or from the site being unavailable at any time.
      </p>,
    ],
    [
      'Governing law',
      <p key="a">These terms are governed by the laws of Kenya.</p>,
    ],
    [
      'Privacy',
      <p key="a">
        How we handle personal information is explained in our{' '}
        <Link to="/privacy" className="text-amber hover:underline">
          Privacy Policy
        </Link>
        .
      </p>,
    ],
  ]

  return (
    <>
      <title>Website Terms | Apex Studios</title>
      <meta name="description" content="The terms for using the Apex Studios website." />
      <LegalPage title="Website Terms" updated="6 November 2026" sections={sections} />
    </>
  )
}
