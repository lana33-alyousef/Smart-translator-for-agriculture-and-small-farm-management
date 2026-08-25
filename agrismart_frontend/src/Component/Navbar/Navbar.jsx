import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearAuth } from "../../auth/authStorage";
import { HashLink } from 'react-router-hash-link';
// إضافة أيقونات احترافية ومناسبة لكل خدمة
import { 
  FiMail, FiLogOut, FiX, FiUser, FiSettings,
  FiDroplet, FiArchive, FiActivity, 
  FiPieChart, FiAlertTriangle, FiStar, FiBell
} from "react-icons/fi";
import { PiPlant } from "react-icons/pi";
import { useRef } from "react";
import { api } from "../../api/client";

import "./Navbar.css";
import logoImg from "../../img/logo.png";


export default function Navbar({ isHome }) {
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showBurger = true;
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef();

  
  // 2. مصفوفة تحتوي على كل روابط قسم الخدمات
  const servicesRoutes = [
    "/inventory",
    "/scheduler",
    "/soilmonitoring",
    "/reports",
    "/disease-alerts",
    "/plant-growth"
  ];

  
  const isServicesActive = servicesRoutes.includes(location.pathname);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    const onForbidden = (e) => {
      // clear local tokens and redirect to login
      try { clearAuth(); } catch (err) {}
      navigate('/login');
    };

    const onApiNotification = (e) => {
      const msg = e?.detail?.message || 'حدث خطأ من السيرفر';
      alert(msg);
    };

    window.addEventListener('api:forbidden', onForbidden);
    window.addEventListener('api:notification', onApiNotification);

    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener('api:forbidden', onForbidden);
      window.removeEventListener('api:notification', onApiNotification);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/api/notifications/');
        if (!mounted) return;
        // API returns array of notifications
        const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setNotifications(list);
      } catch (e) {
        // ignore if offline or unauthenticated
      }
    };

    load();
    const iv = setInterval(load, 120000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  // close notification dropdown when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const markAllRead = async () => {
    try {
      // Prefer server-side bulk endpoint, fallback to per-item if not available
      try {
        await api.post('/api/notifications/mark_all_read/');
      } catch (err) {
        await Promise.all(notifications.filter(n => !n.is_read).map(n => api.post(`/api/notifications/${n.id}/read/`).catch(()=>{})));
      }

      // refresh list
      const res = await api.get('/api/notifications/');
      const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setNotifications(list);
    } catch (e) {
      // ignore
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navClass = isHome && !scrolled ? "navbar-green-transparent" : "navbar-solid";
  
  return (
    <div>
      {!sidebarOpen && (
        <>
        <nav className={`navbar navbar-expand-lg fixed-top ${navClass}`}>
          <div className="container-fluid px-0">
            <img src={logoImg} alt="AgriSmart" />
            <Link className="navbar-brand" to="/">
              AgriSmart
            </Link>

            
<div className="nav-item mx-3 nav-notification" ref={notifRef}>
                  <button
                    className="nav-link notification-btn"
                    aria-label="الإشعارات"
                    onClick={() => setNotifOpen(!notifOpen)}>
                    <FiBell />
                    {unreadCount > 0 && (
                      <span className="notif-badge">{unreadCount}</span>
                    )}
                  </button>

                  <div className={`notification-dropdown ${notifOpen ? 'open' : ''}`}>
                    <div className="notification-header">
                      <span>الإشعارات</span>
                      <button className="notif-markall" onClick={markAllRead}>تحديد الكل كمقروء</button>
                    </div>
                    {notifications.length === 0 && (
                      <div className="notification-empty">لا توجد إشعارات جديدة</div>
                    )}
                    <ul>
                      {notifications.map((n) => (
                        <li key={n.id} className={`notification-item level-${n.level}`}>
                              <a href={n.link} onClick={async (e) => {
                                  e.preventDefault();
                                  try { await api.post(`/api/notifications/${n.id}/read/`); } catch(_) {}
                                  // update local state optimistically
                                  setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                                  setNotifOpen(false);
                                  window.location.href = n.link;
                                }}>
                                <strong>{n.title}</strong>
                                <div className="notification-body">{n.body}</div>
                                <small className="notification-time">{new Date(n.created_at || n.time).toLocaleString()}</small>
                              </a>
                        </li>
                      ))}
                    </ul>
                    <div className="notification-footer">
                      <Link to="/reports" onClick={() => setNotifOpen(false)} style={{ textDecoration: 'none' }}>
                        عرض التقارير
                      </Link>
                    </div>
                  </div>
                </div>
            <div className="collapse navbar-collapse" id="mainNavbar">



              <select 
    className="navbar-mobile-select" 
    value={location.pathname}
    onChange={(e) => { if(e.target.value) navigate(e.target.value); }}
  >
    <option value="" disabled>انتقل إلى...</option>
    <option value="/home">الرئيسية</option>
    <option value="/tips">نصائح وإرشادات</option>
    <option value="/about">حول</option>
    <option value="/inventory">إدارة المخزون</option>
    <option value="/scheduler">جدولة الري والتسميد</option>
    <option value="/reports">التقارير والسجلات</option>
    <option value="/disease-alerts">المختبر الذكي</option>
    <option value="/plant-growth">متابعة سجل نمو النباتات</option>
  </select>
              <ul className="navbar-nav ms-auto" dir="rtl">
                
                {showBurger && (
                  <li>
                    <button
                      className="burger-btn"
                      onClick={() => setSidebarOpen(true)}>
                      ☰
                    </button>
                  </li>
                )}
                <li className="nav-item mx-4">
                  <NavLink className="nav-link" to="/home">
                     الرئيسية
                  </NavLink>
                </li>
                <li className="nav-item mx-4">
                  <NavLink className="nav-link" to="/tips">
                    نصائح وإرشادات
                  </NavLink>
                </li>
                
                {/* القائمة المنسدلة للخدمات */}
                <li className="nav-item mx-4 custom-dropdown-container">
                  <div className={`nav-link dropdown-trigger ${isServicesActive ? 'active' : ''}`}>
                    الخدمات <span className="dropdown-arrow">▾</span>
                  </div>
                  <ul className="custom-dropdown-menu">
                    <li><Link to="/inventory">إدارة المخزون</Link></li>                    
                    <li><Link to="/scheduler">جدولة الري و التسميد</Link></li>
                    <li><Link to="/reports">التقارير و السجلات</Link></li>
                    <li><Link to="/disease-alerts">المختبر الذكي </Link></li>
                    <li><Link to="/plant-growth">متابعة سجل نمو النباتات</Link></li>
                  </ul>
                </li>

                <li className="nav-item mx-4">
                  <NavLink className="nav-link" to="/about">
                   حول
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        </>
      )}

      {sidebarOpen && (
        <>
          <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
          <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            
            <div className="sidebar__header">
              <button
                className="sidebar__closeBtn"
                onClick={() => setSidebarOpen(false)}
                aria-label="إغلاق القائمة">
                <FiX />
              </button>
              <div className="sidebar__userInfo">
                <div className="sidebar__avatar">
                  <FiUser />
                </div>
                <div className="sidebar__userDetails">
                  <span className="sidebar__welcome">مرحباً بك</span>
                </div>
              </div>
            </div>

            <div className="sidebar__content">
              <div className="sidebar__section">
              <Link className="sidebar__sectionLink" to="/profile" onClick={() => setSidebarOpen(false)}>
                <FiUser className="sidebar__icon" />
                <span>الملف الشخصي</span>
              </Link>
              <Link className="sidebar__sectionLink" to="/settings" onClick={() => setSidebarOpen(false)}>
                <FiSettings className="sidebar__icon" />
                <span>الإعدادات العامة</span>
              </Link>
              <Link className="sidebar__sectionLink" to="/subscriptions" onClick={() => setSidebarOpen(false)}>
                <FiStar className="sidebar__icon" />
                <span>باقات الاشتراك</span>
              </Link>
              </div>

              <div className="sidebar__section sidebar__section--services">
                <div className="sidebar__servicesHeader">
                  <h3 className="sidebar__sectionTitle">خدماتنا</h3>
                </div>
                <ul className="sidebar__servicesList">
                    <li>
                    <Link className="sidebar__servicesLink" to="/inventory" onClick={() => setSidebarOpen(false)}>
                      <FiArchive className="service-icon" />
                     إدارة المخزون
                    </Link>
                  </li>
                  <li>
                    <Link className="sidebar__servicesLink" to="/scheduler" onClick={() => setSidebarOpen(false)}>
                      <FiDroplet className="service-icon" />
                     جدولة الري و التسميد
                    </Link>
                  </li>
                  <li>
                    <Link className="sidebar__servicesLink" to="/reports" onClick={() => setSidebarOpen(false)}>
                      <FiPieChart className="service-icon" />
                   التقارير و السجلات
                    </Link>
                  </li>
                  <li>
                    <Link className="sidebar__servicesLink" to="/disease-alerts" onClick={() => setSidebarOpen(false)}>
                      <FiAlertTriangle className="service-icon" />
                   المحتبر الذكي
                    </Link>
                  </li>
                  <li>
                    <Link className="sidebar__servicesLink" to="/plant-growth" onClick={() => setSidebarOpen(false)}>
                      <PiPlant className="service-icon" />
                    متابعة سجل نمو النباتات
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="sidebar__footer">
              <HashLink className="sidebar__sectionLink" smooth to="/about#contact" onClick={() => setSidebarOpen(false)}>
                <FiMail className="sidebar__icon" />
                <span>تواصل معنا</span>
              </HashLink>
              <Link 
  className="sidebar__sectionLink sidebar__sectionLink--logout" 
  to="/" 
  onClick={() => {
    // 1. مسح بيانات الدخول (التوكن)
    clearAuth();
    
    // 2. إغلاق القائمة الجانبية
    setSidebarOpen(false);
  }}
>
  <FiLogOut className="sidebar__icon" />
  <span className="logout">تسجيل الخروج</span>
</Link>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

























// import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
// import { useEffect, useState, useRef } from "react";
// import { clearAuth } from "../../auth/authStorage";
// import { HashLink } from 'react-router-hash-link';
// import { 
//   FiMail, FiLogOut, FiX, FiUser, FiSettings,
//   FiDroplet, FiArchive, FiActivity, 
//   FiPieChart, FiAlertTriangle, FiStar, FiBell
// } from "react-icons/fi";
// import { PiPlant } from "react-icons/pi";
// import { api } from "../../api/client";

// import "./Navbar.css";
// import logoImg from "../../img/logo.png";

// export default function Navbar({ isHome }) {
//   const [scrolled, setScrolled] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const showBurger = true;
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [notifications, setNotifications] = useState([]);
//   const [notifOpen, setNotifOpen] = useState(false);
//   const notifRef = useRef();

//   const servicesRoutes = [
//     "/inventory",
//     "/scheduler",
//     "/soilmonitoring",
//     "/reports",
//     "/disease-alerts",
//     "/plant-growth"
//   ];

//   const isServicesActive = servicesRoutes.includes(location.pathname);

//   useEffect(() => {
//     const onScroll = () => { setScrolled(window.scrollY > 80); };
//     const onForbidden = () => {
//       try { clearAuth(); } catch (err) {}
//       navigate('/login');
//     };
//     const onApiNotification = (e) => {
//       const msg = e?.detail?.message || 'حدث خطأ من السيرفر';
//       alert(msg);
//     };

//     window.addEventListener('api:forbidden', onForbidden);
//     window.addEventListener('api:notification', onApiNotification);
//     window.addEventListener("scroll", onScroll);
//     return () => {
//       window.removeEventListener("scroll", onScroll);
//       window.removeEventListener('api:forbidden', onForbidden);
//       window.removeEventListener('api:notification', onApiNotification);
//     };
//   }, [navigate]);

//   useEffect(() => {
//     let mounted = true;
//     const load = async () => {
//       try {
//         const res = await api.get('/api/notifications/');
//         if (!mounted) return;
//         const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
//         setNotifications(list);
//       } catch (e) {}
//     };

//     load();
//     const iv = setInterval(load, 120000);
//     return () => { mounted = false; clearInterval(iv); };
//   }, []);

//   useEffect(() => {
//     const onDoc = (e) => {
//       if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
//     };
//     document.addEventListener('click', onDoc);
//     return () => document.removeEventListener('click', onDoc);
//   }, []);

//   const markAllRead = async () => {
//     try {
//       await Promise.all(notifications.map(n => api.post(`/api/notifications/${n.id}/read/`).catch(()=>{})));
//       const res = await api.get('/api/notifications/');
//       const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
//       setNotifications(list);
//     } catch (e) {}
//   };

//   // دالة للتحكم بقائمة الاختيار (Select) الخاصة بالموبايل عند تغيير القيمة
//   const handleMobileNavChange = (e) => {
//     const val = e.target.value;
//     if (val) navigate(val);
//   };

//   const navClass = isHome && !scrolled ? "navbar-green-transparent" : "navbar-solid";
  
//   return (
//     <div>
//       {!sidebarOpen && (
//         <nav className={`navbar fixed-top ${navClass}`}>
//           <div className="navbar-container">
            
//             {/* جهة اليمين: اللوجو والاسم */}
//             <div className="navbar-brand-wrapper">
//               <img src={logoImg} alt="AgriSmart" className="navbar-logo" />
//               <Link className="navbar-brand" to="/">AgriSmart</Link>
//             </div>

//             {/* الوسط (للشاشات الكبيرة فقط): الروابط العادية */}
//             <div className="navbar-desktop-links">
//               <ul className="navbar-nav-links">
//                 <li className="nav-item">
//                   <NavLink className="nav-link" to="/home">الرئيسية</NavLink>
//                 </li>
//                 <li className="nav-item">
//                   <NavLink className="nav-link" to="/tips">نصائح وإرشادات</NavLink>
//                 </li>
//                 <li className="nav-item custom-dropdown-container">
//                   <div className={`nav-link dropdown-trigger ${isServicesActive ? 'active' : ''}`}>
//                     الخدمات <span className="dropdown-arrow">▾</span>
//                   </div>
//                   <ul className="custom-dropdown-menu">
//                     <li><Link to="/inventory">إدارة المخزون</Link></li>                    
//                     <li><Link to="/scheduler">جدولة الري و التسميد</Link></li>
//                     <li><Link to="/reports">التقارير و السجلات</Link></li>
//                     <li><Link to="/disease-alerts">المختبر الذكي </Link></li>
//                     <li><Link to="/plant-growth">متابعة سجل نمو النباتات</Link></li>
//                   </ul>
//                 </li>
//                 <li className="nav-item">
//                   <NavLink className="nav-link" to="/about">حول</NavLink>
//                 </li>
//               </ul>
//             </div>

//             {/* الوسط (للموبايل فقط): قائمة الاختيار (Select Menu) البديلة لعرض العناوين */}
//             <div className="navbar-mobile-select-wrapper">
//               <select 
//                 className="navbar-mobile-select" 
//                 value={servicesRoutes.includes(location.pathname) ? location.pathname : location.pathname}
//                 onChange={handleMobileNavChange}
//               >
//                 <option value="" disabled>انتقل إلى...</option>
//                 <option value="/home">الرئيسية</option>
//                 <option value="/tips">نصائح وإرشادات</option>
//                 <option value="/about">حول</option>
//                 <optgroup label="خدماتنا">
//                   <option value="/inventory">إدارة المخزون</option>
//                   <option value="/scheduler">جدولة الري والتسميد</option>
//                   <option value="/reports">التقارير والسجلات</option>
//                   <option value="/disease-alerts">المختبر الذكي</option>
//                   <option value="/plant-growth">متابعة سجل نمو النباتات</option>
//                 </optgroup>
//               </select>
//             </div>

//             {/* جهة اليسار: الإشعارات وزر البرجر */}
//             <div className="navbar-actions-wrapper">
              
//               {/* مربع الإشعارات المهم */}
//               <div className="nav-notification" ref={notifRef}>
//                 <button
//                   className="notification-btn"
//                   aria-label="الإشعارات"
//                   onClick={() => setNotifOpen(!notifOpen)}
//                 >
//                   <FiBell />
//                   {notifications.filter(n=>n).length > 0 && (
//                     <span className="notif-badge">{notifications.length}</span>
//                   )}
//                 </button>

//                 <div className={`notification-dropdown ${notifOpen ? 'open' : ''}`}>
//                   <div className="notification-header">
//                     <span>الإشعارات</span>
//                     <button className="notif-markall" onClick={markAllRead}>تحديد الكل كمقروء</button>
//                   </div>
//                   {notifications.length === 0 && (
//                     <div className="notification-empty">لا توجد إشعارات جديدة</div>
//                   )}
//                   <ul>
//                     {notifications.map((n) => (
//                       <li key={n.id} className={`notification-item level-${n.level}`}>
//                         <a href={n.link} onClick={async (e) => {
//                           e.preventDefault();
//                           try { await api.post(`/api/notifications/${n.id}/read/`); } catch(_) {}
//                           setNotifOpen(false);
//                           window.location.href = n.link;
//                         }}>
//                           <strong>{n.title}</strong>
//                           <div className="notification-body">{n.body}</div>
//                           <small className="notification-time">{new Date(n.created_at || n.time).toLocaleString()}</small>
//                         </a>
//                       </li>
//                     ))}
//                   </ul>
//                   <div className="notification-footer">
//                     <Link to="/reports" onClick={() => setNotifOpen(false)} style={{ textDecoration: 'none' }}>
//                       عرض التقارير
//                     </Link>
//                   </div>
//                 </div>
//               </div>

//               {/* زر البرجر (☰) */}
//               {showBurger && (
//                 <button className="burger-btn" onClick={() => setSidebarOpen(true)}>
//                   ☰
//                 </button>
//               )}

//             </div>

//           </div>
//         </nav>
//       )}

//       {/* السايد بار الافترافي (بدون تعديل برميجي) */}
//       {sidebarOpen && (
//         <>
//           <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
//           <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
//             <div className="sidebar__header">
//               <button className="sidebar__closeBtn" onClick={() => setSidebarOpen(false)} aria-label="إغلاق القائمة">
//                 <FiX />
//               </button>
//               <div className="sidebar__userInfo">
//                 <div className="sidebar__avatar"><FiUser /></div>
//                 <div className="sidebar__userDetails">
//                   <span className="sidebar__welcome">مرحباً بك</span>
//                 </div>
//               </div>
//             </div>

//             <div className="sidebar__content">
//               <div className="sidebar__section">
//                 <Link className="sidebar__sectionLink" to="/profile" onClick={() => setSidebarOpen(false)}>
//                   <FiUser className="sidebar__icon" />
//                   <span>الملف الشخصي</span>
//                 </Link>
//                 <Link className="sidebar__sectionLink" to="/settings" onClick={() => setSidebarOpen(false)}>
//                   <FiSettings className="sidebar__icon" />
//                   <span>الإعدادات العامة</span>
//                 </Link>
//                 <Link className="sidebar__sectionLink" to="/subscriptions" onClick={() => setSidebarOpen(false)}>
//                   <FiStar className="sidebar__icon" />
//                   <span>باقات الاشتراك</span>
//                 </Link>
//               </div>

//               <div className="sidebar__section sidebar__section--services">
//                 <div className="sidebar__servicesHeader">
//                   <h3 className="sidebar__sectionTitle">خدماتنا</h3>
//                 </div>
//                 <ul className="sidebar__servicesList">
//                   <li>
//                     <Link className="sidebar__servicesLink" to="/inventory" onClick={() => setSidebarOpen(false)}>
//                       <FiArchive className="service-icon" /> إدارة المخزون
//                     </Link>
//                   </li>
//                   <li>
//                     <Link className="sidebar__servicesLink" to="/scheduler" onClick={() => setSidebarOpen(false)}>
//                       <FiDroplet className="service-icon" /> جدولة الري و التسميد
//                     </Link>
//                   </li>
//                   <li>
//                     <Link className="sidebar__servicesLink" to="/reports" onClick={() => setSidebarOpen(false)}>
//                       <FiPieChart className="service-icon" /> التقارير و السجلات
//                     </Link>
//                   </li>
//                   <li>
//                     <Link className="sidebar__servicesLink" to="/disease-alerts" onClick={() => setSidebarOpen(false)}>
//                       <FiAlertTriangle className="service-icon" /> المحتبر الذكي
//                     </Link>
//                   </li>
//                   <li>
//                     <Link className="sidebar__servicesLink" to="/plant-growth" onClick={() => setSidebarOpen(false)}>
//                       <PiPlant className="service-icon" /> متابعة سجل نمو النباتات
//                     </Link>
//                   </li>
//                 </ul>
//               </div>
//             </div>

//             <div className="sidebar__footer">
//               <HashLink className="sidebar__sectionLink" smooth to="/about#contact" onClick={() => setSidebarOpen(false)}>
//                 <FiMail className="sidebar__icon" /> <span>تواصل معنا</span>
//               </HashLink>
//               <Link className="sidebar__sectionLink sidebar__sectionLink--logout" to="/" onClick={() => { clearAuth(); setSidebarOpen(false); }}>
//                 <FiLogOut className="sidebar__icon" /> <span className="logout">تسجيل الخروج</span>
//               </Link>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }