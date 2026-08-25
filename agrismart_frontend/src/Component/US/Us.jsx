import "./Us.css";
export default function Us() {
  return (
    <div className="main">
              <h2>لماذا منصتنا؟</h2>
    <div className="container-fluid us">
      <div className="us-cards">
        <div className="card-cont">
          <div className="card-photo">
            <img
              src="/img/fee0d54dcf0683e9f50a5aeb2a17e1d48f5c8acd.jpg"
              alt="حقل زراعي"
            />
          </div>
          <div className="card-talk">
            توقعات إنتاج احترافية تمنحك رؤية واضحة لمستقبل محاصيلك وتساعدك في
            التخطيط المالي.
          </div>
        </div>
        <div className="card-cont middle">
          {" "}
          <div className="card-photo">
            <img
              src="/img/3935928929933c0411c5aa151b6b0635dc119be7.jpg"
              alt="محصول في الحقل"
            />
          </div>
          <div className="card-talk">
            توقعات إنتاج احترافية تمنحك رؤية واضحة لمستقبل محاصيلك وتساعدك في
            التخطيط المالي.
          </div>
        </div>
        <div className="card-cont">
          {" "}
          <div className="card-photo">
            <img
              src="/img/fa287e591ca805f1df472e0e57c9e07fdc22ca22.jpg"
              alt="مزارع"
            />
          </div>
          <div className="card-talk">
            توقعات إنتاج احترافية تمنحك رؤية واضحة لمستقبل محاصيلك وتساعدك في
            التخطيط المالي.
          </div>
        </div>
      </div>
      <div className="us-talk" dir="rtl">

        <p>
          لأنها تمنحك إدارة كاملة
          <br /> للمزرعة من خلال لوحة تحكم
          <br /> سهلة، شاملة، وقادرة على
          <br /> التعامل مع كل تفاصيل
          <br /> العمل الزراعي.
          <br /> توفير أكبر للمياه والجهد عبر
          <br /> توصيات ري دقيقة تساعدك على <br />
          الاستخدام الأمثل
          <br /> للموارد.
        </p>
      </div>
    </div>
    </div>
  );
}
