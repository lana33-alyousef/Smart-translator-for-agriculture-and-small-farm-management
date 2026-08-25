import "./Statistics.css";

const platformStats = [
  "عدد مستخدمي المنصة النشطين: 4,820 مستخدم",
  "إجمالي الزيارات خلال هذا الشهر: 32,400 زيارة",
  "متوسط الزيارات اليومية: 1,080 زيارة",
  "نسبة نمو المستخدمين هذا الأسبوع: +12%",
  "عدد المزارعين الذين انضموا حديثاً: 56 مزارع",
  "متوسط فترة البقاء في المنصة: 6 دقائق و 14 ثانية",
  "عدد العمليات التي تمت عبر المنصة اليوم: 340 عملية",
];

const farmsStats = [
  "إجمالي عدد المزارع المُدارة: 12 مزرعة",
  "متوسط رطوبة التربة الحالي: 54%",
  "نسبة المزارع التي تحتاج ري خلال 24 ساعة: 38%",
  "معدل الاستهلاك اليومي للمياه: 1,240 لتر",
  "مستوى كفاءة الري الذكي: 87%",
];

export default function Statistics() {
  return (
    <section className="statsSection" dir="rtl">
      <div className="statsContainer">
        <header className="statsHeader">
          <h2>احصائيات عامة</h2>
          <p>
            تعكس الإحصائيات حجم التفاعل المتزايد على المنصة، حيث يشهد النمو
            مستمراً في عدد المستخدمين مما يؤكد ثقة المؤسسات والأفراد في خدماتنا.
          </p>
        </header>

        <div className="statsVisual">
          <img
            className="statsLeaf"
            src="/img/3dc5f75872b4443aac0bf577c39babfe998c54ff.png"
            alt=""
            aria-hidden="true"
          />

          <article className="statsCard statsCard--platform">
            <h3>📈 الوضع الإحصائي العام للمنصة</h3>
            <ul>
              {platformStats.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="statsCard statsCard--farms">
            <h3>📊 الوضع الإحصائي العام للمزارع</h3>
            <ul>
              {farmsStats.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
