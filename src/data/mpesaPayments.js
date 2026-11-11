export const mpesaPayments = {
  path: '/mpesa-payments',
  title: 'M-Pesa Payments for Websites in Kenya | Apex Studios',
  description: 'Accept M-Pesa on your website: payment prompts on the customer\'s phone, booking deposits, order payments and automatic confirmation for hotels, lodges and restaurants in Kenya.',
  label: 'Services',
  h1: 'M-Pesa Payments',
  intro: 'Let guests pay the way they already do. We connect your website to your own M-Pesa Paybill or Till number, so a booking deposit or an order is paid with a prompt on the customer\'s phone and confirmed on your side without anyone checking messages.',
  sections: [
    {
      id: 'what-we-build',
      nav: 'What we build',
      title: 'What we build',
      intro: 'A payment step that fits your booking or ordering flow.',
      blocks: [
        {
          h: 'Pay prompts on the phone',
          p: 'The customer enters their number and approves an M-Pesa prompt with their PIN. No Paybill number or account reference to type.'
        },
        {
          h: 'Deposits and order payments',
          p: 'Take a deposit to hold a room or a table, or full payment for an online order, from the same page.'
        },
        {
          h: 'Automatic confirmation',
          p: 'When a payment succeeds, the booking or order is marked as paid and you are notified, so nobody has to match payments against M-Pesa messages.'
        },
        {
          h: 'A payments dashboard',
          p: 'A list of payments with their status, so you can see what was paid, what failed and what is still pending.'
        },
        {
          h: 'Failed and abandoned payments',
          p: 'If a customer cancels or the prompt times out, the order stays unpaid and they can try again, instead of leaving you guessing.'
        }
      ]
    },
    {
      id: 'what-you-receive',
      nav: 'What you receive',
      title: 'What you receive',
      intro: 'The exact list depends on your site. Most projects include these parts.',
      blocks: [
        {
          h: 'Working checkout',
          p: 'M-Pesa payment on your website, connected to your bookings or orders.'
        },
        {
          h: 'Payment records',
          p: 'Each payment with its time, amount and status, kept so you can check and reconcile.'
        },
        {
          h: 'Notifications',
          p: 'You or your staff are alerted when a payment comes in, on WhatsApp or email.'
        },
        {
          h: 'Tested before launch',
          p: 'We test in Safaricom\'s test environment, then with a small real payment before going live.'
        },
        {
          h: 'Handover notes',
          p: 'How to see payments, where the settings live and what to do if something fails.'
        }
      ]
    },
    {
      id: 'how-we-deliver',
      nav: 'How we deliver',
      title: 'How we deliver',
      intro: 'A short sequence, with your approval at each step.',
      blocks: [
        {
          h: 'First call',
          p: 'We talk about what customers pay for, roughly how much, and which Paybill or Till number you will use. A quote follows the call.'
        },
        {
          h: 'Your Safaricom setup',
          p: 'You need your own Paybill or Till number. Safaricom has its own go-live steps for its Daraja platform, and we guide you through them.'
        },
        {
          h: 'Build and test',
          p: 'We add the payment step to your site and test every outcome: paid, cancelled, timed out and failed.'
        },
        {
          h: 'Go live and watch',
          p: 'We check the first real payments with you and fix anything that does not behave.'
        }
      ]
    },
    {
      id: 'why-it-matters',
      nav: 'Why it is worth it',
      title: 'Why take payments on your website',
      intro: 'Payment is where many online bookings and orders stall.',
      blocks: [
        {
          h: 'Easier for the customer',
          p: 'Approving a prompt on their own phone is simpler than copying a Paybill number and waiting for a message.'
        },
        {
          h: 'Less manual checking',
          p: 'Payments and orders are matched by the system, not by someone scrolling through messages.'
        },
        {
          h: 'Money goes to you',
          p: 'Customers pay into your own Paybill or Till number. We build the connection and never hold your money.'
        },
        {
          h: 'Joined up with the rest',
          p: 'It works with your website and your order and booking alerts.',
          link: {
            to: '/automation',
            label: 'See Automation'
          }
        }
      ]
    },
    {
      id: 'before-you-ask',
      nav: 'Before you ask',
      title: 'Before you ask',
      intro: 'Short answers to common questions.',
      blocks: [
        {
          h: 'Is a Paybill or Till number required?',
          p: 'Yes. Payments go to your own number. If you do not have one yet, we can explain how to get one.'
        },
        {
          h: 'Who holds the money?',
          p: 'You do. Customers pay your Paybill or Till number directly. We do not run a wallet or hold funds.'
        },
        {
          h: 'What does it cost?',
          p: 'Safaricom charges its own transaction fees, which depend on your account type. Our fee is quoted after a first call, once we know what you need.'
        },
        {
          h: 'How long does it take?',
          p: 'It depends on your site and on Safaricom\'s go-live steps, so we agree a timeline after the first call.'
        },
        {
          h: 'Can this be added to a site you did not build?',
          p: 'Often yes, if the site can be extended. We check on the first call.'
        },
        {
          h: 'Can card payments be added too?',
          p: 'Cards need a different payment provider. We can talk through the options.'
        }
      ],
      faq: true
    },
    {
      id: 'start',
      nav: 'Start with an enquiry',
      title: 'Take payments on your website',
      intro: 'Tell us what you sell and how customers pay today. We will reply with the next step.',
      blocks: [],
      cta: {
        to: '/contact',
        label: 'Start a project'
      }
    }
  ]
}
