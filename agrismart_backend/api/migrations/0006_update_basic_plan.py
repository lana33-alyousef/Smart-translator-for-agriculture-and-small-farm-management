from django.db import migrations


def update_basic_plan(apps, schema_editor):
    SubscriptionPlan = apps.get_model('api', 'SubscriptionPlan')
    try:
        plan = SubscriptionPlan.objects.filter(code='basic').first()
        if plan:
            svc_limits = plan.service_limits or {}
            svc_limits['disease_analysis'] = max(svc_limits.get('disease_analysis', 0), 5)
            svc_limits['irrigation_scheduler'] = max(svc_limits.get('irrigation_scheduler', 0), 5)
            svc_limits['plant_growth'] = max(svc_limits.get('plant_growth', 0), 5)
            plan.service_limits = svc_limits

            features = plan.features or []
            # update disease analysis feature
            updated = False
            for i, f in enumerate(features):
                if 'تحليل أمراض النباتات' in f:
                    features[i] = 'تحليل أمراض النباتات (5 مرات مجاناً)'
                    updated = True
            if not updated:
                features.append('تحليل أمراض النباتات (10 مرات مجاناً)')

            # update irrigation feature
            updated2 = False
            for i, f in enumerate(features):
                if 'جدولة الري والتسميد' in f:
                    features[i] = 'جدولة الري والتسميد (5 مرات مجاناً)'
                    updated2 = True
            if not updated2:
                features.append('جدولة الري والتسميد (5 مرات مجاناً)')

            # ensure plant growth feature is present
            updated3 = False
            for i, f in enumerate(features):
                if 'متابعة' in f and 'نمو' in f:
                    features[i] = 'متابعة سجل نمو النبات (5 مرات مجاناً)'
                    updated3 = True
            if not updated3:
                features.append('متابعة سجل نمو النبات (5 مرات مجاناً)')

            plan.features = features
            plan.save()
    except Exception:
        pass


def reverse_update(apps, schema_editor):
    # no-op reverse
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_payment'),
    ]

    operations = [
        migrations.RunPython(update_basic_plan, reverse_update),
    ]
