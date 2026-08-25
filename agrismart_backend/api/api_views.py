import csv
import io
from datetime import timedelta
import requests
import re
import random
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail, EmailMultiAlternatives, BadHeaderError
from django.template.loader import render_to_string
from django.utils.html import strip_tags


from .models import IrrigationSchedule
from .models import CustomUser, Service, SubscriptionPlan, UserSubscription, Payment,Farm, SoilSample, PlantGrowthRecord
from .models import Report, InventoryItem, ServiceUsage, Notification, PlantAnalysisRecord
from .ml_views import get_fertilizer_recommendation
from .permissions import PreventAdminAccess, IsAdminOrStaff
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ContactMessageSerializer,
    ServiceSerializer,
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
    PaymentCreateSerializer,
    PaymentSerializer,
    PlantAnalysisRecordCreateSerializer,
    FarmSerializer,
    InventoryItemSerializer,
    SoilSampleSerializer,
    ReportSerializer,
    PlantGrowthRecordSerializer,
     IrrigationScheduleSerializer
    , NotificationSerializer,
    ChangePasswordSerializer
)


User = get_user_model()


def _serialize_service_usage(usage):
    return {
        'id': usage.id,
        'user_id': usage.user.id,
        'user_email': usage.user.email,
        'service_key': usage.service_key,
        'count': usage.count,
        'subscription_id': usage.subscription.id if usage.subscription else None,
        'plan_code': usage.subscription.plan.code if usage.subscription and usage.subscription.plan else None,
        'plan_name': usage.subscription.plan.name_ar if usage.subscription and usage.subscription.plan else None,
        'updated_at': usage.updated_at,
    }


def _service_usage_queryset(request):
    qs = ServiceUsage.objects.select_related('user', 'subscription', 'subscription__plan').order_by('-updated_at')
    user_id = request.query_params.get('user_id')
    service_key = request.query_params.get('service_key')
    subscription_id = request.query_params.get('subscription_id')

    if user_id:
        qs = qs.filter(user_id=user_id)
    if service_key:
        qs = qs.filter(service_key=service_key)
    if subscription_id:
        qs = qs.filter(subscription_id=subscription_id)

    return qs

class AdminPendingPaymentsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        # جلب الدفعات التي تنتظر المراجعة فقط وترتيبها من الأحدث للأقدم
        return Payment.objects.filter(status="pending_verification").order_by("-created_at")
    
    
# 1. إنشاء Serializer مخصص لمدراء النظام
class AdminLoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # التحقق من صلاحيات المستخدم بعد التأكد من صحة البريد وكلمة المرور
        if not (self.user.is_staff or self.user.is_superuser or self.user.role == 'admin'):
            raise AuthenticationFailed("ليس لديك صلاحية الدخول كمسؤول.")
        return data

