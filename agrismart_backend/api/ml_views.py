import json
import os
import zipfile
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
import requests
from PIL import Image
from rest_framework import permissions
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.core.cache import cache

from .models import UserSubscription, PlantAnalysisRecord, ServiceUsage
# tensorflow/keras imports moved into AnalyzePlantView to avoid heavy import at module load


# --- 1. إعداد المسارات ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "best_model.keras")
WEIGHTS_PATH = os.path.join(BASE_DIR, "ml_models", "model.weights.h5")
CLASSES_PATH = os.path.join(BASE_DIR, "ml_models", "class_indices.json")
ARABIC_NAMES_PATH = os.path.join(BASE_DIR, "ml_models", "class_names_ar.json")
PESTICIDES_PATH = os.path.join(BASE_DIR, "ml_models", "pesticides_data.json")


with open(CLASSES_PATH, "r") as f:
    class_indices = json.load(f)
labels = {v: k for k, v in class_indices.items()}

with open(ARABIC_NAMES_PATH, "r", encoding="utf-8") as f:
    arabic_names = json.load(f)

with open(PESTICIDES_PATH, "r", encoding="utf-8") as f:
    pesticides_data = json.load(f)


# --- 2. استخراج الأوزان إذا لزم ---
if os.path.exists(MODEL_PATH) and not os.path.exists(WEIGHTS_PATH):
    with zipfile.ZipFile(MODEL_PATH, "r") as z:
        if "model.weights.h5" in z.namelist():
            z.extract("model.weights.h5", path=os.path.join(BASE_DIR, "ml_models"))
        else:
            for file_name in z.namelist():
                if file_name.endswith(".h5"):
                    with open(WEIGHTS_PATH, "wb") as out:
                        out.write(z.read(file_name))
                    break


# --- 3. بناء وتحميل الموديل ---
_ANALYSIS_MODEL = None
_ANALYSIS_MODEL_LOADED = False
_ANALYSIS_MODEL_LABELS = None


IRRIGATION_MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "irrigation_xgboost_model.pkl")
PREPROCESSOR_PATH = os.path.join(BASE_DIR, "ml_models", "preprocessor.pkl")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "ml_models", "label_encoder.pkl")

try:
    irrigation_model = joblib.load(IRRIGATION_MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)
except Exception:
    irrigation_model = None
    preprocessor = None
    label_encoder = None


WEATHER_API_KEY = "943736f280f208efd6e3e29c270bd099"


def get_weather(city: str) -> dict:
    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}&appid={WEATHER_API_KEY}&units=metric"
    )
    response = requests.get(url, timeout=20)
    if response.status_code != 200:
        raise Exception(
            "لم يتم العثور على المنطقة، تأكد من كتابة الاسم باللغة الإنجليزية بشكل صحيح."
        )
    data = response.json()
    return {
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "rainfall": data.get("rain", {}).get("1h", 0),
        "wind_speed": round(data["wind"]["speed"] * 3.6, 2),
    }


def get_current_season() -> str:
    month = datetime.now().month
    if 6 <= month <= 10:
        return "Kharif"
    if month in [11, 12, 1, 2, 3]:
        return "Rabi"
    return "Zaid"


def calculate_precise_water(level: str, temp: float, humidity: float, rainfall: float) -> float:
    base_water = {"Low": 15, "Medium": 30, "High": 45}.get(level, 0)
    temp_factor = (temp - 25) * 0.8
    humidity_factor = (50 - humidity) * 0.1
    total_water = base_water + temp_factor + humidity_factor - (rainfall * 0.7)
    return max(0, round(total_water, 2))


def get_fertilizer_recommendation(crop_type: str) -> str:
    recommendations = {
        "Wheat": "120 كغ نيتروجين (N)، 60 كغ فوسفور (P)، 40 كغ بوتاسيوم (K) للهكتار",
        "Cotton": "150 كغ نيتروجين (N)، 60 كغ فوسفور (P)، 60 كغ بوتاسيوم (K) للهكتار",
        "Maize": "120 كغ نيتروجين (N)، 60 كغ فوسفور (P)، 40 كغ بوتاسيوم (K) للهكتار",
        "Potato": "150 كغ نيتروجين (N)، 100 كغ فوسفور (P)، 100 كغ بوتاسيوم (K) للهكتار",
        "Sugarcane": "250 كغ نيتروجين (N)، 100 كغ فوسفور (P)، 100 كغ بوتاسيوم (K) للهكتار",
    }
    return recommendations.get(
        crop_type,
        "100 كغ نيتروجين، 50 كغ فوسفور، 50 كغ بوتاسيوم (كمية تقديرية للهكتار)",
    )


