
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./Footer.css";

 
const platformLinks = ["Over view", "Features", "Contact Us", "About"];
const serviceLinks = [
  "Irrigation and Fertilization scheduling",
  "Disease Alerts",
  "Statistics and Production Reports",
  "Inventory Management",
  "Irrigation Conditions",
];
const helpLinks = [
  "How dose it work?",
  "How I detect the presence of diseases?",
  "How do I take care of my farm properly?",
  "How can I reduce waste?",
];

const socialIcons = [
  {
    name: "Telegram",
    path: <path d="M19.42 4.6a1 1 0 0 0-1.06-.12L3.9 11.6a1 1 0 0 0 .08 1.82l3.92 1.55 1.55 4.1a1 1 0 0 0 1.8.16l2.53-3.27 4.36 3.31a1 1 0 0 0 1.58-.58l2.4-12.42a1 1 0 0 0-.2-.87ZM9.65 16.9l-.7-2.87 8.43-7.2-7.73 8.04Zm8.2-9.5-8.53 7.28-.38-.98 9.47-6.07-.56 9.77-3.87-2.94 4.5-7.06a1 1 0 0 0-.63-.64Z" />,
  },
  {
    name: "Facebook",
    path: <path d="M13.5 21v-7h2.4l.36-2.8H13.5V9.4c0-.8.22-1.35 1.37-1.35h1.47V5.55c-.25-.04-1.1-.12-2.09-.12-2.07 0-3.49 1.26-3.49 3.56V11.2H8v2.8h2.76v7h2.74Z" />,
  },
  {
    name: "Instagram",
    path: <path d="M7.6 3h8.8A4.6 4.6 0 0 1 21 7.6v8.8a4.6 4.6 0 0 1-4.6 4.6H7.6A4.6 4.6 0 0 1 3 16.4V7.6A4.6 4.6 0 0 1 7.6 3Zm0 1.7A2.9 2.9 0 0 0 4.7 7.6v8.8a2.9 2.9 0 0 0 2.9 2.9h8.8a2.9 2.9 0 0 0 2.9-2.9V7.6a2.9 2.9 0 0 0-2.9-2.9H7.6Zm4.4 2.9a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Zm5.1-2.1a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />,
  },
  {
    name: "LinkedIn",
    path: (
      <>
        <path d="M6.5 8.4H4.1V20h2.4V8.4Z" />
        <path d="M5.3 3.6a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z" />
        <path d="M10.1 8.4V20h2.4v-6.1c0-1.6.6-2.7 2-2.7 1.2 0 1.8.9 1.8 2.7V20h2.4v-6.8c0-3.1-1.8-4.7-4.1-4.7-1.4 0-2.4.6-3.1 1.6V8.4h-2.4Z" />
      </>
    ),
  },
  {
    name: "WhatsApp",
    path: <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Zm0 1.8a7.2 7.2 0 0 1 6.2 10.8l-.15.26.7 2.6-2.7-.7-.24.14A7.2 7.2 0 1 1 12 4.8Zm-3.3 4c-.2 0-.5.06-.7.3-.2.25-.8.8-.8 1.94 0 1.12.83 2.21.95 2.36.12.15 1.57 2.4 3.84 3.27 1.88.73 2.27.58 2.68.55.4-.04 1.3-.54 1.48-1.06.18-.52.18-.96.12-1.06-.06-.1-.22-.16-.47-.28-.25-.12-1.47-.73-1.7-.82-.22-.1-.39-.15-.56.11-.16.25-.64.82-.8.98-.15.16-.3.18-.55.06-.25-.12-1.03-.38-1.96-1.22-.73-.65-1.22-1.46-1.36-1.7-.14-.25-.01-.39.1-.52.1-.1.25-.28.38-.42.13-.14.17-.25.26-.42.09-.17.04-.32-.02-.45-.07-.12-.56-1.36-.77-1.85-.2-.47-.4-.4-.56-.41-.16-.01-.34-.01-.52-.01Z" />,
  },
];

function SocialIcon({ name, path }) {
  return (
    <a className="footer__socialLink" href="/" aria-label={name}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {path}
      </svg>
    </a>
  );
}

export default function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const handleSignup = () => {
    navigate("/register");
  };

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">

          {/* حاوية القوائم */}
          <div className="footer__links">
            <nav className="footer__column" aria-label="Platform">
              <h3 className="footer__title">Platform</h3>
              <ul className="footer__list">
                {platformLinks.map((link) => (
                  <li key={link} className="footer__item">
                    {link}
                  </li>
                ))}
              </ul>
            </nav>
 
            <nav className="footer__column" aria-label="Service">
              <h3 className="footer__title">
                <Link to="/help-center" state={{ activeTab: "user-guide" }} className="footer__clickable-title">
                  Service
                </Link>
              </h3>
              <ul className="footer__list">
                {serviceLinks.map((link) => (
                  <li key={link} className="footer__item">
                    {link}
                  </li>
                ))}
              </ul>
            </nav>

        
            <nav className="footer__column" aria-label="Help">
              <h3 className="footer__title">
                <Link to="/help-center" state={{ activeTab: "tech-support" }} className="footer__clickable-title">
                  Help
                </Link>
              </h3>
              <ul className="footer__list">
                {helpLinks.map((link) => (
                  <li key={link} className="footer__item">
                    {link}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="footer__column footer__column--contact">
            
<h3 className="footer__title">
  <Link to="/about" className="footer__clickable-title">
    Contact Us
  </Link>
</h3>
              <ul className="footer__list">
                <li className="footer__item">(716) 523-3577</li>
                <li className="footer__item">130- Syria - Homs</li>
              </ul>
            </div>
          </div>

          {/* القسم العربي الشعار والوصف */}
          <div className="footer__brand" dir="rtl">
            <div className="footer__brandHeader">
              <img
                className="footer__logo"
                src="/img/logo.png"
                alt="AgriSmart logo"
              />
              <h2 className="footer__brandName">AgriSmart</h2>
            </div>

            <p className="footer__description">
              خطوة نوعية نحو تحويل المزرعة الصغيرة إلى منظومة تعمل بوعي ذاتي،
              تتعلم من بياناتها، وتتفاعل مع بيئتها، وتساهم في تقليل الهدر وتحسين
              الإنتاج. نهدف إلى تعزيز ثقافة الزراعة الذكية. وهو جزء من رؤية أوسع
              تهدف إلى بناء مستقبل زراعي قادر على مواجهة متغيرات المناخ وضمان
              الأمن الغذائي للأجيال القادمة.
            </p>

            <div className="footer__cta">
              <button
                className="footer__ctaButton"
                type="button"
                onClick={handleSignup}
              >
                إنشاء حساب
              </button>
            </div>
          </div>

        </div>

        {/* الجزء السفلي - الحقوق ومواقع التواصل */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            @agrismart 2025-2026. All rights reserved.
          </p>

          <div className="footer__social" aria-label="Social links">
            {socialIcons.map((icon) => (
              <SocialIcon key={icon.name} {...icon} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}