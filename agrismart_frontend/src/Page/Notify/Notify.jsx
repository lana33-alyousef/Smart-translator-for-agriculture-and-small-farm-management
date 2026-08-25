  import { useState } from 'react'
import Navbarnotifiction from '../../Component/Navbarnotifiction/Navbarnotifiction'
import logo from '../../img/Agrismart.png'
import ProfileCard from '../../Component/Notify/ProfileCard'
import NotificationSettingsCard from '../../Component/Notify/NotificationSettingsCard'
import AlertsList from '../../Component/Notify/AlertsList'
import hhh from '../../img/hhh.png'
import './Notify.css'

const Notify = () => {
  const links = [
    { label: 'تواصل معنا', to: '/contact' },
    { label: 'من نحن', to: '/about' },
    { label: 'نصائح وإرشادات', to: '/tips' }
  ]

  const initialAlerts = [
    {
      type: 'error',
      title: 'تنبيه صحي عاجل',
      message: 'تم رصد إصابة بمرض صدأ القمح في القسم الشمالي من المزرعة'
    },
    {
      type: 'warning',
      title:  'تنبيه مناخي: يوجد احتمال تشكل صقيع',
      message:  'تشير التوقعات إلى انخفاض حاد في درجات الحرارة فننصح بتفعيل أنظمة التدفئة وتغطية المحاصيل الحساسة'
    },
    {
      type: 'success',
      title:  'تنبيه إداري :',
      message:  'فقد النظام الاتصال بحساسات الرطوبة ، يرجى التحقق من وصلة الشبكة لضمان تدفق البيانات بسلام '
    }
  ]

  const [alerts, setAlerts] = useState(initialAlerts)

  const mockAnalyzePlant = async (file) => {
    const name = file.name.toLowerCase()
    const healthyByName =
      name.includes('healthy') ||
      name.includes('salem') ||
      name.includes('salemh') ||
      name.includes('سليم')

    await new Promise((resolve) => setTimeout(resolve, 900))

    if (healthyByName) {
      return {
        is_healthy: true,
        plant_name: 'القمح',
        confidence: '95'
      }
    }

    return {
      is_healthy: false,
      plant_name: 'الذرة',
      disease_name: 'لفحة الأوراق',
      confidence: '89',
      pesticide_info: 'يوصى باستخدام مبيد مانكوزيب بجرعة مناسبة حسب تعليمات السلامة.',
      pesticide: 'مانكوزيب'
    }
  }

  const handleUnhealthyDetected = (result) => {
    const newAlert = {
      type: 'warning',
      title: 'تنبيه المختبر الذكي',
      message: `النبتة غير سليمة (${result.disease_name})، ينصح باستخدام مبيد ${result.pesticide ?? 'غير معروف'}`
    }

    setAlerts((prevAlerts) => {
      const exists = prevAlerts.some((alert) => alert.message === newAlert.message)
      if (exists) {
        return prevAlerts
      }
      return [newAlert, ...prevAlerts]
    })
  }

  return (
    <div>
      <Navbarnotifiction
        logo={logo}
        brand='AgriSmart'
        links={links}
        searchPlaceholder='ابحث'
      />

      <div className='container-fluid py-4 px-4 notify'>
        <div className='mb-4'>
          <ProfileCard
            eyebrow='المختبر الذكي'
            actionLabel='عرض المبيد المناسب'
            onAnalyze={mockAnalyzePlant}
            onUnhealthyDetected={handleUnhealthyDetected}
              onAction={() => {}}
          />
        </div>

        <div className='mb-4'>
          <NotificationSettingsCard
          titlenote="الإشعارات"
          imgnotesettin={hhh}
          />
        </div>
         <div className='mb-4'>
          <AlertsList
           title ="التنبيهات"
           alerts={alerts} />
        </div>
      </div>
    </div>
  )
}

export default Notify