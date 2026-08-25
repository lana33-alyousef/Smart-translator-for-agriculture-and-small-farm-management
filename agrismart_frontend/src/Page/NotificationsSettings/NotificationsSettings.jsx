import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { MdNotifications } from "react-icons/md";
import "./NotificationsSettings.css";
import SettingsSwitch from "../../Component/SettingsSwitch/SettingsSwitch";

export default function NotificationsSettings() {
  const [smartEnabled, setSmartEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);

  return (
    <section className="notifications-card">
      <div className="notifications-list">
        <div className="notifications-row">
          <div className="notifications-label" dir="rtl">
            <MdNotifications size={20} />
            <span>تفعيل التوصيات الذكية</span>
          </div>
          <div className="notifications-control">
            <SettingsSwitch
              checked={smartEnabled}
              onClick={() => setSmartEnabled((s) => !s)}
              smallLabel="تفعيل"
              variant="decorated"
              checkedThumbIcon="/img/hj.png"
              uncheckedThumbIcon="/img/bell.png"
            />
          </div>
        </div>

        <div className="notifications-row notifications-type">
          <div className="notifications-label" dir="rtl">
            <span>نوع التوصيات الذكية</span>
          </div>
          <div className="notifications-control">
            <button type="button" className="notifications-edit">
              <FiEdit size={18} />
            </button>
          </div>
        </div>

        <div className="notifications-row">
          <div className="notifications-label" dir="rtl">
            <span>تفعيل التنبيهات الذكية</span>
          </div>
          <div className="notifications-control">
            <SettingsSwitch
              checked={notifEnabled}
              onClick={() => setNotifEnabled((s) => !s)}
              smallLabel="تفعيل"
              variant="decorated"
              checkedThumbIcon="/img/hj.png"
              uncheckedThumbIcon="/img/bell.png"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
