import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import joblib

print("⏳ جاري قراءة البيانات...")
# تأكد أن ملف الـ csv موجود في نفس المجلد
df = pd.read_csv("irrigation_prediction.csv").dropna()

target_column = "Irrigation_Need"
label_encoder = LabelEncoder()
df[target_column] = label_encoder.fit_transform(df[target_column])

categorical_cols = ["Soil_Type", "Crop_Type", "Crop_Growth_Stage", "Season", "Irrigation_Type", "Water_Source", "Region", "Mulching_Used"]
numerical_cols = ["Soil_pH", "Soil_Moisture", "Organic_Carbon", "Electrical_Conductivity", "Temperature_C", "Humidity", "Rainfall_mm", "Sunlight_Hours", "Wind_Speed_kmh", "Field_Area_hectare", "Previous_Irrigation_mm"]

x = df[categorical_cols + numerical_cols]
y = df[target_column]

preprocessor = ColumnTransformer([
    ("num", StandardScaler(), numerical_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols)
])

print("⏳ جاري معالجة البيانات...")
x_processed = preprocessor.fit_transform(x)

print("⏳ جاري تطبيق SMOTE لموازنة البيانات...")
smote = SMOTE(random_state=42)
x_resampled, y_resampled = smote.fit_resample(x_processed, y)

print("⏳ جاري تدريب موديل XGBoost (قد يستغرق 10 ثوانٍ)...")
model = XGBClassifier(
    n_estimators=300, max_depth=10, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8, objective="multi:softmax", random_state=42
)
model.fit(x_resampled, y_resampled)

print("⏳ جاري حفظ الملفات الجديدة...")
joblib.dump(model, "irrigation_xgboost_model.pkl")
joblib.dump(preprocessor, "preprocessor.pkl")
joblib.dump(label_encoder, "label_encoder.pkl")

print("✅ مبروك! تم إنشاء ملفات pkl بنجاح، وهي الآن متوافقة 100% مع سيرفرك المحلي!")