export const SITE = {
  name: "DreamPort Travels",
  legalName: "DreamPort Travels (SMC-Private) Limited",
  shortName: "DreamPort",
  domain: "dreamporttravels.online",
  email: "info@dreamporttravels.online",
  supportEmail: "support@dreamporttravels.online",
  phone: "0311-0406221",
  phoneIntl: "+923110406221",
  whatsapp: "923110406221",
  address: "Adnan Printers, Press Market, Near Bus Stand, Depalpur, District Okara, Punjab, Pakistan",
  shortAddress: "Depalpur, District Okara, Punjab",
  tagline: "Your Gateway to the Global Horizon.",
  description:
    "Premium visa processing and Umrah services tailored for Pakistani travelers. Seamless, secure, and fully digital.",
  socials: {
    facebook: "#",
    instagram: "#",
    youtube: "#",
  },
};

export const formatPKR = (n: number) =>
  `PKR ${new Intl.NumberFormat("en-PK").format(n)}`;
