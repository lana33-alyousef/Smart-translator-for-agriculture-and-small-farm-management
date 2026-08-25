from django.contrib import admin

from .models import CustomUser, PlantAnalysisRecord, Service, SubscriptionPlan, UserSubscription


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
	list_display = ("email", "full_name", "role", "is_active", "is_staff", "date_joined")
	search_fields = ("email", "full_name")
	list_filter = ("role", "is_active", "is_staff")


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
	list_display = ("key", "name_ar", "is_active", "created_at")
	list_filter = ("is_active",)
	search_fields = ("key", "name_ar")


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
	list_display = ("code", "name_ar", "price_amount", "price_currency", "billing_period", "is_active")
	list_filter = ("billing_period", "is_active")
	search_fields = ("code", "name_ar")
	filter_horizontal = ("services",)


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
	list_display = ("user", "plan", "status", "start_date", "end_date", "created_at")
	list_filter = ("status", "plan")
	search_fields = ("user__email", "plan__code")


@admin.register(PlantAnalysisRecord)
class PlantAnalysisRecordAdmin(admin.ModelAdmin):
	list_display = ("user", "plant_name", "disease_name", "is_healthy", "confidence", "created_at")
	list_filter = ("is_healthy",)
	search_fields = ("user__email", "plant_name", "disease_name")


from .models import Farm, InventoryItem, SoilSample, Report, PlantGrowthRecord


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
	list_display = ("name", "owner", "crop_type", "area", "created_at")
	search_fields = ("name", "owner__email")


@admin.register(InventoryItem)
class InventoryAdmin(admin.ModelAdmin):
	list_display = ("name", "owner", "quantity", "unit", "category", "created_at")
	search_fields = ("name", "owner__email", "category")


@admin.register(SoilSample)
class SoilSampleAdmin(admin.ModelAdmin):
	list_display = ("farm", "taken_at", "ph", "moisture", "created_at")
	search_fields = ("farm__name",)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
	list_display = ("title", "author", "report_type", "created_at")
	search_fields = ("title", "author__email")


@admin.register(PlantGrowthRecord)
class PlantGrowthAdmin(admin.ModelAdmin):
	list_display = ("farm", "record_date", "plant_type", "height_cm", "created_at")
	search_fields = ("farm__name", "plant_type")
