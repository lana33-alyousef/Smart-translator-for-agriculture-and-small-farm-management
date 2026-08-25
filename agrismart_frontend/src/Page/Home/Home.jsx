import { useState } from "react";
import Navbar from "../../Component/Navbar/Navbar";
import Hero from "../../Component/Hero/Hero";
import Footer from "../../Component/Footer/Footer";
import Second from "../../Component/Second/Second";
import Us from "../../Component/US/Us";
import FarmsCards from "../../Component/FarmsCards/FarmsCards";
import Statistics from "../../Component/Statistics/Statistics";

const Home = () => {
  const [isAuthenticated] = useState(
    () => localStorage.getItem("isAuthenticated") === "true"
  );

  return (
    <>
      {/* أخبرنا الناف بار هنا أنه موجود في الصفحة الرئيسية */}
      <Navbar isHome={true} />
      <Hero isAuthenticated={isAuthenticated} />
      <Second />
      <FarmsCards />
      <Statistics />
      <Us />
      <Footer />
    </>
  );
};

export default Home;