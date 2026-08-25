import { useNavigate } from "react-router-dom";
import "./AuthPageLayout.css";

export default function AuthPageLayout({
  imagePosition = "left",
  children,
  cardRadius = "50px",
  cardWidth = "500px",
  cardHeight = "530px",
  showImage = true,
}) {
  const navigate = useNavigate();

  return (
    <div
      className="auth-page-layout"
      style={{
        minHeight: "150vh",
        backgroundColor: "#f5f5f5",
        overflowY: "auto",
      }}>
      {/* Top bar with logo and back button */}
      <div className="auth-layout-topbar">
        <div
          className="auth-layout-vector"
          onClick={() => navigate("/home")}
          title="العودة للصفحة الرئيسية">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">
            <path
              d="M25 10L15 20L25 30"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 20H31"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="auth-layout-logo">
          <img src="/img/logo.png" alt="logo" />
          <p className="auth-layout-logo-text">AgriSmart</p>
        </div>
      </div>

      {/* Content container */}
      <div
        className={`auth-layout-content auth-layout-content--${imagePosition}`}>
        {/* Image */}
        {showImage && imagePosition === "left" && (
          <div className="auth-layout-image">
            <img
              src="/img/Rectangle 16.png"
              alt="auth background"
              style={{
                height: "700px",
                width: "auto",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Card */}
        <div className="auth-layout-card-wrapper">
          <div
            className="auth-layout-shadow-box"
            style={{
              backgroundColor: "rgba(217, 217, 217, 0.2)",
              width: cardWidth === "500px" ? "550px" : "550px",
              height: cardHeight === "530px" ? "600px" : "600px",
              borderTopRightRadius:
                imagePosition === "left" ? "50px" : undefined,
              borderBottomRightRadius:
                imagePosition === "left" ? "50px" : undefined,
              borderTopLeftRadius:
                imagePosition === "right" ? "50px" : undefined,
              borderBottomLeftRadius:
                imagePosition === "right" ? "50px" : undefined,
            }}>
            <div
              dir="rtl"
              className="auth-layout-card"
              style={{
                width: cardWidth,
                height: cardHeight,
                borderRadius: cardRadius,
              }}>
              {children}
            </div>
          </div>
        </div>

        {/* Image right */}
        {showImage && imagePosition === "right" && (
          <div className="auth-layout-image">
            <img
              src="/img/Rectangle 16.png"
              alt="auth background"
              style={{
                height: "700px",
                width: "auto",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
