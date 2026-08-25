from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import PlantAnalysisRecord, Service, SubscriptionPlan, UserSubscription, Payment
from .models import Farm, InventoryItem, SoilSample, Report, PlantGrowthRecord
from .models import IrrigationSchedule
from .models import Notification

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["email", "full_name", "phone_number", "role", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone_number", "role", "is_active", "date_joined", "avatar"]
        read_only_fields = ["id", "email", "date_joined"]


class ContactMessageSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    category = serializers.ChoiceField(
        choices=[
            ("tech", "دعم تقني"),
            ("agri", "استشارة زراعية"),
            ("sales", "مبيعات واشتراكات"),
            ("other", "أخرى"),
        ]
    )
    message = serializers.CharField(max_length=3000)


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "key", "name_ar", "description_ar", "is_active"]


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "code",
            "name_ar",
            "price_amount",
            "price_currency",
            "discount_percent",
            "billing_period",
            "discount_expiry",
            "features",
            "service_limits",
            "is_active",
            "services",
        ]

def to_representation(self, instance):
        # جلب البيانات من قاعدة البيانات (لوحة التحكم) كما هي
        data = super().to_representation(instance)
        
        # تم إزالة كل الشروط اليدوية السابقة 
        # الآن الباك إند سيرسل بالضبط ما تكتبه في لوحة الأدمن

        return data


class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = UserSubscription
        fields = ["id", "status", "start_date", "end_date", "plan"]


class PaymentSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name_ar", read_only=True)

    class Meta:
        model = Payment
        fields = ["id", "user", "plan", "plan_name", "method", "amount", "status",'transaction_number', 'proof_image', "metadata", "created_at"]
        read_only_fields = ["id", "user", "amount", "status", "metadata", "created_at"]


class PaymentCreateSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES)


class PlantAnalysisRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantAnalysisRecord
        fields = [
            "plant_name",
            "disease_name",
            "is_healthy",
            "confidence",
            "pesticide_info",
        ]


class FarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farm
        fields = ["id", "owner", "name", "location", "area", "area_unit", "crop_type", "planting_date", "notes", "created_at"]
        read_only_fields = ["id", "owner", "created_at"]


class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = ["id", "owner", "farm", "name", "quantity","price", "unit", "category", "threshold", "notes", "created_at"]
        read_only_fields = ["id", "owner", "created_at"]


class SoilSampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoilSample
        fields = ["id", "farm", "taken_at", "ph", "moisture", "electrical_conductivity", "organic_carbon", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]


class ReportSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    author_email = serializers.EmailField(source="author.email", read_only=True)

    class Meta:
        model = Report
        fields = ["id", "author", "author_name", "author_email", "title", "report_type", "content", "created_at"]
        read_only_fields = ["id", "author", "created_at"]


class PlantGrowthRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantGrowthRecord
        fields = ["id", "farm", "record_date", "plant_type", "height_cm", "notes", "created_at"]
        read_only_fields = ["id", "created_at"]

# لا تنسَ استيراد الموديل الجديد: from .models import IrrigationSchedule
class IrrigationScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = IrrigationSchedule
        fields = ['id', 'user', 'city', 'region', 'crop', 'irr_date', 'fert_date', 'api_data', 'last_updated', 'created_at']
        read_only_fields = ['id', 'user', 'last_updated', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'body', 'level', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=6)        