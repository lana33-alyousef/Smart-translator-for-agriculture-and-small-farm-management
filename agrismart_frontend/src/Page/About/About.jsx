import { useState } from "react";
import "./About.css";
import Navbar from "../../Component/Navbar/Navbar";
import { api } from "../../api/client";
import messag from "../../img/messag.png";

// استيراد جميع الأيقونات المطلوبة
import { FiMapPin, FiTarget, FiAward, FiZap, FiCheck, FiClock } from "react-icons/fi";
import { FaWhatsapp, FaLinkedinIn, FaFacebookF } from "react-icons/fa6";
import { HiMiniEnvelope } from "react-icons/hi2";

const About = () => {
  const companyEmail = "support.agrismart@gmail.com";
  const companyPhone = "+963 930 000 000";
  const [contactData, setContactData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactStatus, setContactStatus] = useState(null);
  const [contactError, setContactError] = useState(null);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setContactStatus(null);
    setContactError(null);

    try {
      const response = await api.post("/api/contact/", contactData);
      const message = response?.data?.detail || "تم إرسال طلبك بنجاح.";
      setContactStatus(message);
      setContactData({ full_name: "", email: "", phone_number: "", category: "", message: "" });
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "فشل الإرسال. تأكد من الاتصال بالخادم.";
      setContactError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // بيانات البطاقات الثلاث في المنتصف
  const statsCards = [
    { icon: <FiTarget />, title: "رؤيتنا", desc: "أن نكون الشريك التقني الأول للمزارع الذكي في المنطقة." },
    { icon: <FiZap />, title: "سرعتنا", desc: "تحليل فوري للبيانات لتقديم توصيات لحظية تحمي محاصيلك." },
    { icon: <FiAward />, title: "جودتنا", desc: "نستخدم أدق نماذج الذكاء الاصطناعي لضمان أفضل إنتاجية." },
  ];

  return (
    <div className="merged-about-page">
      <Navbar />
      <img src="/img/bg22.png" className="page-background-img" alt="" />

      <div className="container-wrapper">
        
        {/* قسم من نحن - البطل */}
        <section className="about-hero-section">
          <div className="modern-glass-card intro-card">
            <div className="intro-content">
              <div className="text-side">
                <span className="badge">تعرف علينا</span>
                <h2 className="main-title">تمكين المزارعين عبر <span className="highlight">الذكاء الاصطناعي</span></h2>
                <p className="description">
                  نحن فريق تقني نسعى إلى تحويل الزراعة التقليدية إلى منظومة ذكية. منصتنا ليست مجرد أداة، بل هي شريك مخلص يساعدك في إدارة المزارع، تحسين الإنتاج، وتقليل الهدر باستخدام بيانات دقيقة وتوصيات ذكية لدعم الزراعة المستدامة.
                </p>
                <div className="features-grid">
                  <div className="feat-item"><FiCheck className="check-icon" /> دعم مستدام</div>
                  <div className="feat-item"><FiCheck className="check-icon" /> تحليل رقمي</div>
                  <div className="feat-item"><FiCheck className="check-icon" /> إدارة ذكية</div>
                </div>
              </div>
              <div className="image-side">
                <div className="image-blob">
                  <img src="/img/react.png" alt="Technology" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* قسم البطاقات الثلاث في المنتصف */}
        <section className="stats-section">
          <div className="stats-grid">
            {statsCards.map((card, index) => (
              <div className="stat-card modern-glass-card" key={index}>
                <div className="stat-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* لماذا نحن؟ */}
        <section className="why-us-section">
          <div className="modern-glass-card why-card">
            <div className="why-content">
               <div className="image-side">
                  <img src="/img/fourthimag.png" alt="Features" className="side-img" />
               </div>
               <div className="text-side">
                  <h2 className="section-title">لماذا منصتنا هي أفضل خيار؟</h2>
                  <ul className="custom-list">
                    <li>توصيات دقيقة للري والإنتاج بناءً على حالة الطقس والتربة.</li>
                    <li>لوحة تحكم بسيطة تمنحك سيطرة كاملة بضغطة زر.</li>
                    <li>إرشادات وقائية متطورة تحميك من الآفات قبل وقوعها.</li>
                  </ul>
               </div>
            </div>
          </div>
        </section>

        {/* قسم التواصل الشامل والمحدث */}
        <section id="contact" className="comprehensive-contact-section">
          <div className="section-header-center">
            <span className="badge">اتصل بنا</span>
            <h2 className="title-green">لنعمل معاً على نمو مشروعك</h2>
            <p className="subtitle">فريقنا جاهز للإجابة على استفساراتك التقنية والزراعية في أي وقت</p>
          </div>

          <div className="modern-glass-card main-contact-wrapper">
            <div className="contact-layout-grid">
              
              {/* الجانب الأيمن: معلومات تفصيلية */}
              <div className="contact-info-column">
                <div className="info-visual">
                   <img src={messag} alt="Contact Illustration" className="contact-main-img" />
                </div>
                
                <div className="contact-methods-list">
                  <div className="method-card">
                    <div className="method-icon"><FiClock /></div>
                    <div className="method-text">
                      <h4>ساعات العمل</h4>
                      <p>الأحد - الخميس: 9:00 ص - 5:00 م</p>
                    </div>
                  </div>

                  <div className="method-card">
                    <div className="method-icon"><FaWhatsapp /></div>
                    <div className="method-text">
                      <h4>واتساب سريع</h4>
                      <p dir="ltr"><a style={{ textDecoration: 'none' , color: 'green'}} href={`https://wa.me/${companyPhone}`} target="_blank" rel="noopener noreferrer">{companyPhone}</a></p>
                    </div>
                  </div>

                  <div className="method-card">
                    <div className="method-icon"><FiMapPin /></div>
                    <div className="method-text">
                      <h4>الموقع الرئيسي</h4>
                      <p>سوريا، حمص، مركز تقنيات الزراعة</p>
                    </div>
                  </div>
                </div>

                <div className="social-connect">
                  <h5>تابعنا على منصات التواصل:</h5>
                  <div className="social-icons-row">
                    <a href="#" className="social-circle"><FaLinkedinIn /></a>
                    <a href="#" className="social-circle"><FaFacebookF /></a>
                    <a href={`mailto:${companyEmail}`} className="social-circle"><HiMiniEnvelope /></a>
                  </div>
                </div>
              </div>

              {/* الجانب الأيسر: نموذج التواصل */}
              {/* الجانب الأيسر: نموذج التواصل المطور */}
<div className="contact-form-column">
  <div className="form-container-inner">
    <div className="form-heading">
      <h3>أرسل لنا رسالة مباشرة</h3>
      <p>سيعاود فريقنا الاتصال بك خلال أقل من 24 ساعة.</p>
    </div>
    
    <form className="enhanced-comprehensive-form" onSubmit={handleContactSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label>الاسم الكامل</label>
          <input
            type="text"
            name="full_name"
            placeholder="أدخل اسمك الثلاثي"
            value={contactData.full_name}
            onChange={handleContactChange}
            required
          />
        </div>
        <div className="form-group">
          <label>البريد الإلكتروني</label>
          <input
            type="email"
            name="email"
            placeholder="example@mail.com"
            value={contactData.email}
            onChange={handleContactChange}
            required
          />
        </div>
        <div className="form-group">
          <label>رقم الهاتف</label>
          <input
            type="tel"
            name="phone_number"
            placeholder="+963 9xx xxx xxx"
            value={contactData.phone_number}
            onChange={handleContactChange}
          />
        </div>
        <div className="form-group">
          <label>نوع الاستفسار</label>
          <select
            name="category"
            value={contactData.category}
            onChange={handleContactChange}
            required
          >
            <option value="">اختر القسم</option>
            <option value="tech">دعم تقني</option>
            <option value="agri">استشارة زراعية</option>
            <option value="sales">مبيعات واشتراكات</option>
            <option value="other">أخرى</option>
          </select>
        </div>
      </div>
      
      <div className="form-group full-width">
        <label>رسالتك</label>
        <textarea
          name="message"
          rows="4"
          placeholder="كيف يمكننا مساعدتك اليوم؟"
          value={contactData.message}
          onChange={handleContactChange}
          required
        ></textarea>
      </div>

      {contactStatus && <p className="contact-success">{contactStatus}</p>}
      {contactError && <p className="contact-error">{contactError}</p>}

      <button type="submit" className="submit-btn-glow">
        {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب الآن'}
      </button>
    </form>
  </div>
</div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;