# 2. إنشاء View مخصص يستخدم الـ Serializer الجديد
class AdminLoginView(TokenObtainPairView):
    serializer_class = AdminLoginSerializer

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        # 1. حفظ المستخدم الجديد أولاً
        user = serializer.save()

        # 2. البحث عن الخطة المجانية (الأساسية)
        plan = SubscriptionPlan.objects.filter(code='basic', is_active=True).first()
        
        # 3. إذا كانت الخطة موجودة، ننشئ اشتراكاً نشطاً للمستخدم تلقائياً
        if plan:
            start_date = timezone.localdate()
            end_date = start_date + timedelta(days=30) # مدة الباقة المجانية

            UserSubscription.objects.create(
                user=user,
                plan=plan,
                status=UserSubscription.STATUS_ACTIVE,
                start_date=start_date,
                end_date=end_date,
            )


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class ContactUsView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        category_choices = dict(serializer.fields['category'].choices)
        email_data = data.copy()
        email_data['category'] = category_choices.get(data['category'], data['category'])

        subject = f"رسالة جديدة من {data['full_name']} - {email_data['category']}"
        html_content = render_to_string('emails/contact_email.html', email_data)
        text_content = strip_tags(html_content)
        client_subject = "شكراً لتواصلك معنا"
        client_body = (
            f"مرحباً {data['full_name']}،\n\n"
            f"شكراً لتواصلك معنا بخصوص ({email_data['category']}).\n"
            "لقد استلمنا رسالتك بنجاح، وسيقوم فريقنا بمراجعتها والرد عليك في أقرب وقت ممكن (عادة خلال 24 ساعة).\n\n"
            "ملاحظة: هذه رسالة تلقائية لتأكيد الاستلام، يرجى عدم الرد عليها.\n\n"
            "أطيب التحيات،\n"
            "فريق منصة AgriSmart"
        )
        client_html_body = f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: right; padding: 15px;">
            <p>مرحباً <strong>{data['full_name']}</strong>،</p>
            <p>شكراً لتواصلك معنا بخصوص (<strong>{email_data['category']}</strong>).</p>
            <p>لقد استلمنا رسالتك بنجاح، وسيقوم فريقنا بمراجعتها والرد عليك في أقرب وقت ممكن (عادة خلال 24 ساعة).</p>
            <br>
            <p style="color: #666; font-size: 0.9em;"><em>ملاحظة: هذه رسالة تلقائية لتأكيد الاستلام، يرجى عدم الرد عليها.</em></p>
            <br>
            <p>أطيب التحيات،<br><strong>فريق منصة AgriSmart</strong></p>
        </div>
        """

        try:
            email_message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.CONTACT_EMAIL_RECEIVER],
            reply_to=[data['email']], 
            )
            email_message.attach_alternative(html_content, "text/html")
            email_message.send() 

            client_email = EmailMultiAlternatives(
                subject=client_subject,
                body=client_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[data['email']],
            )
            client_email.attach_alternative(client_html_body, "text/html")
            client_email.send()
        except BadHeaderError:
            return Response({"detail": "حدث خطأ في رأس البريد الإلكتروني."}, status=400)
        except Exception as e:
            print(f"Error sending email: {e}")
            return Response({"detail": "فشل إرسال الرسالة، الرجاء المحاولة مرة أخرى لاحقاً."}, status=500)

        return Response({"detail": "تم إرسال الرسالة بنجاح، سنعاود الاتصال بك قريباً."})


class MeView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user


class ServiceListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, PreventAdminAccess]
    serializer_class = ServiceSerializer

    def get_queryset(self):
        return Service.objects.filter(is_active=True).order_by("key")


class SubscriptionPlanListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SubscriptionPlanSerializer

    def get_queryset(self):
        return SubscriptionPlan.objects.filter(is_active=True).order_by("id")


class SubscriptionPlanAdminListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    serializer_class = SubscriptionPlanSerializer

    def get_queryset(self):
        return SubscriptionPlan.objects.all().order_by("id")


class SubscriptionPlanAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrStaff]
    serializer_class = SubscriptionPlanSerializer
    queryset = SubscriptionPlan.objects.all()


class MySubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. إعطاء الأولوية القصوى لجلب الاشتراك "النشط" أولاً
        subscription = (
            UserSubscription.objects.select_related("plan")
            .filter(user=request.user, status=UserSubscription.STATUS_ACTIVE)
            .order_by("-start_date", "-id")
            .first()
        )
        
        # 2. إذا لم يكن هناك اشتراك نشط، نجلب أحدث اشتراك منتهي لعرضه
        if not subscription:
            subscription = (
                UserSubscription.objects.select_related("plan")
                .filter(user=request.user)
                .order_by("-start_date", "-id")
                .first()
            )

        if not subscription:
            return Response({"subscription": None})
        return Response({"subscription": UserSubscriptionSerializer(subscription).data})


class ActivateFreeSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Find basic/free plan
        plan = SubscriptionPlan.objects.filter(code='basic', is_active=True).first()
        if not plan:
            return Response({"detail": "خطة مجانية غير متاحة"}, status=404)

        start_date = timezone.localdate()
        end_date = start_date + timedelta(days=30)

        # 1. إنهاء أي اشتراك نشط سابق (سواء كان مدفوع أو مجاني) للحفاظ على التاريخ
        UserSubscription.objects.filter(user=request.user, status=UserSubscription.STATUS_ACTIVE).update(status=UserSubscription.STATUS_EXPIRED)
        
        # 2. إنشاء الاشتراك المجاني الجديد كاشتراك مستقل
        subscription = UserSubscription.objects.create(
            user=request.user,
            plan=plan,
            status=UserSubscription.STATUS_ACTIVE,
            start_date=start_date,
            end_date=end_date,
        )

        return Response({"subscription": UserSubscriptionSerializer(subscription).data})


class SaveAnalysisView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PlantAnalysisRecordCreateSerializer

    def perform_create(self, serializer):
        record = serializer.save(user=self.request.user)
        # increment service usage for disease_analysis linked to current subscription
        try:
            subscription = (
                UserSubscription.objects.filter(user=self.request.user, status=UserSubscription.STATUS_ACTIVE)
                .order_by("-start_date", "-id")
                .first()
            )
            usage, created = ServiceUsage.objects.get_or_create(
                user=self.request.user,
                subscription=subscription,
                service_key="disease_analysis",
                defaults={"count": 0},
            )
            usage.count = (usage.count or 0) + 1
            usage.save()
        except Exception:
            pass


# === Farm CRUD ===
class FarmListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FarmSerializer

    def get_queryset(self):
        return Farm.objects.filter(owner=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class FarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FarmSerializer
    lookup_field = "pk"

    def get_queryset(self):
        return Farm.objects.filter(owner=self.request.user)


# === Inventory CRUD ===
class InventoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InventoryItemSerializer

    def get_queryset(self):
        # تصفية حسب المزرعة إذا تم تمريرها في الرابط
        qs = InventoryItem.objects.filter(owner=self.request.user).order_by("-created_at")
        farm_id = self.request.query_params.get("farm")
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
        
        # تسجيل حركة الاستخدام في التقارير الشاملة
        try:
            subscription = (
                UserSubscription.objects.filter(user=self.request.user, status=UserSubscription.STATUS_ACTIVE)
                .order_by("-start_date", "-id")
                .first()
            )
            usage, created = ServiceUsage.objects.get_or_create(
                user=self.request.user,
                subscription=subscription,
                service_key="inventory",
                defaults={"count": 0},
            )
            usage.count = (usage.count or 0) + 1
            usage.save()
        except Exception:
            pass


class InventoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InventoryItemSerializer

    def get_queryset(self):
        return InventoryItem.objects.filter(owner=self.request.user)


# === Soil samples CRUD ===
class SoilSampleListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SoilSampleSerializer

    def get_queryset(self):
        qs = SoilSample.objects.filter(farm__owner=self.request.user).order_by("-taken_at")
        farm_id = self.request.query_params.get("farm")
        if farm_id:
            qs = qs.filter(farm_id=farm_id)
        return qs

    def perform_create(self, serializer):
        # حفظ عينة التربة
        serializer.save()
        
        # تسجيل حركة الاستخدام في التقارير الشاملة
        try:
            subscription = (
                UserSubscription.objects.filter(user=self.request.user, status=UserSubscription.STATUS_ACTIVE)
                .order_by("-start_date", "-id")
                .first()
            )
            usage, created = ServiceUsage.objects.get_or_create(
                user=self.request.user,
                subscription=subscription,
                service_key="soil_monitoring",
                defaults={"count": 0},
            )
            usage.count = (usage.count or 0) + 1
            usage.save()
        except Exception:
            pass


class SoilSampleDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SoilSampleSerializer

    def get_queryset(self):
        return SoilSample.objects.filter(farm__owner=self.request.user)


# === Reports CRUD ===
class ReportListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReportSerializer

    def get_queryset(self):
        return Report.objects.filter(author=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReportSerializer

    def get_queryset(self):
        return Report.objects.filter(author=self.request.user)


# === Plant growth records CRUD ===
class PlantGrowthListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PlantGrowthRecordSerializer

    def get_queryset(self):
        return PlantGrowthRecord.objects.filter(farm__owner=self.request.user).order_by("-record_date")

    def perform_create(self, serializer):
        farm = serializer.validated_data.get("farm")
        if farm.owner != self.request.user:
            raise permissions.PermissionDenied("Farm does not belong to user")
        
        # حفظ سجل النمو
        serializer.save()
        
        # تسجيل حركة الاستخدام في التقارير الشاملة
        try:
            subscription = (
                UserSubscription.objects.filter(user=self.request.user, status=UserSubscription.STATUS_ACTIVE)
                .order_by("-start_date", "-id")
                .first()
            )
            usage, created = ServiceUsage.objects.get_or_create(
                user=self.request.user,
                subscription=subscription,
                service_key="plant_growth",
                defaults={"count": 0},
            )
            usage.count = (usage.count or 0) + 1
            usage.save()
        except Exception:
            pass


class PlantGrowthDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PlantGrowthRecordSerializer

    def get_queryset(self):
        return PlantGrowthRecord.objects.filter(farm__owner=self.request.user)


# === Admin dashboard APIs ===
class AdminUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserSerializer

    def get_queryset(self):
        return CustomUser.objects.exclude(
            Q(role="admin") | Q(is_staff=True) | Q(is_superuser=True)
        ).order_by("-date_joined")


class AdminReportListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = ReportSerializer

    def get_queryset(self):
        return Report.objects.select_related("author").order_by("-created_at")


class AdminDashboardSummaryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        farmers_count = CustomUser.objects.filter(role="farmer").count()
        admin_count = CustomUser.objects.filter(
            Q(role="admin") | Q(is_staff=True) | Q(is_superuser=True)
        ).count()
        active_subscriptions = UserSubscription.objects.filter(status=UserSubscription.STATUS_ACTIVE).count()
        pending_reports = Report.objects.count()
        inventory_items = InventoryItem.objects.count()

        return Response({
            "users": {
                "farmers": farmers_count,
                "admins": admin_count,
                "total": farmers_count + admin_count,
            },
            "subscriptions": {
                "active": active_subscriptions,
                "total": UserSubscription.objects.count(),
            },
            "reports": {
                "total": pending_reports,
            },
            "inventory": {
                "total": inventory_items,
            },
        })

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = UserSerializer
    queryset = CustomUser.objects.all()
    
class AdminServiceUsageListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        usages = _service_usage_queryset(request)
        return Response([_serialize_service_usage(u) for u in usages])


class AdminServiceUsageDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get_object(self, pk):
        return ServiceUsage.objects.select_related('user', 'subscription', 'subscription__plan').filter(pk=pk).first()

    def get(self, request, pk):
        usage = self.get_object(pk)
        if not usage:
            return Response({'detail': 'سجل الاستخدام غير موجود'}, status=404)
        return Response(_serialize_service_usage(usage))

    def patch(self, request, pk):
        usage = self.get_object(pk)
        if not usage:
            return Response({'detail': 'سجل الاستخدام غير موجود'}, status=404)

        count = request.data.get('count', None)
        if count is None:
            return Response({'detail': 'يجب إرسال count'}, status=400)
        try:
            count = int(count)
        except (TypeError, ValueError):
            return Response({'detail': 'count يجب أن يكون رقمًا صحيحًا'}, status=400)
        if count < 0:
            return Response({'detail': 'count لا يمكن أن يكون سالبًا'}, status=400)

        usage.count = count
        usage.save(update_fields=['count', 'updated_at'])
        return Response(_serialize_service_usage(usage))

    def delete(self, request, pk):
        usage = self.get_object(pk)
        if not usage:
            return Response({'detail': 'سجل الاستخدام غير موجود'}, status=404)
        usage.delete()
        return Response(status=204)


class AdminServiceUsageResetView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        usage = ServiceUsage.objects.select_related('user', 'subscription', 'subscription__plan').filter(pk=pk).first()
        if not usage:
            return Response({'detail': 'سجل الاستخدام غير موجود'}, status=404)

        usage.count = 0
        usage.save(update_fields=['count', 'updated_at'])
        return Response(_serialize_service_usage(usage))


class AdminServiceUsageExportView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        usages = _service_usage_queryset(request)
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(['id', 'user_id', 'user_email', 'service_key', 'count', 'subscription_id', 'plan_code', 'plan_name', 'updated_at'])

        for usage in usages:
            writer.writerow([
                usage.id,
                usage.user.id,
                usage.user.email,
                usage.service_key,
                usage.count,
                usage.subscription.id if usage.subscription else '',
                usage.subscription.plan.code if usage.subscription and usage.subscription.plan else '',
                usage.subscription.plan.name_ar if usage.subscription and usage.subscription.plan else '',
                usage.updated_at.isoformat() if usage.updated_at else '',
            ])

        response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="service_usages.csv"'
        return response


class PaymentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, PreventAdminAccess]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = SubscriptionPlan.objects.filter(id=serializer.validated_data["plan_id"], is_active=True).first()
        if not plan:
            return Response({"detail": "خطة الاشتراك غير موجودة"}, status=404)

        payment = Payment.objects.create(
            user=request.user,
            plan=plan,
            method=serializer.validated_data["method"],
            amount=plan.price_amount,
            status=Payment.STATUS_PENDING,
            metadata={
                "provider": serializer.validated_data["method"],
                "sandbox": True,
            },
        )

        return Response({
            "payment": PaymentSerializer(payment).data,
            "instructions": self._build_instructions(payment),
        }, status=201)

    def _build_instructions(self, payment):
        if payment.method == Payment.METHOD_SHAM:
            return {
                "title": "Sham Cash",
                "message": "أرسل المبلغ إلى رقم Sham Cash التجريبي ثم أكد العملية من زر التأكيد.",
            }
        return {
            "title": "SyriTel Cash",
            "message": "أرسل المبلغ إلى رقم SyriTel Cash التجريبي ثم أكد العملية من زر التأكيد.",
        }


class PaymentConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated, PreventAdminAccess]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        payment = Payment.objects.filter(id=pk, user=request.user).select_related("plan").first()
        if not payment:
            return Response({"detail": "الدفعة غير موجودة"}, status=404)

        # 1. استلام الإثباتات من الواجهة
        transaction_number = request.data.get('transaction_number')
        proof_image = request.FILES.get('proof_image')

        # 2. التحقق من توفر الإثبات المطلوب حسب الوسيلة
        if payment.method == Payment.METHOD_SYRTEL and not transaction_number:
            return Response({"detail": "يرجى إدخال رقم عملية التحويل (سيريتل كاش)"}, status=400)
        
        if payment.method == Payment.METHOD_SHAM and not proof_image:
            return Response({"detail": "يرجى إرفاق صورة (سكرين شوت) لعملية التحويل (شام كاش)"}, status=400)

        # 3. حفظ الإثبات في قاعدة البيانات
        payment.transaction_number = transaction_number
        if proof_image:
            payment.proof_image = proof_image

        start_date = timezone.localdate()
        if payment.plan.billing_period == SubscriptionPlan.PERIOD_WEEK:
            end_date = start_date + timedelta(days=7)
        elif payment.plan.billing_period == SubscriptionPlan.PERIOD_YEAR:
            end_date = start_date + timedelta(days=365)
        else:
            end_date = start_date + timedelta(days=30)

        # Change status to pending_verification for admin review
        payment.status = "pending_verification"
        payment.metadata = {**(payment.metadata or {}), "confirmed_by_user": True, "start_date_calculated": start_date.isoformat(), "end_date_calculated": end_date.isoformat()}
        payment.save() 

        # We DO NOT create the subscription here anymore. Admin will do it.
        return Response({
            "payment": PaymentSerializer(payment).data, 
            "detail": "تم إرسال إثبات الدفع بنجاح. بانتظار مراجعة الإدارة لتفعيل الاشتراك."
        })

class AdminPaymentApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request, pk):
        payment = Payment.objects.filter(id=pk, status="pending_verification").select_related("plan", "user").first()
        if not payment:
            return Response({"detail": "الدفعة غير موجودة أو تم مراجعتها مسبقاً"}, status=404)

        action = request.data.get("action") # 'approve' or 'reject'
        
        if action == "approve":
            payment.status = Payment.STATUS_SUCCESS
            payment.save()

            # Create subscription
            start_date = timezone.localdate()
            if payment.plan.billing_period == SubscriptionPlan.PERIOD_WEEK:
                end_date = start_date + timedelta(days=7)
            elif payment.plan.billing_period == SubscriptionPlan.PERIOD_YEAR:
                end_date = start_date + timedelta(days=365)
            else:
                end_date = start_date + timedelta(days=30)

            # expire old ones
            UserSubscription.objects.filter(user=payment.user, status=UserSubscription.STATUS_ACTIVE).update(status=UserSubscription.STATUS_EXPIRED)

            subscription = UserSubscription.objects.create(
                user=payment.user,
                plan=payment.plan,
                status=UserSubscription.STATUS_ACTIVE,
                start_date=start_date,
                end_date=end_date,
            )
            return Response({"detail": "تم تفعيل الاشتراك بنجاح"})
        
        elif action == "reject":
            payment.status = Payment.STATUS_FAILED
            payment.save()
            return Response({"detail": "تم رفض الدفعة"})
            
        return Response({"detail": "إجراء غير صالح"}, status=400)

# لا تنسَ استيراد السيريالايزر والموديل الخاص بالجدولة

class IrrigationScheduleListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IrrigationScheduleSerializer

    def get_queryset(self):
        return IrrigationSchedule.objects.filter(user=self.request.user).order_by('created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class IrrigationScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IrrigationScheduleSerializer

    def get_queryset(self):
        return IrrigationSchedule.objects.filter(user=self.request.user)

class IrrigationScheduleDeleteAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        IrrigationSchedule.objects.filter(user=request.user).delete()
        return Response({"detail": "تم مسح جميع الجداول"}, status=204)


class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            note = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({"detail": "Notification not found"}, status=404)
        note.is_read = True
        note.save()
        return Response(NotificationSerializer(note).data)

class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Mark all unread notifications for this user as read
        qs = Notification.objects.filter(user=request.user, is_read=False)
        count = qs.update(is_read=True)
        return Response({"marked": count})

class FarmReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        report_type = request.query_params.get('type', 'daily')
        
        # 1. جلب أحدث مزرعة للمستخدم
        farm = Farm.objects.filter(owner=request.user).order_by("-created_at").first()
        if not farm:
            return Response({"detail": "لا توجد مزرعة مسجلة بعد. يرجى إضافة مزرعتك أولاً."}, status=404)
            
        # 2. جلب أحدث جدولة ري لمعرفة المدينة والكمية المقترحة
        latest_schedule = IrrigationSchedule.objects.filter(user=request.user).order_by('-created_at').first()
        city = latest_schedule.city if latest_schedule and latest_schedule.city else (farm.location or "Damascus")

        weather = {"temperature": 25, "humidity": 50, "rainfall": 0, "wind_speed": 10}
        api_key = "943736f280f208efd6e3e29c270bd099" # <<< ضع مفتاح الـ API الحقيقي هنا
        
        try:
            url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={api_key}"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                weather_data = res.json()
                weather = {
                    "temperature": round(weather_data["main"]["temp"]),
                    "humidity": weather_data["main"]["humidity"],
                    "rainfall": weather_data.get("rain", {}).get("1h", 0), # كمية المطر في آخر ساعة
                    "wind_speed": round(weather_data["wind"]["speed"] * 3.6, 1) # تحويل من m/s إلى km/h
                }
        except Exception as e:
            print("خطأ في جلب الطقس:", e)
            # سيعتمد على القيم الافتراضية في حال فشل الاتصال

        # 4. حساب الاستهلاك بناءً على الكمية المقترحة
        daily_water = 120.0 # قيمة افتراضية
        if latest_schedule and latest_schedule.api_data:
            suggestion_str = str(latest_schedule.api_data.get("water_suggestion", "120"))
            # استخراج الرقم من النص (مثال: يستخرج 150 من "150 لتر")
            match = re.search(r'([0-9]+(?:[.,][0-9]+)?)', suggestion_str)
            if match:
                daily_water = float(match.group(1).replace(',', '.'))

        # حساب الكمية بناءً على نوع التقرير
        if report_type == 'monthly':
            water_usage = f"{int(daily_water * 30)} لتر"
        else:
            water_usage = f"{int(daily_water)} لتر"

        # 5. بناء سجل الأنشطة الشامل للمزارع (Activity Logs)
        activities = []
        
        # نشاطات التربة
        soil_samples = SoilSample.objects.filter(farm=farm).order_by('-taken_at')[:3]
        for s in soil_samples:
            activities.append({
                "service_name": "تحليل التربة",
                "description": f"تم فحص التربة (رطوبة: {s.moisture or '-'}%, حموضة: {s.ph or '-'})",
                "timestamp": s.taken_at
            })
            
        # نشاطات فحص الأمراض
        analyses = PlantAnalysisRecord.objects.filter(user=request.user).order_by('-created_at')[:3]
        for pa in analyses:
            status = "سليم" if pa.is_healthy else f"مصاب ({pa.disease_name})"
            activities.append({
                "service_name": "فحص الأمراض",
                "description": f"تم فحص محصول {pa.plant_name or 'غير محدد'} - النتيجة: {status}",
                "timestamp": pa.created_at
            })

        # نشاطات سجلات النمو
        growths = PlantGrowthRecord.objects.filter(farm=farm).order_by('-created_at')[:3]
        for g in growths:
            activities.append({
                "service_name": "مراقبة النمو",
                "description": f"تسجيل نمو جديد (الطول: {g.height_cm or '-'} سم)",
                "timestamp": g.created_at
            })

        # ترتيب الأنشطة من الأحدث للأقدم
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        # تحويل التواريخ لنصوص لضمان إرسالها كـ JSON صالح
        for act in activities:
            act['timestamp'] = act['timestamp'].isoformat()

        # 6. جلب أحدث عينة تربة لتحديد حالة الخطر (المنطق الذكي)
        latest_soil = soil_samples.first()
        moisture = float(latest_soil.moisture) if latest_soil and latest_soil.moisture else 40.0
        
        status_key = "excellent"
        health_status = "ممتازة"
        
        if weather['rainfall'] > 5:
            guidance = f"أمطار جيدة متوقعة ({weather['rainfall']}mm). يرجى تقليل الري لتوفير المياه وتجنب اختناق الجذور."
            status_key = "good"
        elif moisture < 30:
            guidance = f"التربة جافة جداً (رطوبة {moisture}%). يجب تشغيل الري فوراً لتعويض النقص الحاد."
            status_key = "danger"
            health_status = "في خطر (جفاف)"
        elif weather['temperature'] > 35:
            guidance = "موجة حر شديدة! ينصح بالري في ساعات الصباح الباكر أو المساء لتقليل التبخر."
            status_key = "medium"
            health_status = "إجهاد حراري"
        else:
            guidance = "الظروف الجوية ورطوبة التربة مثالية. استمر في اتباع جدول الري الطبيعي."

        # إنشاء إشعار إذا كانت الحالة غير ممتازة
        if status_key != 'excellent':
            # Avoid creating duplicate notifications repeatedly on each report view.
            # Only create a new notification if there isn't an unread similar notification
            # created recently (e.g., within the last 12 hours).
            recent_window = timezone.now() - timedelta(hours=12)
            exists_recent_unread = Notification.objects.filter(
                user=request.user,
                title='تنبيه حالة المزرعة',
                link='/reports',
                is_read=False,
                created_at__gte=recent_window
            ).exists()

            if not exists_recent_unread:
                Notification.objects.create(
                    user=request.user,
                    title='تنبيه حالة المزرعة',
                    body=f"الحالة المقدرة: {health_status}. {guidance}",
                    level=status_key,
                    link='/reports'
                )

        # توصية التسميد الحقيقية
        try:
            fert_rec = get_fertilizer_recommendation(farm.crop_type or "Wheat")
        except Exception:
            fert_rec = "استخدم سماد NPK متوازن"
            
        fert_usage = "120 كغ" if report_type == 'monthly' else "4 كغ"
        
        summary = [
            f"متوسط درجات الحرارة {'اليوم' if report_type == 'daily' else 'لهذا الشهر'} سجل {weather['temperature']}°C.",
            f"تقييم صحة محصول ({farm.crop_type or 'غير محدد'}) يعتبر: {health_status}.",
            f"نصيحة التسميد المخصصة لمزرعتك: {fert_rec}"
        ]
        
        return Response({
            "status": status_key,
            "weather": weather,
            "stats": [
                { "id": "water", "label": f"الاستهلاك {'لليوم' if report_type == 'daily' else 'للشهر'} من المياه", "value": water_usage, "variant": "water", "icon": "/img/water.png" },
                { "id": "health", "label": "صحة المزرعة التقديرية", "value": health_status, "variant": "health", "icon": "/img/grrt.png" },
                { "id": "fert", "label": f"الاستهلاك {'لليوم' if report_type == 'daily' else 'للشهر'} من الأسمدة", "value": fert_usage, "variant": "fertilizer", "icon": "/img/phgf.png" }
            ],
            "summary": summary,
            "guidance": guidance,
            "activities_log": activities # <<< مصفوفة الأنشطة الجديدة
        })
    

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            # دالة set_password تقوم بتشفير الكلمة الجديدة قبل حفظها
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"detail": "تم تغيير كلمة المرور بنجاح."})
        return Response(serializer.errors, status=400)  

class PasswordResetRequestView(APIView):
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "الرجاء إدخال البريد الإلكتروني."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # نرسل رسالة نجاح حتى لو لم يكن مسجلاً لمنع التخمين العشوائي للإيميلات
            return Response({"detail": "إذا كان البريد مسجلاً لدينا، تم إرسال الرمز بنجاح."}, status=status.HTTP_200_OK)

        # توليد رمز من 6 أرقام
        otp = str(random.randint(100000, 999999))
        
        # حفظ الرمز في الـ Cache لمدة 15 دقيقة (900 ثانية)
        cache.set(f"reset_otp_{email}", otp, timeout=900)
       
        text_message = f'رمز استعادة كلمة المرور الخاص بك هو: {otp}\nهذا الرمز صالح لمدة 15 دقيقة.'

        # تصميم رسالة HTML احترافية
        html_message = f"""
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="background-color: #2e7d32; padding: 25px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 24px;">AgriSmart</h2>
            </div>
            
            <div style="padding: 30px; background-color: #ffffff; color: #333333;">
                <h3 style="color: #2e7d32; margin-top: 0;">استعادة كلمة المرور</h3>
                <p style="font-size: 16px; line-height: 1.6;">مرحباً،</p>
                <p style="font-size: 16px; line-height: 1.6;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. يرجى استخدام رمز التحقق أدناه لإكمال العملية:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2e7d32; background-color: #f1f8e9; padding: 15px 40px; border: 2px dashed #2e7d32; border-radius: 8px;">
                        {otp}
                    </span>
                </div>
                
                <p style="font-size: 14px; color: #d32f2f; font-weight: bold;">
                    * هذا الرمز صالح لمدة 15 دقيقة فقط.
                </p>
                <p style="font-size: 14px; color: #777777; line-height: 1.5;">
                    إذا لم تقم بطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة وأمان حسابك لن يتأثر.
                </p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #999999;">
                &copy; 2026 AgriSmart. جميع الحقوق محفوظة.
            </div>
        </div>
        """

        # إرسال البريد الإلكتروني
        send_mail(
            subject='رمز استعادة كلمة المرور - AgriSmart',
            message=text_message, # الرسالة النصية كبديل
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )

        return Response({"detail": "تم إرسال رمز التحقق بنجاح."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not all([email, otp, new_password]):
            return Response({"detail": "الرجاء إدخال جميع البيانات (البريد، الرمز، كلمة المرور الجديدة)."}, status=status.HTTP_400_BAD_REQUEST)

        cached_otp = cache.get(f"reset_otp_{email}")

        if not cached_otp or str(cached_otp) != str(otp):
            return Response({"detail": "الرمز غير صحيح أو منتهي الصلاحية."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            
            # حذف الرمز من الذاكرة بعد الاستخدام الناجح
            cache.delete(f"reset_otp_{email}")
            
            return Response({"detail": "تم تغيير كلمة المرور بنجاح."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"detail": "المستخدم غير موجود."}, status=status.HTTP_404_NOT_FOUND)      