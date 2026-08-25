import React, { useState, useEffect } from "react";
import { api } from "../../api/client";
// import FarmEditorHeader from '../../Component/FarmEditor/FarmEditorHeader'
// import FarmEditorHero from '../../Component/FarmEditor/FarmEditorHero'
// import FarmEditorForm from '../../Component/FarmEditor/FarmEditorForm'
import FarmEditorUpload from "../../Component/FarmEditor/FarmEditorUpload";
import FarmEditorStage from "../../Component/FarmEditor/FarmEditorStage";
import FarmEditorNote from "../../Component/FarmEditor/FarmEditorNote";
import "./FarmEditor.css";
import leaf2 from "../../img/leaf2.png";

const FarmEditor = () => {
  const fieldLabels = [
    { id: "name", label: "اسم المزرعة:" },
    { id: "type", label: " نوع المحصول:" },
    { id: "quantity", label: " مساحة المزرعة:" },
    { id: "date", label: " تاريخ زراعة المحصول: " },
    { id: "place", label: "موقع المزرعة (الإحداثيات):" },
  ];

  const [form, setForm] = useState({ name: "", type: "", quantity: "", date: "", place: "" });
  const [farms, setFarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4500);
  }

  const fetchFarms = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/farms/");
      setFarms(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("فشل جلب المزارع:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
    const onInventoryChanged = () => {
      // When inventory changes, refresh farms to reflect any dependent updates
      fetchFarms();
    };
    window.addEventListener('inventory:changed', onInventoryChanged);
    return () => window.removeEventListener('inventory:changed', onInventoryChanged);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/farms/${editingId}/`, form);
        setEditingId(null);
      } else {
        await api.post("/api/farms/", form);
      }
      const res = await api.get("/api/farms/");
      setFarms(Array.isArray(res.data) ? res.data : []);
      setForm({ name: "", type: "", quantity: "", date: "", place: "" });
      addNotification("تم حفظ المزرعة بنجاح", "success");
    } catch (err) {
      console.error(err);
      addNotification("حدث خطأ أثناء حفظ المزرعة", "error");
    }
  };

  const handleEdit = (farm) => {
    setEditingId(farm.id);
    setForm({ name: farm.name || "", type: farm.type || "", quantity: farm.quantity || "", date: farm.date || "", place: farm.place || "" });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه المزرعة؟")) return;
    try {
      await api.delete(`/api/farms/${id}/`);
      setFarms((prev) => prev.filter((f) => f.id !== id));
      addNotification('تم حذف المزرعة', 'success');
    } catch (e) {
      console.error(e);
      addNotification("فشل حذف المزرعة", 'error');
    }
  };

  return (
    <main className="farm-editor-page" dir="rtl">
      <div className="notifications-root">
        {notifications.map(n => (
          <div key={n.id} className={`notif ${n.type}`}>{n.message}</div>
        ))}
      </div>
      <div className="farm-editor-shell">
        <section className="farm-list-section">
          <h2>قائمة المزارع</h2>
          {isLoading ? (
            <p>جاري تحميل المزارع...</p>
          ) : farms.length === 0 ? (
            <p>لا توجد مزارع حتى الآن.</p>
          ) : (
            <ul className="farm-list">
              {farms.map((f) => (
                <li key={f.id} className="farm-item">
                  <div>
                    <strong>{f.name}</strong> — {f.type} — {f.quantity}
                  </div>
                  <div className="farm-actions">
                    <button onClick={() => handleEdit(f)}>تعديل</button>
                    <button onClick={() => handleDelete(f.id)}>حذف</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="farm-form-section">
          <h2>{editingId ? 'تعديل مزرعة' : 'إضافة مزرعة جديدة'}</h2>
          <form onSubmit={handleSubmit} className="farm-create-form">
            {fieldLabels.map((fld) => (
              <div className="form-row" key={fld.id}>
                <label>{fld.label}</label>
                <input name={fld.id} value={form[fld.id] || ''} onChange={handleChange} />
              </div>
            ))}
            <div className="form-actions">
              <button type="submit">{editingId ? 'حفظ التعديلات' : 'إنشاء المزرعة'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: "", type: "", quantity: "", date: "", place: "" }); }}>إلغاء</button>}
            </div>
          </form>
        </section>

        <FarmEditorUpload />
        <FarmEditorStage
          title="مراحل نمو النباتات"
          label="مرحلة الإنبات"
          percentage={25}
        />
        <FarmEditorNote />
      </div>
    </main>
  );
};

export default FarmEditor;
