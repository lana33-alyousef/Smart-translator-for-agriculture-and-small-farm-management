import { useState, useEffect } from "react";
import { api } from "../../api/client";
import heroPerson from "../../img/paper.png";
import Navbar from "../../Component/Navbar/Navbar";
import leaf from "../../img/Green-leaf.png";
import "./Farmmanagement.css";

// ==========================================
// 1. مكون واجهة الترحيب
// ==========================================
const InventoryHero = ({ title, subtitle, description, heroImage }) => {
  return (
    <section className="modern-hero-section">
      <div className="hero-text-content">
        <h1 className="hero-main-title">{title}</h1>
        <h2 className="hero-subtitle">{subtitle}</h2>
        <p className="hero-description">{description}</p>
      </div>
      <div className="hero-image-content">
        {heroImage && <img src={heroImage} alt="عامل مزرعة" className="hero-floating-img" />}
      </div>
    </section>
  );
};

// ==========================================
// 2. مكون الجداول
// ==========================================
const InventoryTableCard = ({ title, headers = [], rows = [], isLoading, onEdit, onDelete }) => {
  return (
    <div className="modern-table-card">
      <h3 className="table-title">{title}</h3>
      <div className="table-responsive-wrap">
        {isLoading ? (
          <div className="table-loading-state">
            <span className="loader-spinner"></span>
            <p>جاري تحميل بيانات المخزون...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="table-empty-state">لا توجد بيانات لعرضها</div>
        ) : (
          <table className="modern-data-table">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isAvailable = Number(row.quantity) > 0;
                return (
                  <tr key={row.id}>
                    <td className="type-cell">{row.typeof}</td>
                    <td className="qty-cell">{row.quantity} {row.unit || ''}</td>
                    <td className="price-cell">{row.price ? `${row.price}` : '0'}</td>
                    <td>
                      <span className={`status-pill status-${isAvailable ? 'good' : 'danger'}`}>
                        {isAvailable ? 'متوفر' : 'غير متوفر'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {onEdit && (
                        <button className="table-action-btn edit" onClick={() => onEdit(row)}>تعديل</button>
                      )}
                      {onDelete && (
                        <button className="table-action-btn delete" onClick={() => onDelete(row.id)}>حذف</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. مكون العدادات (Gauges)
// ==========================================
const InventoryGauge = ({ title, percentage, color, totalQty }) => {
  const needleRotation = (percentage / 100) * 180 - 90;
  const fillAngle = `${(percentage / 100) * 180}deg`;

  return (
    <div className="gauge-card">
      <h3 className="gauge-title">{title}</h3>
      <div className="gauge-container">
        <div className="gauge-semi-circle-clip">
          <div
            className="modern-gauge-arc"
            style={{
              "--fill-color": color,
              "--fill-angle": fillAngle,
            }}
          ></div>
          <div className="gauge-inner-cutout"></div>
        </div>

        <div
          className="gauge-needle"
          style={{ transform: `rotate(${needleRotation}deg)` }}
        >
          <div className="needle-head"></div>
          <div className="needle-base"></div>
        </div>

        <div className="gauge-value" style={{ color: color }}>
          {Math.round(percentage)}%
        </div>
      </div>
      {/* عرض الكمية الإجمالية أسفل المؤشر */}
      <div className="gauge-qty-text">
        الكمية الإجمالية: {totalQty}
      </div>
    </div>
  );
};

// ==========================================
// المكون الأساسي للصفحة
// ==========================================
const Farmmanagement = () => {
  // إضافة عمود السعر للعناوين
  const tableHeaders = ["أنواع الأسمدة الموجودة", "الكمية الحالية", "السعر", "حالة المخزون"];
  const tableHeaders2 = ["أنواع المبيدات الحشرية", "الكمية الحالية", "السعر", "حالة المخزون"];

  const [fertilizers, setFertilizers] = useState([]);
  const [pesticides, setPesticides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [farms, setFarms] = useState([]);
  const [activeFarmId, setActiveFarmId] = useState(localStorage.getItem("activeFarmId") || "");
  const [actionType, setActionType] = useState("withdraw");
  const [requestType, setRequestType] = useState("fertilizer");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("كيس");
  const [price, setPrice] = useState(""); // حالة السعر الجديدة
  const [reason, setReason] = useState("استخدام في المزرعة");
  
  const [editingInventory, setEditingInventory] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", quantity: "", unit: "", category: "", price: "" });
  
  const [newItemName, setNewItemName] = useState("");
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4500);
  };

  // جلب المزارع عند تحميل الصفحة
    useEffect(() => {
      const fetchFarms = async () => {
        try {
          const res = await api.get("/api/farms/");
          
          // ✨ التعديل هنا: استخراج المصفوفة حتى لو كانت بداخل results أو data
          const farmList = Array.isArray(res.data) 
            ? res.data 
            : (res.data.results || res.data.data || Object.values(res.data).find(Array.isArray) || []);
            
          setFarms(farmList);
          
          // إذا لم يكن هناك مزرعة محددة مسبقاً، اختر الأولى كافتراضية
          if (!activeFarmId && farmList.length > 0) {
            const firstFarmId = farmList[0].id.toString();
            setActiveFarmId(firstFarmId);
            localStorage.setItem("activeFarmId", firstFarmId);
          }
        } catch (error) {
          console.error("خطأ في جلب المزارع:", error);
        }
      };
      fetchFarms();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchInventoryData = async () => {
      setIsLoading(true);
      try {
        const activeFarmId = localStorage.getItem("activeFarmId");
        let url = "/api/inventory/";
        if (activeFarmId) {
          url += `?farm=${activeFarmId}`;
        }

        const res = await api.get(url);
        const items = Array.isArray(res.data) ? res.data : [];
        const fertilizersData = [];
        const pesticidesData = [];

        items.forEach((it) => {
          const category = (it.category || "").toLowerCase();
          const thresholdVal = Number(it.threshold) || 100;
          let percentage = 0;
          try {
            const qty = Number(it.quantity) || 0;
            if (thresholdVal > 0) percentage = Math.min(100, Math.round((qty / thresholdVal) * 100));
          } catch (e) {}

          const mapped = {
            id: it.id,
            name: it.name,
            quantity: it.quantity,
            typeof: it.name,
            percentage,
            category: it.category,
            unit: it.unit || "كيس",
            price: it.price || 0, // ربط السعر
            threshold: thresholdVal
          };

          if (category.includes("fert") || category.includes("سماد") || category.includes("fertilizer")) {
            fertilizersData.push(mapped);
          } else if (category.includes("pest") || category.includes("مبيد") || category.includes("pesticide")) {
            pesticidesData.push(mapped);
          } else {
            fertilizersData.push(mapped);
          }
        });

        setFertilizers(fertilizersData);
        setPesticides(pesticidesData);
      } catch (error) {
        console.error("خطأ في جلب بيانات المخزون", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryData();
  }, [activeFarmId]);

  // حساب النسبة المئوية
  const calculateOverallPercentage = (items) => {
    if (!items || items.length === 0) return 0;
    let totalQty = 0;
    let totalThreshold = 0;
    items.forEach(item => {
      totalQty += Number(item.quantity) || 0;
      totalThreshold += Number(item.threshold) || 100;
    });
    if (totalThreshold === 0) return 0;
    return Math.min(100, (totalQty / totalThreshold) * 100);
  };

  // حساب الكمية الإجمالية
  const calculateTotalQuantity = (items) => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  // حساب التكلفة الكلية (السعر × الكمية)
  const calculateTotalCost = () => {
    const allItems = [...fertilizers, ...pesticides];
    return allItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  };

  const avgFertilizer = calculateOverallPercentage(fertilizers);
  const avgPesticide = calculateOverallPercentage(pesticides);
  const totalFertilizerQty = calculateTotalQuantity(fertilizers);
  const totalPesticideQty = calculateTotalQuantity(pesticides);
  const totalCost = calculateTotalCost();

  const getColorByPercentage = (percent) => {
    if (percent >= 50) return "#207C3A";
    if (percent >= 20) return "#f59e0b";
    return "#ef4444";
  };

  const dropdownOptions = requestType === "fertilizer" ? fertilizers : pesticides;

  const handleWithdraw = async () => {
    if (!selectedItemId) {
      alert("اختر الصنف المطلوب أولاً");
      return;
    }

    const itemToWithdraw = dropdownOptions.find(item => String(item.id) === String(selectedItemId));
    if (!itemToWithdraw) return;

    const qtyToWithdraw = Number(quantity);
    const currentQty = Number(itemToWithdraw.quantity);

    if (qtyToWithdraw > currentQty) {
      addNotification("الكمية المضافة للسحب أكبر من المتوفر في المخزون", "error");
      return;
    }

    const newQuantity = currentQty - qtyToWithdraw;

    try {
      const payload = {
        name: itemToWithdraw.name,
        quantity: newQuantity,
        unit: itemToWithdraw.unit || unit,
        price: itemToWithdraw.price, // المحافظة على السعر
        category: itemToWithdraw.category || (requestType === "fertilizer" ? "fertilizer" : "pesticide")
      };

      const res = await api.put(`/api/inventory/${selectedItemId}/`, payload);
      const updated = res.data;

      const thresholdVal = Number(updated.threshold || itemToWithdraw.threshold) || 100;
      let newPercentage = 0;
      try {
        const qty = Number(updated.quantity) || 0;
        if (thresholdVal > 0) newPercentage = Math.min(100, Math.round((qty / thresholdVal) * 100));
      } catch (e) {}

      const mapped = {
        id: updated.id,
        name: updated.name,
        quantity: updated.quantity,
        typeof: updated.name,
        percentage: newPercentage,
        category: updated.category,
        unit: updated.unit || payload.unit,
        price: updated.price || payload.price,
        threshold: thresholdVal
      };

      if (requestType === "fertilizer") {
        setFertilizers(prev => prev.map(p => p.id === mapped.id ? mapped : p));
      } else {
        setPesticides(prev => prev.map(p => p.id === mapped.id ? mapped : p));
      }

      await api.post("/api/reports/", {
        title: `سحب مواد: ${itemToWithdraw.name}`,
        report_type: "inventory_withdrawal",
        content: {
          requestType,
          item: itemToWithdraw.name,
          quantity: qtyToWithdraw,
          unit: itemToWithdraw.unit || unit,
          reason,
        },
      }).catch(err => console.log("تخطي خطأ التقارير", err));

      window.dispatchEvent(new CustomEvent('inventory:changed', { detail: { action: 'update', item: updated } }));
      
      addNotification("تم سحب الكمية من المخزون بنجاح", "success");
      setSelectedItemId(""); 
      setQuantity("1");
    } catch (e) {
      console.error(e);
      addNotification("فشل سحب الكمية من المخزون", "error");
    }
  };

  const handleFarmChange = (e) => {
    const selectedFarmId = e.target.value;
    setActiveFarmId(selectedFarmId);
    localStorage.setItem("activeFarmId", selectedFarmId); // تحديث التخزين المحلي
  };

  const handleAddNewItem = async () => {
    const name = newItemName;
    if (!name) {
      addNotification("أدخل اسم الصنف قبل الإضافة", "warning");
      return;
    }
    try {
      const activeFarmId = localStorage.getItem("activeFarmId"); // جلب المعرف

      const res = await api.post("/api/inventory/", {
        name,
        quantity: Number(quantity) || 0,
        unit,
        price: Number(price) || 0, 
        category: requestType === "fertilizer" ? "fertilizer" : "pesticide",
        farm: activeFarmId || null // ربط العنصر الجديد بالمزرعة المحددة
      });
      const newItem = res.data;
      const thresholdVal = Number(newItem.threshold) || 100;
      const mapped = { 
        id: newItem.id, 
        name: newItem.name, 
        quantity: newItem.quantity, 
        typeof: newItem.name, 
        percentage: Math.min(100, Math.round(((Number(newItem.quantity) || 0) / thresholdVal) * 100)), 
        category: newItem.category,
        unit: newItem.unit || unit,
        price: newItem.price || Number(price), // تحديث السعر
        threshold: thresholdVal
      };
      
      if ((newItem.category || '').toLowerCase().includes('pest') || (newItem.category || '').includes('مبيد')) {
        setPesticides((prev) => [mapped, ...prev]);
      } else {
        setFertilizers((prev) => [mapped, ...prev]);
      }
      window.dispatchEvent(new CustomEvent('inventory:changed', { detail: { action: 'create', item: newItem } }));
      setNewItemName("");
      setPrice(""); // تفريغ حقل السعر
      addNotification("تم إضافة الصنف للمخزون", "success");
    } catch (e) {
      console.error(e);
      addNotification("فشل إضافة الصنف", "error");
    }
  };

  const openEditInventory = (item) => {
    setEditingInventory(item);
    setEditForm({ 
      name: item.name, 
      quantity: item.quantity, 
      unit: item.unit || "كيس", 
      price: item.price || 0,
      category: item.category || (requestType === 'fertilizer' ? 'fertilizer' : 'pesticide') 
    });
  };

  const saveEditInventory = async () => {
    if (!editingInventory) return;
    try {
      const payload = { 
        name: editForm.name, 
        quantity: editForm.quantity, 
        unit: editForm.unit, 
        price: editForm.price, // إرسال السعر المعدل
        category: editForm.category 
      };
      const res = await api.put(`/api/inventory/${editingInventory.id}/`, payload);
      const updated = res.data;
      const thresholdVal = Number(updated.threshold) || 100;
      const mapped = { 
        id: updated.id, 
        name: updated.name, 
        quantity: updated.quantity, 
        typeof: updated.name, 
        percentage: Math.min(100, Math.round(((Number(updated.quantity) || 0) / thresholdVal) * 100)), 
        category: updated.category,
        unit: updated.unit || editForm.unit, 
        price: updated.price || editForm.price,
        threshold: thresholdVal
      };
      
      setFertilizers((prev) => prev.map((p) => (p.id === mapped.id ? mapped : p)));
      setPesticides((prev) => prev.map((p) => (p.id === mapped.id ? mapped : p)));
      
      window.dispatchEvent(new CustomEvent('inventory:changed', { detail: { action: 'update', item: updated } }));
      setEditingInventory(null);
      setEditForm({ name: "", quantity: "", unit: "", price: "", category: "" });
      addNotification('تم حفظ التعديلات بنجاح', 'success');
    } catch (e) {
      console.error(e);
      addNotification('فشل حفظ التعديلات', 'error');
    }
  };

  const cancelEditInventory = () => {
    setEditingInventory(null);
    setEditForm({ name: "", quantity: "", unit: "", price: "", category: "" });
  };

  const handleDeleteInventory = async (id) => {
    if (!confirm('هل تريد حذف هذا الصنف نهائياً؟')) return;
    try {
      await api.delete(`/api/inventory/${id}/`);
      setFertilizers((prev) => prev.filter((p) => p.id !== id));
      setPesticides((prev) => prev.filter((p) => p.id !== id));
      window.dispatchEvent(new CustomEvent('inventory:changed', { detail: { action: 'delete', id } }));
      addNotification('تم حذف الصنف', 'success');
    } catch (e) {
      console.error(e);
      addNotification('فشل حذف الصنف', 'error');
    }
  };

  return (
    <div className="inventory-page-wrapper">
      {/* ===== واجهة تبديل المزارع ===== */}
      <div className="farm-switcher-wrapper dark-theme-fix" dir="rtl">
        <label htmlFor="farm-select dark-theme-fix" className="farm-switcher-label">
          📍 المزرعة الحالية:
        </label>
        <div className="farm-select-container dark-theme-fix">
          <select 
            id="farm-select"
            value={activeFarmId} 
            onChange={handleFarmChange}
            className="farm-switcher-select dark-theme-fix"
          >
            {farms.length === 0 ? (
              <option value="">لا توجد مزارع مسجلة</option>
            ) : (
              farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name || farm.farm_name || `مزرعة ${farm.id}`} 
                </option>
              ))
            )}
          </select>
        </div>
      </div>
      {/* =============================== */}
      <Navbar/>
      
      {/* ================= النافذة المنبثقة للتعديل ================= */}
      {editingInventory && (
        
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="smart-form-glass-card" style={{ 
            maxWidth: '500px', 
            width: '90%', 
            padding: '30px', 
            margin: '0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div className="inventory-edit-panel" dir="rtl">
              <h3 style={{ textAlign: 'center', marginBottom: '25px', color: '#207C3A', fontSize: '1.4rem' }}>
                تعديل بيانات: {editingInventory.name}
              </h3>
              <div className="custom-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-input-group full-span">
                  <label className="input-label-text">اسم الصنف</label>
                  <input 
                    type="text"
                    className="modern-text-input" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                  />
                </div>
                <div className="form-input-group full-span">
                  <label className="input-label-text">الكمية الحالية</label>
                  <input 
                    type="number" 
                    className="modern-text-input" 
                    value={editForm.quantity} 
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} 
                  />
                </div>
                <div className="form-input-group full-span">
                  <label className="input-label-text">السعر</label>
                  <input 
                    type="number" 
                    className="modern-text-input" 
                    value={editForm.price} 
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} 
                  />
                </div>
                <div className="form-input-group full-span">
                  <label className="input-label-text">وحدة القياس</label>
                  <div className="select-dropdown-wrapper">
                    <select 
                      className="modern-dropdown-select" 
                      value={editForm.unit} 
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    >
                      <option value="كيس">كيس</option>
                      <option value="لتر">لتر</option>
                      <option value="كغ">كيلو غرام (كغ)</option>
                      <option value="عبوة">عبوة</option>
                      <option value="طن">طن</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-footer-actions" style={{ justifyContent: 'center', marginTop: '30px', gap: '15px', display: 'flex' }}>
                <button className="btn-primary-save" onClick={saveEditInventory} style={{ flex: 1 }}>حفظ التعديلات</button>
                <button className="btn-secondary-edit" onClick={cancelEditInventory} style={{ flex: 1, background: '#f87171', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء الأمر</button>
              </div>
            </div>
          </div>
        </div>
      )}
      

      <div className="notifications-root">
        {notifications.map(n => (
          <div key={n.id} className={`notif ${n.type}`}>{n.message}</div>
        ))}
      </div>

      <main className="inventory-content-area">
        <section className="inventory-dashboard-shell" dir="rtl">
          
          <InventoryHero
            title="إدارة المخزون"
            subtitle="الإدارة الذكية تبدأ من المخزون المحسوب"
            description="هنا يمكنك متابعة الأسمدة و المبيدات الحشرية التي قد تحتاجها لنضمن ألا ينقصك شيء وقت العمل"
            heroImage={heroPerson}
          />

          <div className="inventory-grids-layout">
            <div className="scrollable-table-box">
              <InventoryTableCard
                title="قائمة مخزون الأسمدة"
                headers={tableHeaders}
                rows={fertilizers}
                onEdit={openEditInventory}
                onDelete={handleDeleteInventory}
                isLoading={isLoading}
              />
            </div>

            <div className="scrollable-table-box">
              <InventoryTableCard
                title="قائمة مخزون المبيدات الحشرية"
                headers={tableHeaders2}
                rows={pesticides}
                onEdit={openEditInventory}
                onDelete={handleDeleteInventory}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* ================= قسم العدادات والتكلفة ================= */}
          <section className="inventory-gauges-section">
            {!isLoading && (
              <div className="gauges-flex-container">
                <InventoryGauge
                  title="مستوى الأسمدة"
                  percentage={avgFertilizer}
                  color={getColorByPercentage(avgFertilizer)}
                  totalQty={totalFertilizerQty}
                />

                <InventoryGauge
                  title="مستوى المبيدات"
                  percentage={avgPesticide}
                  color={getColorByPercentage(avgPesticide)}
                  totalQty={totalPesticideQty}
                />
                 {/* بطاقة التكلفة الإجمالية الجديدة */}
                <div className="total-cost-card">
                  <h3 className="total-cost-title">التكلفة الإجمالية للمخزون</h3>
                  <div className="total-cost-value">
                    {totalCost.toLocaleString()} <span className="total-cost-currency">ل.س</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ================= النموذج الذكي ================= */}
          <section className="smart-form-section">
             <div className="smart-form-glass-card">
              <img src={leaf} alt="decoration" className="leaf-decor leaf-top-right" />
              <img src={leaf} alt="decoration" className="leaf-decor leaf-bottom-left" />
              
              <div className="form-header-center">
                <h2>إدارة وتحديث المواد</h2>
                <p>اختر نوع الإجراء المطلوب وقم بتحديد التفاصيل بنقرات بسيطة</p>
              </div>

              <div className="action-tabs-switcher">
                <button 
                  className={`action-tab-btn ${actionType === 'withdraw' ? 'active' : ''}`}
                  onClick={() => { setActionType('withdraw'); setSelectedItemId(''); }}
                >
                  📥 سحب من المخزون
                </button>
                <button 
                  className={`action-tab-btn ${actionType === 'add' ? 'active' : ''}`}
                  onClick={() => { setActionType('add'); setNewItemName(''); setPrice(''); }}
                >
                  ➕ إضافة صنف جديد للمخزون
                </button>
              </div>

              <div className="custom-form-grid">
                
                <div className="form-input-group full-span">
                  <label className="input-label-text">نوع المادة المطلوبة:</label>
                  <div className="radio-button-group">
                    <label className={`radio-btn-box ${requestType === 'fertilizer' ? 'selected' : ''}`}>
                      <input 
                        type="radio" name="type" value="fertilizer" 
                        checked={requestType === 'fertilizer'} 
                        onChange={(e) => { setRequestType(e.target.value); if(actionType === 'withdraw') setSelectedItemId(""); }} 
                        hidden 
                      />
                      🌱 أسمدة زراعية
                    </label>
                    <label className={`radio-btn-box ${requestType === 'pesticide' ? 'selected' : ''}`}>
                      <input 
                        type="radio" name="type" value="pesticide" 
                        checked={requestType === 'pesticide'} 
                        onChange={(e) => { setRequestType(e.target.value); if(actionType === 'withdraw') setSelectedItemId(""); }} 
                        hidden 
                      />
                      🧪 مبيدات حشرية
                    </label>
                  </div>
                </div>

                <div className="form-input-group">
                  <label className="input-label-text">اختر الصنف:</label>
                  <div className="select-dropdown-wrapper">
                    {actionType === 'withdraw' ? (
                      <select 
                        className="modern-dropdown-select" 
                        value={selectedItemId} 
                        onChange={(e) => setSelectedItemId(e.target.value)}
                      >
                        <option value="" disabled> اختر الصنف المطلوب</option>
                        {dropdownOptions.map(item => (
                          <option key={item.id} value={item.id}>{item.typeof}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                          type="text" 
                          className="modern-text-input" 
                          placeholder="أدخل اسم الصنف الجديد" 
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                        />
                    )}
                  </div>
                </div>

                {actionType === 'withdraw' ? (
                  <div className="form-input-group">
                    <label className="input-label-text">سبب الإجراء:</label>
                    <div className="select-dropdown-wrapper">
                      <select className="modern-dropdown-select" value={reason} onChange={(e) => setReason(e.target.value)}>
                        <option value="استخدام في المزرعة">استخدام في المزرعة</option>
                        <option value="تسميد أو رش دوري">تسميد أو رش دوري</option>
                        <option value="مكافحة إصابة حالية بالمزرعة">مكافحة إصابة حالية بالمزرعة</option>
                        <option value="إتلاف أو انتهاء صلاحية">إتلاف أو انتهاء صلاحية</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="form-input-group">
                    <label className="input-label-text">السعر:</label>
                    <input 
                      type="number" 
                      min="0"
                      className="modern-text-input" 
                      placeholder="أدخل سعر الوحدة" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value< 0 ? 0 : e.target.value)}
                      
                    />
                  </div>
                )}
 



<div className="form-input-group">
  <label className="input-label-text">
    {actionType === 'withdraw' ? 'الكمية المراد سحبها:' : 'الكمية المضافة:'}
  </label>
  <div className="select-dropdown-wrapper">
    <select 
      className="modern-dropdown-select" 
      value={quantity} 
      onChange={(e) => setQuantity(e.target.value)}
    >
      {/* الخيارات الصغير من 1 إلى 20 */}
      {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
        <option key={num} value={num}>{num}</option>
      ))}

      {/* خيارات بالعشرات حتى 100 */}
      {[30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,89,90,91,92,93,94,95,96, 97, 98, 99, 100, 110, 120, 130,140].map((num) => (
        <option key={num} value={num}>{num}</option>
      ))}

      {/* خيارات بالمئات حتى 10,000 */}
      {[150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,300,310,320,330,340,350,360,370,380,400, 400, 500,600, 700,800,900, 1000, 2000,3000,4000,5000,6000, 7000,8000,9000, 10000].map((num) => (
        <option key={num} value={num}>{num}</option>
      ))}
    </select>
  </div>
</div>



 

                <div className="form-input-group">
                  <label className="input-label-text">وحدة القياس:</label>
                  <div className="select-dropdown-wrapper">
                    <select className="modern-dropdown-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
                      <option value="كيس">كيس</option>
                      <option value="لتر">لتر</option>
                      <option value="كغ">كيلو غرام (كغ)</option>
                      <option value="عبوة">عبوة</option>
                      <option value="طن">طن</option>
                    </select>
                  </div>
                </div>

              </div>

                <div className="form-footer-actions">
                <button type="button" className="btn-primary-save" onClick={actionType === 'withdraw' ? handleWithdraw : handleAddNewItem}>
                  {actionType === 'withdraw' ? 'تأكيد السحب' : 'حفظ الصنف الجديد'}
                </button>
              </div>

            </div>
          </section>

        </section>
      </main>
    </div>
  );
};

export default Farmmanagement;