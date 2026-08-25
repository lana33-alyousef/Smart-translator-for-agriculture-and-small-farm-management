from django.urls import path

from . import api_views, ml_entrypoints

urlpatterns = [
    # Auth + profile
    path('api/auth/register/', api_views.RegisterView.as_view(), name='register'),
    path('api/me/', api_views.MeView.as_view(), name='me'),
    path('api/change-password/', api_views.ChangePasswordView.as_view(), name='change_password'),
    path('api/password-reset/', api_views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('api/password-reset-confirm/', api_views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Services + plans
    path('api/services/', api_views.ServiceListView.as_view(), name='services'),
    path('api/plans/', api_views.SubscriptionPlanListView.as_view(), name='plans'),
    path('api/admin/plans/', api_views.SubscriptionPlanAdminListCreateView.as_view(), name='admin_plans'),
    path('api/admin/plans/<int:pk>/', api_views.SubscriptionPlanAdminDetailView.as_view(), name='admin_plan_detail'),
    path('api/my-subscription/', api_views.MySubscriptionView.as_view(), name='my_subscription'),
    path('api/save-analysis/', api_views.SaveAnalysisView.as_view(), name='save_analysis'),
    # Farm management
    path('api/farms/', api_views.FarmListCreateView.as_view(), name='farms_list_create'),
    path('api/farms/<int:pk>/', api_views.FarmDetailView.as_view(), name='farms_detail'),

    # Inventory
    path('api/inventory/', api_views.InventoryListCreateView.as_view(), name='inventory_list_create'),
    path('api/inventory/<int:pk>/', api_views.InventoryDetailView.as_view(), name='inventory_detail'),

    # Soil monitoring
    path('api/soil-samples/', api_views.SoilSampleListCreateView.as_view(), name='soil_samples_list_create'),
    path('api/soil-samples/<int:pk>/', api_views.SoilSampleDetailView.as_view(), name='soil_samples_detail'),

    # Reports
    path('api/reports/', api_views.ReportListCreateView.as_view(), name='reports_list_create'),
    path('api/reports/<int:pk>/', api_views.ReportDetailView.as_view(), name='reports_detail'),

    # Plant growth
    path('api/plant-growth/', api_views.PlantGrowthListCreateView.as_view(), name='plant_growth_list_create'),
    path('api/plant-growth/<int:pk>/', api_views.PlantGrowthDetailView.as_view(), name='plant_growth_detail'),

    # Admin dashboard
    path('api/admin/summary/', api_views.AdminDashboardSummaryView.as_view(), name='admin_summary'),
    path('api/admin/users/', api_views.AdminUserListView.as_view(), name='admin_users'),
    path('api/admin/reports/', api_views.AdminReportListView.as_view(), name='admin_reports'),
    path('api/admin/usages/', api_views.AdminServiceUsageListView.as_view(), name='admin_usages'),
    path('api/admin/usages/export/', api_views.AdminServiceUsageExportView.as_view(), name='admin_usages_export'),
    path('api/admin/usages/<int:pk>/', api_views.AdminServiceUsageDetailView.as_view(), name='admin_usages_detail'),
    path('api/admin/usages/<int:pk>/reset/', api_views.AdminServiceUsageResetView.as_view(), name='admin_usages_reset'),
    path('api/admin/payments/<int:pk>/approve/', api_views.AdminPaymentApproveView.as_view(), name='admin_payment_approve'),
    path('api/admin/users/<int:pk>/', api_views.AdminUserDetailView.as_view(), name='admin_user_detail'),

    path('api/payments/create/', api_views.PaymentCreateView.as_view(), name='payment_create'),
    path('api/payments/<int:pk>/confirm/', api_views.PaymentConfirmView.as_view(), name='payment_confirm'),
    path('api/activate-free/', api_views.ActivateFreeSubscriptionView.as_view(), name='activate_free'),
    path('api/contact/', api_views.ContactUsView.as_view(), name='contact_us'),

    # ML services (protected) - lazy import to avoid TensorFlow load on startup
    path('api/analyze/', ml_entrypoints.analyze_plant, name='analyze_plant'),
    path('api/irrigation/', ml_entrypoints.predict_irrigation, name='predict_irrigation'),
    path('api/admin/login/', api_views.AdminLoginView.as_view(), name='admin_login'),
    path('api/admin/payments/pending/', api_views.AdminPendingPaymentsListView.as_view(), name='admin_pending_payments'),
    path('api/admin/payments/<int:pk>/approve/', api_views.AdminPaymentApproveView.as_view(), name='admin_payment_approve'), 
    # Irrigation Schedules
    path('api/schedules/', api_views.IrrigationScheduleListCreateView.as_view(), name='schedules_list_create'),
    path('api/schedules/clear/', api_views.IrrigationScheduleDeleteAllView.as_view(), name='schedules_clear'),
    path('api/schedules/<int:pk>/', api_views.IrrigationScheduleDetailView.as_view(), name='schedules_detail'),

    # Reports
    path('api/reports/', api_views.ReportListCreateView.as_view(), name='reports_list_create'),
    path('api/reports/<int:pk>/', api_views.ReportDetailView.as_view(), name='reports_detail'),
    path('api/farm-report/', api_views.FarmReportView.as_view(), name='farm_report'), # <--- السطر الجديد  
    path('api/notifications/', api_views.NotificationListView.as_view(), name='notifications_list'),
    path('api/notifications/mark_all_read/', api_views.NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
    path('api/notifications/<int:pk>/read/', api_views.NotificationMarkReadView.as_view(), name='notification_mark_read'),
]