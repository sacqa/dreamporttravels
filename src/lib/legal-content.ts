import { SITE } from "./site";

export const LEGAL: Record<string, { title: string; description: string; sections: { h: string; p: string }[] }> = {
  "privacy-policy": {
    title: "Privacy Policy",
    description: `How ${SITE.legalName} collects, uses and protects your personal information.`,
    sections: [
      { h: "1. Information We Collect", p: `We collect personal information you provide when using our services — including your name, CNIC, contact details, passport scans, travel documents, and payment details. This data is required to process visa applications and Umrah bookings.` },
      { h: "2. How We Use Your Information", p: `Your information is used solely to (a) process visa and travel bookings, (b) communicate order updates by phone, WhatsApp or email, (c) comply with consular and regulatory requirements, and (d) issue invoices and receipts.` },
      { h: "3. Payment Information", p: `Payments are processed through JazzCash, Easypaisa and authorised bank channels. We do not store full card or wallet credentials on our servers. Transactions are subject to the respective gateway's privacy and security terms.` },
      { h: "4. Data Sharing", p: `We share applicant data with consulates, embassies, airlines, hotels and visa-processing partners strictly as required to fulfil your booking. We never sell personal data to third parties.` },
      { h: "5. Data Security", p: `All website traffic is SSL-encrypted. Database access is role-restricted with row-level security. Physical documents at our office are stored in secured cabinets and destroyed after the regulatory retention period.` },
      { h: "6. Cookies", p: `Our site uses essential cookies for cart functionality and analytics cookies to understand traffic. See our Cookie Policy for details.` },
      { h: "7. Your Rights", p: `You may request access, correction or deletion of your personal data by emailing ${SITE.email}. We respond within 30 days.` },
      { h: "8. Contact", p: `For privacy concerns: ${SITE.email} • ${SITE.phone} • ${SITE.address}.` },
    ],
  },
  "terms": {
    title: "Terms & Conditions",
    description: `Terms governing the use of ${SITE.domain} and services from ${SITE.legalName}.`,
    sections: [
      { h: "1. Acceptance of Terms", p: `By accessing this website or booking any service, you agree to these Terms & Conditions and our Privacy Policy.` },
      { h: "2. Services Offered", p: `We provide visa documentation assistance, Umrah package booking, travel insurance referrals and related advisory services. We are NOT a consulate, embassy or government authority — final visa decisions rest exclusively with the issuing authority.` },
      { h: "3. Service Fees", p: `Prices shown in PKR include our professional service fee. Government, embassy, biometric, courier and other third-party charges are clearly itemised separately where applicable.` },
      { h: "4. Booking & Payment", p: `Online payments are made via JazzCash, Easypaisa or bank transfer. Service processing begins after payment confirmation and document submission.` },
      { h: "5. Customer Responsibilities", p: `You must provide accurate, complete documents and disclose any prior visa refusals or travel history. We are not liable for visa refusals due to incomplete or false information supplied by the applicant.` },
      { h: "6. Limitation of Liability", p: `${SITE.legalName} is not liable for visa refusals, flight delays, currency fluctuations or actions of third-party suppliers. Our liability in any case is limited to the service fee paid.` },
      { h: "7. Governing Law", p: `These terms are governed by the laws of the Islamic Republic of Pakistan, with exclusive jurisdiction of courts in Okara, Punjab.` },
      { h: "8. Changes to Terms", p: `We may update these terms periodically. Continued use of the site after changes constitutes acceptance.` },
    ],
  },
  "refund-policy": {
    title: "Refund Policy",
    description: `Refund eligibility and process for services from ${SITE.legalName}.`,
    sections: [
      { h: "1. Service Fee Refunds", p: `Our professional service fee is refundable in full if requested before document submission to the consulate. Once submitted, the service fee is non-refundable as work has commenced.` },
      { h: "2. Embassy & Government Fees", p: `Visa application fees, biometric charges and government levies are non-refundable once paid to the embassy, regardless of visa outcome.` },
      { h: "3. Umrah Package Refunds", p: `Cancellation 30+ days before departure: 80% refund. 15–29 days: 50%. Less than 15 days: no refund. Visa fees, airline tickets and hotel pre-payments follow each supplier's policy.` },
      { h: "4. Visa Refusal", p: `In the event of visa refusal by the embassy, the embassy/visa fee is non-refundable but our service fee may be partially refunded at management discretion (typically 30–50%).` },
      { h: "5. How to Request a Refund", p: `Email ${SITE.email} with your order number and reason. Approved refunds are processed within 7–10 business days via the original payment method.` },
      { h: "6. Dispute Resolution", p: `Disputes should first be raised with our support team. Unresolved disputes are subject to Pakistani consumer-protection laws.` },
    ],
  },
  "cancellation-policy": {
    title: "Cancellation Policy",
    description: `Order cancellation rules for visa and Umrah services.`,
    sections: [
      { h: "1. Visa Service Cancellation", p: `You may cancel before document submission for a full service-fee refund. After submission, cancellation does not entitle you to a refund of fees already paid to the embassy or our team.` },
      { h: "2. Umrah Cancellation", p: `Refer to the Refund Policy for the tiered cancellation schedule. Cancellations must be in writing via email.` },
      { h: "3. Cancellation by DreamPort", p: `In the rare event we cannot deliver a service (e.g. embassy suspension), we will issue a full refund or offer an alternative service of equal value.` },
      { h: "4. Force Majeure", p: `Cancellations due to events beyond our control (visa policy changes, pandemics, war, natural disasters) follow the supplier's terms; we will assist in maximising any recoverable amount.` },
    ],
  },
  "shipping-policy": {
    title: "Service Delivery Policy",
    description: `How and when services are delivered, since our products are non-physical.`,
    sections: [
      { h: "1. Nature of Services", p: `DreamPort Travels delivers services, not physical goods. There are no parcels to be shipped.` },
      { h: "2. Service Initiation", p: `Service work begins within 24 hours of confirmed payment and document submission. Our representative will contact you to collect required documents.` },
      { h: "3. Document Collection & Return", p: `Original documents (e.g. passports) may be couriered to our Depalpur office or dropped off in person. After processing, we return them by registered courier at no additional cost within Pakistan.` },
      { h: "4. Visa Delivery", p: `E-visas are delivered to your registered email. Sticker visas (where applicable) are returned with your passport via courier.` },
      { h: "5. Umrah Documents", p: `Umrah confirmation, flight tickets, hotel vouchers and itinerary are delivered to your email at least 7 days before departure.` },
      { h: "6. Estimated Processing Times", p: `Each service page lists the expected processing time. Actual times depend on the consulate/embassy and are beyond our control.` },
    ],
  },
  "cookie-policy": {
    title: "Cookie Policy",
    description: `How we use cookies and similar technologies on ${SITE.domain}.`,
    sections: [
      { h: "1. What Are Cookies", p: `Cookies are small text files stored on your device by your browser. They help websites remember your preferences and improve user experience.` },
      { h: "2. Cookies We Use", p: `Essential cookies (cart contents, login session) — required for the site to work. Analytics cookies — anonymous traffic data to improve our services.` },
      { h: "3. Third-Party Cookies", p: `Payment gateways (JazzCash, Easypaisa) may set their own cookies during checkout, governed by their privacy policies.` },
      { h: "4. Managing Cookies", p: `You can disable cookies in your browser settings. Note: disabling essential cookies may prevent checkout from working.` },
    ],
  },
  "disclaimer": {
    title: "Disclaimer",
    description: `Important disclosures regarding our services.`,
    sections: [
      { h: "1. Not a Government Body", p: `${SITE.legalName} is a private travel services company. We are NOT a consulate, embassy, ministry, or any government authority. Visa approvals are at the sole discretion of the issuing country.` },
      { h: "2. Information Accuracy", p: `While we strive to keep prices, processing times and requirements up to date, embassy rules change frequently. We are not liable for outdated information.` },
      { h: "3. Third-Party Services", p: `Airlines, hotels, insurers and consulates are independent entities. We act as a coordinator, not the supplier, and follow each supplier's terms.` },
      { h: "4. No Guarantee of Visa Approval", p: `No travel agency can guarantee a visa. Anyone claiming a guaranteed approval is misrepresenting their authority. We commit only to accurate documentation and timely submission.` },
    ],
  },
  "faqs": {
    title: "Frequently Asked Questions",
    description: `Common questions about visa and Umrah services from ${SITE.shortName}.`,
    sections: [
      { h: "How do I apply for a visa?", p: `Pick a country from our Visa Services page, add it to cart, and complete checkout. Our representative will contact you within 24 hours to collect documents.` },
      { h: "What payment methods do you accept?", p: `JazzCash, Easypaisa, and direct bank transfer. We are working on adding additional card options soon.` },
      { h: "Do you guarantee visa approval?", p: `No agency can. Visa approval is at the embassy's discretion. We maximise your chances through accurate, complete documentation.` },
      { h: "Can I visit your office in person?", p: `Yes — we welcome walk-ins at our Depalpur office during business hours. See the Contact page for the full address.` },
      { h: "How long does processing take?", p: `Each visa service lists an estimated processing time on its page. Times depend on the embassy and may vary.` },
      { h: "Is my data safe with you?", p: `Yes. We use SSL encryption, role-based access controls, and follow our published Privacy Policy.` },
      { h: "What happens after I place an order online?", p: `You'll receive an order confirmation. Within 24 hours, our representative will call/WhatsApp you to confirm payment and collect documents.` },
      { h: "Can I cancel my booking?", p: `Yes — see our Cancellation and Refund Policies for full details.` },
    ],
  },
};
