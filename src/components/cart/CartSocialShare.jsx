import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { buildCartSummary } from "../../services/serviceCart.js";
import SocialChatShare from "../social/SocialChatShare.jsx";

export default function CartSocialShare({ cart, customer }) {
  const { t, language } = useLanguage();
  return (
    <SocialChatShare getText={() => buildCartSummary({ cart, language, t, customer })} />
  );
}
