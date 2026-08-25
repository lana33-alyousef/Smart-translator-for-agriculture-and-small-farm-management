from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0013_customuser_avatar"),
    ]

    operations = [
        migrations.AddField(
            model_name="subscriptionplan",
            name="discount_percent",
            field=models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=5),
        ),
    ]
