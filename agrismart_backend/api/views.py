import os
import json
import zipfile
import os
import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
import requests
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from PIL import Image
from tensorflow.keras.utils import img_to_array
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input


# --- 1. إعداد المسارات ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'best_model.keras')
WEIGHTS_PATH = os.path.join(BASE_DIR, 'ml_models', 'model.weights.h5')
CLASSES_PATH = os.path.join(BASE_DIR, 'ml_models', 'class_indices.json')
# إضافة مسارات ملفات JSON
ARABIC_NAMES_PATH = os.path.join(BASE_DIR, 'ml_models', 'class_names_ar.json')
PESTICIDES_PATH = os.path.join(BASE_DIR, 'ml_models', 'pesticides_data.json')

# --- 2. تحميل قواميس البيانات ---
with open(CLASSES_PATH, 'r') as f:
    class_indices = json.load(f)
labels = {v: k for k, v in class_indices.items()}

# تحميل ملفات الترجمة والمبيدات
with open(ARABIC_NAMES_PATH, 'r', encoding='utf-8') as f:
    arabic_names = json.load(f)

with open(PESTICIDES_PATH, 'r', encoding='utf-8') as f:
    pesticides_data = json.load(f)

# --- 2. استخراج الأوزان ---
if os.path.exists(MODEL_PATH) and not os.path.exists(WEIGHTS_PATH):
    print("⏳ جاري استخراج ملف الأوزان...")
    with zipfile.ZipFile(MODEL_PATH, 'r') as z:
        if 'model.weights.h5' in z.namelist():
            z.extract('model.weights.h5', path=os.path.join(BASE_DIR, 'ml_models'))
        else:
            for file_name in z.namelist():
                if file_name.endswith('.h5'):
                    with open(WEIGHTS_PATH, 'wb') as f:
                        f.write(z.read(file_name))
                    break

# --- 3. بناء الهيكل الحقيقي المكتشف ---
print("⏳ جاري بناء الهيكل...")
base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights=None)

model = tf.keras.Sequential([
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(128, activation='relu'), # 🌟 الطبقة المكتشفة من الخطأ 🌟
    tf.keras.layers.Dropout(0.5),
    tf.keras.layers.Dense(len(class_indices), activation='softmax')
])

model.build((None, 224, 224, 3))

# --- 4. تحميل الأوزان ---
print("⏳ جاري تركيب الأوزان...")
model.load_weights(WEIGHTS_PATH)
print("✅ تم تركيب الأوزان بنجاح وبدون أي أخطاء! الموديل جاهز.")

# --- 5. واجهة الاستقبال ---
@csrf_exempt
def analyze_plant(request):
    if request.method == 'POST' and request.FILES.get('image'):
        try:
            img = Image.open(request.FILES['image']).convert('RGB').resize((224, 224))
            
            img_array = img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = preprocess_input(img_array)
            
            predictions = model.predict(img_array)
            idx = int(np.argmax(predictions[0]))
            conf = float(np.max(predictions[0])) * 100
            
            # استخراج الاسم الانجليزي الأصلي
            raw_name = labels[idx]
            is_healthy = 'healthy' in raw_name.lower()

            # جلب البيانات باللغة العربية بناءً على الاسم الأصلي
            plant_ar = arabic_names.get(raw_name, {}).get("plant", "غير معروف")
            disease_ar = arabic_names.get(raw_name, {}).get("disease", "غير معروف")
            pesticide = pesticides_data.get(raw_name, "لا يوجد علاج مقترح حالياً.")

            # إرسال البيانات المنسقة للواجهة
            return JsonResponse({
                'status': 'success',
                'is_healthy': is_healthy,
                'plant_name': plant_ar,
                'disease_name': disease_ar,
                'pesticide': pesticide,
                'confidence': round(conf, 2)
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'طلب غير صالح'}, status=400)



IRRIGATION_MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'irrigation_xgboost_model.pkl')
PREPROCESSOR_PATH = os.path.join(BASE_DIR, 'ml_models', 'preprocessor.pkl')
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, 'ml_models', 'label_encoder.pkl')

try:
    irrigation_model = joblib.load(IRRIGATION_MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)
except Exception as e:
    print(f"⚠️ تحذير: {e}")

WEATHER_API_KEY = "943736f280f208efd6e3e29c270bd099"

def get_weather(city):
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("لم يتم العثور على المنطقة، تأكد من كتابة الاسم باللغة الإنجليزية بشكل صحيح.")
    data = response.json()
    return {
        "temperature": data["main"]["temp"],
        "humidity": data["main"]["humidity"],
        "rainfall": data.get("rain", {}).get("1h", 0),
        "wind_speed": round(data["wind"]["speed"] * 3.6, 2)
    }

