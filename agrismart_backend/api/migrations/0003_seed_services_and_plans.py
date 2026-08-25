from django.db import migrations


def seed_services_and_plans(apps, schema_editor):
    Service = apps.get_model("api", "Service")
    SubscriptionPlan = apps.get_model("api", "SubscriptionPlan")

    services = [
        {
            "key": "farm_management",
            "name_ar": "إدارة المزارع",
            "description_ar": "إدارة بيانات المزرعة والمحاصيل.",
        },
        {
            "key": "irrigation_scheduler",
            "name_ar": "جدولة الري والتسميد",
            "description_ar": "توصيات الري والتسميد بناءً على البيانات والطقس.",
        },
        {
            "key": "inventory",
            "name_ar": "إدارة المخزون",
            "description_ar": "تتبع المواد والمستلزمات الزراعية.",
        },
        {
            "key": "soil_monitoring",
            "name_ar": "رصد حالة التربة والري",
            "description_ar": "متابعة حالة التربة والرطوبة.",
        },
        {
            "key": "reports",
            "name_ar": "التقارير والإحصاءات",
            "description_ar": "تقارير وملخصات ونتائج.",
        },
        {
            "key": "disease_analysis",
            "name_ar": "تحليل أمراض النباتات",
            "description_ar": "تحليل صور النبات واقتراح العلاج.",
        },
        {
            "key": "plant_growth",
            "name_ar": "متابعة نمو النباتات",
            "description_ar": "سجل نمو النباتات ومتابعته.",
        },
    ]

    service_by_key = {}
    for s in services:
        obj, _ = Service.objects.get_or_create(
            key=s["key"],
            defaults={
                "name_ar": s["name_ar"],
                "description_ar": s["description_ar"],
                "is_active": True,
            },
        )
        service_by_key[obj.key] = obj

    plans = [
        {
            "code": "basic",
            "name_ar": "الباقة الأساسية",
            "price_amount": 0,
            "price_currency": "SYP",
            "billing_period": "month",
            "features": [
                "إدارة المزارع والمحاصيل الأساسية",
                "مراقبة حالة الطقس",
                "تحليل أمراض النباتات (٣ مرات فقط مجاناً)",
                "جدولة الري والتسميد (مرتين فقط مجاناً)",
            ],
            "service_limits": {
                "disease_analysis": 5,
                "irrigation_scheduler": 5,
                "plant_growth": 5,
            },
            "services": [
                "farm_management",
                "disease_analysis",
                "irrigation_scheduler",
                "plant_growth",
            ],
        },
        {
            "code": "weekly",
            "name_ar": "الباقة الأسبوعية",
            "price_amount": 30,
            "price_currency": "SYP",
            "billing_period": "week",
            "features": [
                "جميع الميزات الأساسية",
                "عدد غير محدود من تحليلات الأمراض",
                "عدد غير محدود لجدولة الري والتسميد",
                "تقارير أسبوعية تفصيلية",
            ],
            "service_limits": {
                "disease_analysis": -1,
                "irrigation_scheduler": -1,
            },
            "services": [
                "farm_management",
                "disease_analysis",
                "irrigation_scheduler",
                "reports",
            ],
        },
        {
            "code": "pro",
            "name_ar": "الباقة الاحترافية",
            "price_amount": 99,
            "price_currency": "SYP",
            "billing_period": "month",
            "features": [
                "دخول غير محدود لجميع الخدمات",
                "تقارير يومية وشهرية مخصصة",
                "تنبيهات وتوصيات العلاج الفورية",
                "تحليل التربة المتقدم",
                "دعم فني على مدار الساعة ذو أولوية",
                "تصدير البيانات وتنزيل السجلات",
            ],
            "service_limits": {
                "disease_analysis": -1,
                "irrigation_scheduler": -1,
                "reports": -1,
                "soil_monitoring": -1,
            },
            "services": [
                "farm_management",
                "irrigation_scheduler",
                "inventory",
                "soil_monitoring",
                "reports",
                "disease_analysis",
                "plant_growth",
            ],
        },
    ]

    for plan in plans:
        plan_obj, _ = SubscriptionPlan.objects.get_or_create(
            code=plan["code"],
            defaults={
                "name_ar": plan["name_ar"],
                "price_amount": plan["price_amount"],
                "price_currency": plan["price_currency"],
                "billing_period": plan["billing_period"],
                "features": plan["features"],
                "service_limits": plan["service_limits"],
                "is_active": True,
            },
        )

        # Ensure M2M services are connected
        desired_services = [service_by_key[k] for k in plan["services"] if k in service_by_key]
        plan_obj.services.set(desired_services)


def unseed_services_and_plans(apps, schema_editor):
    Service = apps.get_model("api", "Service")
    SubscriptionPlan = apps.get_model("api", "SubscriptionPlan")

    SubscriptionPlan.objects.filter(code__in=["basic", "weekly", "pro"]).delete()
    Service.objects.filter(
        key__in=[
            "farm_management",
            "irrigation_scheduler",
            "inventory",
            "soil_monitoring",
            "reports",
            "disease_analysis",
            "plant_growth",
        ]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_service_plantanalysisrecord_subscriptionplan_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_services_and_plans, unseed_services_and_plans),
    ]
