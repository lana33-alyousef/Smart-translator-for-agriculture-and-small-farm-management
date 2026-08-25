import "./Hero.css";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "../../auth/authStorage";

export default function Hero({ isAuthenticated }) {
  const navigate = useNavigate();

  // دالة تسجيل الخروج
  const handleLogout = () => {
    clearAuth();
    window.location.reload();  
  };

  return (
    <section className="hero" id="hero">
      <div className="hero-content">
        <div className="content-talk">
          <div>
            <h1>
              Smart Farming ....
              <br />
              Stronger Lives!!
            </h1>
            <p>plants make a positive impact on your environment</p>
          </div>
          
          
          <div className="buttons">
            {!isAuthenticated ? (
              <>
                <button className="btn1" onClick={() => navigate("/login")}>
                  تسجيل الدخول
                </button>
                <button className="btn1" onClick={() => navigate("/register")}>
                  إنشاء حساب
                </button>
              </>
            ) : (
              <button 
                className="btn1" 
                onClick={handleLogout}
               
              >
                تسجيل الخروج
              </button>
            )}
          </div>
        </div>
        
        <div className="content-img">
          <img
            className="ii"
            src="/img/28ec40e8f794ddb083e86c0327a6ad42f5094e7a.png"
            alt="رسم توضيحي للنباتات"
          />
        </div>
      </div>
    </section>
  );
}