def get_current_season():
    month = datetime.now().month
    if 6 <= month <= 10: return "Kharif"
    elif month in [11, 12, 1, 2, 3]: return "Rabi"
    else: return "Zaid"

def calculate_precise_water(level, temp, humidity, rainfall):
    base_water = {"Low": 15, "Medium": 30, "High": 45}.get(level, 0)
    temp_factor = (temp - 25) * 0.8
    humidity_factor = (50 - humidity) * 0.1
    total_water = base_water + temp_factor + humidity_factor - (rainfall * 0.7)
    return max(0, round(total_water, 2))

# 🌟 الجديد: قاموس توصيات الأسمدة العلمية (NPK) لكل هكتار
def get_fertilizer_recommendation(crop_type):
    recommendations = {
        "Wheat": "120 كغ نيتروجين (N)، 60 كغ فوسفور (P)، 40 كغ بوتاسيوم (K) للهكتار",
        "Cotton": "150 كغ نيتروجين (N)، 60 كغ فوسفور (P)، 60 كغ بوتاسيوم (K) للهكتار",
        "Maize": "120 كغ نيتروجين (N)، 60 كغ فوسفور (P)، 40 كغ بوتاسيوم (K) للهكتار",
        "Potato": "150 كغ نيتروجين (N)، 100 كغ فوسفور (P)، 100 كغ بوتاسيوم (K) للهكتار",
        "Sugarcane": "250 كغ نيتروجين (N)، 100 كغ فوسفور (P)، 100 كغ بوتاسيوم (K) للهكتار",
    }
    # إذا لم يكن المحصول في القائمة، نعطي قيمة عامة
    return recommendations.get(crop_type, "100 كغ نيتروجين، 50 كغ فوسفور، 50 كغ بوتاسيوم (كمية تقديرية للهكتار)")

@csrf_exempt
def predict_irrigation(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            city = data.get('city')
            region_direction = data.get('region_direction', 'Central')
            crop_type = str(data.get('crop_type', '')).strip().capitalize()

            if not city or not crop_type:
                return JsonResponse({'status': 'error', 'message': 'الرجاء إدخال المنطقة والمحصول'}, status=400)

            weather = get_weather(city)
            current_season = get_current_season()
            sunlight_hours = 10 if current_season == "Zaid" else 8 if current_season == "Kharif" else 6
            estimated_soil_moisture = max(10, 60 - (weather["temperature"] * 0.5) + (weather["humidity"] * 0.2) + weather["rainfall"])

            input_data = pd.DataFrame([{
                "Soil_Type": "Loamy", "Crop_Type": crop_type, "Crop_Growth_Stage": "Vegetative",
                "Season": current_season, "Irrigation_Type": "Drip", "Water_Source": "Groundwater",
                "Region": region_direction, "Mulching_Used": "Yes", "Soil_pH": 6.8, 
                "Soil_Moisture": round(estimated_soil_moisture, 2), "Organic_Carbon": 1.2, 
                "Electrical_Conductivity": 0.5, "Temperature_C": weather["temperature"], 
                "Humidity": weather["humidity"], "Rainfall_mm": weather["rainfall"], 
                "Sunlight_Hours": sunlight_hours, "Wind_Speed_kmh": weather["wind_speed"], 
                "Field_Area_hectare": 2.0, "Previous_Irrigation_mm": max(0, weather["rainfall"])
            }])

            input_processed = preprocessor.transform(input_data)
            prediction = irrigation_model.predict(input_processed)
            irrigation_level = label_encoder.inverse_transform(prediction)[0]
            precise_water = calculate_precise_water(irrigation_level, weather["temperature"], weather["humidity"], weather["rainfall"])

            season_translations = {"Kharif": "موسم الخريف", "Rabi": "موسم الربيع", "Zaid": "الموسم الصيفي"}
            
            # جلب التوصية الدقيقة للسماد
            fert_suggestion = get_fertilizer_recommendation(crop_type)

            return JsonResponse({
                'status': 'success',
                'region': city,
                'crop': crop_type,
                'season': season_translations.get(current_season, current_season),
                'temperature': f"{weather['temperature']}°C",
                'humidity': f"{weather['humidity']}%",
                'rainfall': f"{weather['rainfall']}mm",
                'wind_speed': f"{weather['wind_speed']}km/h",
                'expected_level': irrigation_level,
                'water_suggestion': f"{precise_water} mm",
                'fert_suggestion': fert_suggestion # 🌟 إرسال التوصية
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'طلب غير صالح'}, status=400)