import Navbar from "../../Component/Navbar/Navbar";
import Section from "../../Component/Section1/Section";
import pepole from "../../img/pepole.png";
import Partips from "../../Component/Partips/Partips";
import "./Tips.css";

const Tips = () => {

  // تحويل النصوص إلى أجزاء (عناوين وتفاصيل) لتنسيقها باحترافية
  const containes = [
    {
      title: "العناية الجيدة بالأرض هي أساس الإنتاج الزراعي الناجح.",
      intro: "عندما تُنصح المزارع باتباع أساليب علمية ومدروسة، فهو سيحصل على أرض أكثر خصوبة ومخاطر أقل. نقدم لك مجموعة من الإرشادات الوقائية:",
      points: [
        { label: "تحليل التربة بشكل دوري:", text: "يساعد التحليل في معرفة ما ينقص التربة من عناصر غذائية، لتجنب التسميد العشوائي." },
        { label: "اتباع الدورات الزراعية:", text: "تغيير أنواع المحاصيل كل موسم يحافظ على خصوبة الأرض ويقلل التكاليف." },
        { label: "الحراثة المناسبة:", text: "اختيار الطريقة المناسبة يمنع انضغاط التربة ويساعد الجذور على الامتداد." },
        { label: "إضافة المادة العضوية:", text: "مثل السماد البلدي الذي يحسن بنية التربة وتساعدها على الاحتفاظ بالماء." },
        { label: "إزالة الأعشاب الضارة:", text: "لأنها تنافس المحاصيل على المياه والغذاء وقد تجذب الآفات." },
      ],
      firstimagee: "/img/firstimag.jpg",
      reverse: false,
    },
    {
      title: "مراقبة الأمراض والطقس أمر أساسي لتفادي الخسائر.",
      intro: "أي تأخر في اكتشاف المشكلة قد يسبب خسائر كبيرة. ويمكنك تفادي هذه الأمراض عن طريق:",
      points: [
        { label: "الفحص الدوري للنباتات:", text: "مجرد نظرة أسبوعية للحقول قد تكشف بقعة فطرية، الاكتشاف المبكر يوفر العلاج." },
        { label: "أدوات مراقبة الآفات:", text: "مثل المصائد اللاصقة التي تساعد على معرفة متى بدأت الحشرات في الظهور." },
        { label: "متابعة نشرات الطقس:", text: "معرفة موجات الصقيع أو الأمطار مسبقاً يمنحك فرصة للاستعداد." },
        { label: "حساسات ذكية:", text: "تجعلك تعرف الظروف التي تساعد على انتشار الأمراض مثل زيادة الرطوبة." },
      ],
      firstimagee: "/img/secondimage.jpg",
      reverse: false,
    },
    {
      title: "إدارة الري والتسميد لتقليل الهدر.",
      intro: "الهدر في الري أو التسميد يعني خسارة المال وإضرار البيئة. ويمكنك تفاديه عن طريق:",
      points: [
        { label: "استخدام الري بالتنقيط:", text: "يوصل الرطوبة مباشرة للجذور دون تبخر كبير، ما يحسن النمو ويوفر التكاليف." },
        { label: "التسميد حسب التحليل:", text: "الاعتماد على نتائج تحليل التربة لتحديد كمية السماد بدقة دون زيادة ضارة." },
        { label: "الري في الأوقات المناسبة:", text: "مثل الصباح الباكر أو المساء حيث يكون التبخر أقل." },
        { label: "أجهزة قياس الرطوبة:", text: "لمعرفة الوقت الحقيقي الذي تحتاج فيه التربة للري بدلاً من التقدير الشخصي." },
      ],
      firstimagee: "/img/thirdimag.jpg",
      reverse: false,
    },
    {
      title: "لماذا الانضمام إلى منصتنا هو خطوتك الأفضل؟",
      intro: "ننصحك بالانضمام إلى موقعنا وتكون جزءاً منا، لأننا نوفر لك:",
      points: [
        { label: "توفير المال والموارد:", text: "المنصة تساعدك على معرفة الكمية المناسبة من الماء والسماد، ما يقلل الهدر ويزيد أرباحك." },
        { label: "التحذيرات الذكية:", text: "ستحصل على إشعارات فورية في حال وجود موجة صقيع أو ظروف مهيئة للأمراض." },
        { label: "تحليل دقيق للمزرعة:", text: "أدواتنا تقدم تقارير شاملة عن التربة وتوقعات الإنتاج لدعم قراراتك." },
        { label: "سهولة الاستخدام:", text: "صُممت واجهاتنا لتكون بسيطة وواضحة، لتدير مزرعتك من هاتفك بكل سهولة." },
      ],
      firstimagee: "/img/fourthimag.png",
      reverse: false, 
    },
  ];

  return (
    <div className="merged-tips-page">
      <Navbar/>
      <div className="tips-hero">
        
        <div className="hero-overlay">
          <Section
            parpepole="مجموعة من النصائح والإرشادات الصحيحة"
            pepole={pepole}
          />
        </div>
           <div className="intro-tips-section" dir="rtl">
             <ul>
             <li> الأرض أمانة بين يديك، وكل ما تقدمه لها اليوم ستجنيه غداً محصولاً وصحة وخيراً.</li>
      
              <li> نجاحك في الزراعة لا يعتمد فقط على الخبرة المتوارثة，</li>
               
              <li> بل على المراقبة المستمرة، والقرار الصحيح في الوقت المناسب.</li>
                
              <li> لذلك نضع بين يديك هذه الإرشادات لتكون دليلك اليومي في الاهتمام بأرضك ومحصولك</li>
             </ul>
          </div>
      </div>

      <div className="tips-content-wrapper">
        <div className="container-wrapper">

          <div className="tips-cards-container">
            {containes.map((containe, index) => (
              <div className="modern-glass-card tip-card-wrapper" key={index}>
                <Partips reverse={containe.reverse} className="aligned-partips">
                  
                  {/* قسم النصوص */}
                  <div className="text-content">
                    <h2 className="tip-title">{containe.title}</h2>
                    {containe.intro && <p className="tip-intro">{containe.intro}</p>}
                    
                    <ul className="structured-points">
                      {containe.points.map((point, i) => (
                        <li key={i} className="point-item">
                          <span className="point-label">{point.label}</span>
                          <span className="point-text">{point.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* قسم الصورة */}
                  <div className="image-content">
                    <img src={containe.firstimagee} alt="Tip visual" className="tip-image" />
                  </div>
                  
                </Partips>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Tips;