class AnalyzePlantView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _ensure_model(self):
        """Lazy-load the TensorFlow/Keras model and helpers only when analyze endpoint is called."""
        global _ANALYSIS_MODEL, _ANALYSIS_MODEL_LOADED, _ANALYSIS_MODEL_LABELS
        if _ANALYSIS_MODEL_LOADED:
            return
        try:
            import tensorflow as tf
            from keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
            from keras.utils import img_to_array

            base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights=None)
            model = tf.keras.Sequential(
                [
                    base_model,
                    tf.keras.layers.GlobalAveragePooling2D(),
                    tf.keras.layers.Dense(128, activation="relu"),
                    tf.keras.layers.Dropout(0.5),
                    tf.keras.layers.Dense(len(class_indices), activation="softmax"),
                ]
            )
            model.build((None, 224, 224, 3))
            model.load_weights(WEIGHTS_PATH)

            _ANALYSIS_MODEL = {
                "model": model,
                "preprocess": preprocess_input,
                "img_to_array": img_to_array,
            }
            _ANALYSIS_MODEL_LABELS = labels
            _ANALYSIS_MODEL_LOADED = True
        except Exception as e:
            # ensure model-left state remains false
            _ANALYSIS_MODEL_LOADED = False
            raise

    def post(self, request):
        # Enforce per-user subscription and service limits
        subscription = (
            UserSubscription.objects.filter(user=request.user, status=UserSubscription.STATUS_ACTIVE)
            .order_by("-start_date", "-id")
            .first()
        )
        if not subscription:
            return Response({"status": "error", "message": "الرجاء تفعيل الخطة المجانية أو الاشتراك"}, status=403)

        svc_limit = subscription.plan.service_limits.get("disease_analysis", -1) if subscription.plan.service_limits else -1
        if svc_limit is not None and svc_limit >= 0:
            # count previous saved analyses within subscription period
            start = subscription.start_date
            end = subscription.end_date or timezone.localdate()
            previous_count = PlantAnalysisRecord.objects.filter(
                user=request.user,
                created_at__date__gte=start,
                created_at__date__lte=end,
            ).count()
            if previous_count >= svc_limit:
                return Response({"status": "error", "message": "تم تجاوز حد التحليلات المجانية. يرجى الاشتراك."}, status=402)
        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"status": "error", "message": "الصورة مطلوبة"}, status=400)

        try:
            # lazy-load heavy ML libs and model
            self._ensure_model()
            model = _ANALYSIS_MODEL["model"]
            preprocess_input = _ANALYSIS_MODEL["preprocess"]
            img_to_array = _ANALYSIS_MODEL["img_to_array"]

            img = Image.open(image_file).convert("RGB").resize((224, 224))
            img_array = img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = preprocess_input(img_array)

            predictions = model.predict(img_array)
            idx = int(np.argmax(predictions[0]))
            conf = float(np.max(predictions[0])) * 100

            raw_name = _ANALYSIS_MODEL_LABELS[idx]
            is_healthy = "healthy" in raw_name.lower()

            plant_ar = arabic_names.get(raw_name, {}).get("plant", "غير معروف")
            disease_ar = arabic_names.get(raw_name, {}).get("disease", "غير معروف")
            pesticide = pesticides_data.get(raw_name, "لا يوجد علاج مقترح حالياً.")

            return Response(
                {
                    "status": "success",
                    "is_healthy": is_healthy,
                    "plant_name": plant_ar,
                    "disease_name": disease_ar,
                    "pesticide": pesticide,
                    "confidence": round(conf, 2),
                }
            )
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=500)


class PredictIrrigationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser]

    def post(self, request):
        if not irrigation_model or not preprocessor or not label_encoder:
            return Response(
                {"status": "error", "message": "نموذج الري غير جاهز على السيرفر"},
                status=500,
            )

        # enforce per-user subscription limits for irrigation
        subscription = (
            UserSubscription.objects.filter(user=request.user, status=UserSubscription.STATUS_ACTIVE)
            .order_by("-start_date", "-id")
            .first()
        )
        if not subscription:
            return Response({"status": "error", "message": "الرجاء تفعيل الخطة المجانية أو الاشتراك"}, status=403)

        svc_limit = subscription.plan.service_limits.get("irrigation_scheduler", -1) if subscription.plan.service_limits else -1
        if svc_limit is not None and svc_limit >= 0:
            # use ServiceUsage model instead of cache for persistent counting
            usage = ServiceUsage.objects.filter(user=request.user, subscription=subscription, service_key="irrigation_scheduler").first()
            current = usage.count if usage else 0
            if current >= svc_limit:
                return Response({"status": "error", "message": "تم تجاوز حد جدول الري المجاني. يرجى الاشتراك."}, status=403)

        try:
            city = request.data.get("city")
            region_direction = request.data.get("region_direction", "Central")
            crop_type = str(request.data.get("crop_type", "")).strip().capitalize()

            if not city or not crop_type:
                return Response(
                    {"status": "error", "message": "الرجاء إدخال المنطقة والمحصول"},
                    status=400,
                )

            weather = get_weather(city)
            current_season = get_current_season()
            sunlight_hours = 10 if current_season == "Zaid" else 8 if current_season == "Kharif" else 6
            estimated_soil_moisture = max(
                10,
                60
                - (weather["temperature"] * 0.5)
                + (weather["humidity"] * 0.2)
                + weather["rainfall"],
            )

            input_data = pd.DataFrame(
                [
                    {
                        "Soil_Type": "Loamy",
                        "Crop_Type": crop_type,
                        "Crop_Growth_Stage": "Vegetative",
                        "Season": current_season,
                        "Irrigation_Type": "Drip",
                        "Water_Source": "Groundwater",
                        "Region": region_direction,
                        "Mulching_Used": "Yes",
                        "Soil_pH": 6.8,
                        "Soil_Moisture": round(estimated_soil_moisture, 2),
                        "Organic_Carbon": 1.2,
                        "Electrical_Conductivity": 0.5,
                        "Temperature_C": weather["temperature"],
                        "Humidity": weather["humidity"],
                        "Rainfall_mm": weather["rainfall"],
                        "Sunlight_Hours": sunlight_hours,
                        "Wind_Speed_kmh": weather["wind_speed"],
                        "Field_Area_hectare": 2.0,
                        "Previous_Irrigation_mm": max(0, weather["rainfall"]),
                    }
                ]
            )

            input_processed = preprocessor.transform(input_data)
            prediction = irrigation_model.predict(input_processed)
            irrigation_level = label_encoder.inverse_transform(prediction)[0]
            precise_water = calculate_precise_water(
                irrigation_level,
                weather["temperature"],
                weather["humidity"],
                weather["rainfall"],
            )

            season_translations = {
                "Kharif": "موسم الخريف",
                "Rabi": "موسم الربيع",
                "Zaid": "الموسم الصيفي",
            }

            fert_suggestion = get_fertilizer_recommendation(crop_type)

            # increment irrigation usage on success (persistently)
            if svc_limit is not None and svc_limit >= 0:
                try:
                    usage, created = ServiceUsage.objects.get_or_create(
                        user=request.user,
                        subscription=subscription,
                        service_key="irrigation_scheduler",
                        defaults={"count": 0},
                    )
                    usage.count = (usage.count or 0) + 1
                    usage.save()
                except Exception:
                    pass

            return Response(
                {
                    "status": "success",
                    "region": city,
                    "crop": crop_type,
                    "season": season_translations.get(current_season, current_season),
                    "temperature": f"{weather['temperature']}°C",
                    "humidity": f"{weather['humidity']}%",
                    "rainfall": f"{weather['rainfall']}mm",
                    "wind_speed": f"{weather['wind_speed']}km/h",
                    "expected_level": irrigation_level,
                    "water_suggestion": f"{precise_water} mm",
                    "fert_suggestion": fert_suggestion,
                }
            )
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=500)
