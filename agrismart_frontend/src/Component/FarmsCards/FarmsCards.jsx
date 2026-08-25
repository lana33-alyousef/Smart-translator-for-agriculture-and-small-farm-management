import "./FarmsCards.css";

const farms = [
  {
    id: 1,
    title: "مزرعة برتقال",
    region: "ريف غربي",
    status: "bad", // bad | ok
    irrigation: "معدل الري: مناسب خلال 3 ساعات يحتاج لري",
    temp: "الحرارة: 28°C",
    pests: "الآفات: لا يوجد",
    yieldText: "الإنتاج المتوقع: جيد 80%",
    image: "/img/e59165957bf6abd1c41fb2cb239ec902dd4cfbd6%20(1).jpg",
  },
  {
    id: 2,
    title: "مزرعة قمح",
    region: "ريف شمالي",
    status: "bad",
    irrigation: "معدل الري: تحتاج ري خلال  6 ساعات",
    temp: "الحرارة: 27°C",
    pests: "الآفات: لا يوجد",
    yieldText: "الإنتاج المتوقع: جيد",
    image: "/img/bb5f1d18a6bfaed1cf510a0b17ae0d06ba6068bf%20(1).jpg",
  },
  {
    id: 3,
    title: "مزرعة الزيتون",
    region: "شمال المدينة",
    status: "bad",
    irrigation: "معدل الري: 7 ساعات",
    temp: "الحرارة: 29°C",
    pests: "الآفات: لا يوجد",
    yieldText: "الإنتاج المتوقع: جيد 85%",
    image: "/img/e7ab8281c13826a8e5be6eaa97e0e3460e126481%20(1).jpg",
  },
  {
    id: 4,
    title: "مزرعة خضار",
    region: "ضواحي المدينة",
    status: "ok",
    irrigation: "معدل الري: 3 ساعات",
    temp: "الحرارة: 29°C",
    pests: "الآفات: لا يوجد",
    yieldText: "الإنتاج المتوقع: جيد 90%",
    image: "/img/1f5f12c889834067fd9043c245acb59dd534229f.jpg",
  },
  {
    id: 5,
    title: "مزرعة ليمون",
    region: "غرب المدينة",
    status: "ok",
    irrigation: "معدل الري: 12 ساعات",
    temp: "الحرارة: 29°C",
    pests: "الآفات: لا يوجد",
    yieldText: "الإنتاج المتوقع: 78%",
    image: "/img/166ea24ab27212702ac0576c2ef75385e71ef763.jpg",
  },
  // add more cards...
];

function Icon({ type }) {
  const iconMap = {
    region: "/img/Vector3334%20(1).png",
    water: "/img/Group.png",
    temp: "/img/Icon.png",
    ok: "/img/iconsax-icon-(icx).png",
    yield: "/img/Group (2).png",
  };

  return (
    <img className="farmIcon" src={iconMap[type]} alt="" aria-hidden="true" />
  );
}

function FarmCard({ farm }) {
  const isBad = farm.status === "bad";

  return (
    <article className="farmCard">
      <img className="farmCard__img" src={farm.image} alt={farm.title} />

      <h3 className="farmCard__title" dir="rtl">
        {farm.title}
      </h3>

      <div className="farmCard__row">
        <Icon type="region" />
        <span className="farmCard__region">{farm.region}</span>
        <span
          className={`dot ${isBad ? "dot--danger" : "dot--ok"}`}
          aria-label={isBad ? "حالة غير جيدة" : "حالة جيدة"}
        />
      </div>

      <ul className="farmCard__list">
        <li className="farmCard__item">
          <Icon type="water" />
          <span>{farm.irrigation}</span>
        </li>
        <li className="farmCard__item">
          <Icon type="temp" />
          <span>{farm.temp}</span>
        </li>
        <li className="farmCard__item">
          <Icon type="ok" />
          <span>{farm.pests}</span>
        </li>
        <li className="farmCard__item">
          <Icon type="yield" />
          <span>{farm.yieldText}</span>
        </li>
      </ul>
    </article>
  );
}

export default function FarmsCards() {
  return (
    <section className="farmsSection">
      <h2 className="farmsTitle"> :من المزارع التي قمنا بالإشراف عليها</h2>

      {/* keep Arabic text inside cards, but layout cards left-to-right */}
      <div className="cardsViewport" dir="ltr">
        <div className="cardsScroll">
          {farms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      </div>
    </section>
  );
}
