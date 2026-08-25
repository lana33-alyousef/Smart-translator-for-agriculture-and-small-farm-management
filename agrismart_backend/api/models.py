from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('يجب إدخال البريد الإلكتروني')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('farmer', 'مزارع'),
        ('admin', 'مدير النظام'),
    )

    email = models.EmailField(unique=True, verbose_name="البريد الإلكتروني")
    full_name = models.CharField(max_length=150, verbose_name="الاسم الكامل")
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="رقم الهاتف")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="صورة الملف الشخصي")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='farmer', verbose_name="الصلاحية")
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.email


class Service(models.Model):
    key = models.SlugField(unique=True)
    name_ar = models.CharField(max_length=200)
    description_ar = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name_ar


class SubscriptionPlan(models.Model):
    PERIOD_WEEK = "week"
    PERIOD_MONTH = "month"
    PERIOD_YEAR = "year"
    PERIOD_CHOICES = (
        (PERIOD_WEEK, "Weekly"),
        (PERIOD_MONTH, "Monthly"),
        (PERIOD_YEAR, "Yearly"),    
    )
    discount_expiry = models.DateField(null=True, blank=True, verbose_name="تاريخ انتهاء الخصم")

    code = models.SlugField(unique=True)
    name_ar = models.CharField(max_length=200)
    price_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    price_currency = models.CharField(max_length=10, default="SYP")
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, blank=True)
    billing_period = models.CharField(
        max_length=10, choices=PERIOD_CHOICES, default=PERIOD_MONTH
    )

    features = models.JSONField(default=list, blank=True)
    service_limits = models.JSONField(default=dict, blank=True)
    services = models.ManyToManyField(Service, related_name="plans", blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name_ar


class UserSubscription(models.Model):
    STATUS_ACTIVE = "active"
    STATUS_EXPIRED = "expired"
    STATUS_CANCELED = "canceled"
    STATUS_CHOICES = (
        (STATUS_ACTIVE, "Active"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_CANCELED, "Canceled"),
    )

    user = models.ForeignKey(
        "api.CustomUser", on_delete=models.CASCADE, related_name="subscriptions"
    )
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT, related_name="user_subscriptions"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.plan.code}"


class ServiceUsage(models.Model):
    user = models.ForeignKey(
        "api.CustomUser", on_delete=models.CASCADE, related_name="service_usages"
    )
    subscription = models.ForeignKey(
        UserSubscription, on_delete=models.SET_NULL, null=True, blank=True, related_name="usages"
    )
    service_key = models.CharField(max_length=64)
    count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "subscription", "service_key")

    def __str__(self):
        sub = self.subscription.id if self.subscription else "none"
        return f"{self.user.email} - {self.service_key} ({self.count}) @ {sub}"


class PlantAnalysisRecord(models.Model):
    user = models.ForeignKey(
        "api.CustomUser", on_delete=models.CASCADE, related_name="plant_analyses"
    )
    plant_name = models.CharField(max_length=200, blank=True, default="")
    disease_name = models.CharField(max_length=200, blank=True, default="")
    is_healthy = models.BooleanField(default=False)
    confidence = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    pesticide_info = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.plant_name}"


# === Farm management ===
class Farm(models.Model):
    owner = models.ForeignKey("api.CustomUser", on_delete=models.CASCADE, related_name="farms")
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=255, blank=True)
    area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    area_unit = models.CharField(max_length=20, default="hectare", blank=True)
    crop_type = models.CharField(max_length=120, blank=True)
    planting_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.owner.email})"


# === Inventory ===
class InventoryItem(models.Model):
    owner = models.ForeignKey("api.CustomUser", on_delete=models.CASCADE, related_name="inventory")
    farm = models.ForeignKey('Farm', on_delete=models.CASCADE, null=True, blank=True, related_name="inventory_items")
    name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    unit = models.CharField(max_length=30, default="unit")
    category = models.CharField(max_length=120, blank=True)
    threshold = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.owner.email}"


# === Soil monitoring ===
class SoilSample(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="soil_samples")
    taken_at = models.DateTimeField()
    ph = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    moisture = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    electrical_conductivity = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    organic_carbon = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SoilSample {self.farm.name} @ {self.taken_at.date()}"


# === Reports ===
class Report(models.Model):
    author = models.ForeignKey("api.CustomUser", on_delete=models.CASCADE, related_name="reports")
    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=120, blank=True)
    content = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.author.email}"


# === Plant growth records ===
class PlantGrowthRecord(models.Model):
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name="growth_records")
    record_date = models.DateField()
    plant_type = models.CharField(max_length=120, blank=True)
    height_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Growth {self.farm.name} - {self.record_date}"


# === Payments (simple sandbox) ===
class Payment(models.Model):
    METHOD_SHAM = "sham_cash"
    METHOD_SYRTEL = "syrtel_cash"
    METHOD_CHOICES = (
        (METHOD_SHAM, "Sham Cash"),
        (METHOD_SYRTEL, "SyriTel Cash"),
    )

    STATUS_PENDING = "pending"
    STATUS_PENDING_VERIFICATION = "pending_verification"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_PENDING_VERIFICATION, "Pending Verification"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
    )

    user = models.ForeignKey("api.CustomUser", on_delete=models.CASCADE, related_name="payments")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name="payments")
    method = models.CharField(max_length=40, choices=METHOD_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # حقول إثبات الدفع المضافة
    transaction_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="رقم العملية")
    proof_image = models.ImageField(upload_to='payment_proofs/', blank=True, null=True, verbose_name="صورة الإيصال")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.user.email} - {self.plan.code} - {self.status}"
    
# === Irrigation Scheduler ===
class IrrigationSchedule(models.Model):
    user = models.ForeignKey("api.CustomUser", on_delete=models.CASCADE, related_name="irrigation_schedules")
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=50)
    crop = models.CharField(max_length=100)
    irr_date = models.DateTimeField(null=True, blank=True)
    fert_date = models.DateTimeField(null=True, blank=True)
    api_data = models.JSONField(default=dict, blank=True)
    last_updated = models.DateField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.crop} - {self.city} ({self.user.email})"    


class Notification(models.Model):
    LEVEL_INFO = 'info'
    LEVEL_SUCCESS = 'good'
    LEVEL_WARNING = 'medium'
    LEVEL_DANGER = 'danger'
    LEVEL_CHOICES = (
        (LEVEL_INFO, 'Info'),
        (LEVEL_SUCCESS, 'Good'),
        (LEVEL_WARNING, 'Medium'),
        (LEVEL_DANGER, 'Danger'),
    )

    user = models.ForeignKey('api.CustomUser', on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default=LEVEL_INFO)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification {self.user.email} - {self.title} [{self.level}]"