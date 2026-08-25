"""Lightweight entrypoints for ML endpoints."""
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def analyze_plant(request, *args, **kwargs):
    from .ml_views import AnalyzePlantView

    view = AnalyzePlantView.as_view()
    return view(request, *args, **kwargs)

@csrf_exempt
def predict_irrigation(request, *args, **kwargs):
    from .ml_views import PredictIrrigationView

    view = PredictIrrigationView.as_view()
    return view(request, *args, **kwargs)