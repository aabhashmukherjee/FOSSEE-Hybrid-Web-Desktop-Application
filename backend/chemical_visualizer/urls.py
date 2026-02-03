from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_home(request):
    return JsonResponse({
        'message': '🧪 Chemical Equipment Visualizer API',
        'status': 'running',
        'version': '1.0',
        'documentation': '/api/',
        'admin': '/admin/',
        'endpoints': {
            'api_root': '/api/',
            'datasets': '/api/datasets/',
            'upload': '/api/upload/',
            'register': '/api/register/',
            'login': '/api/login/',
        }
    })

urlpatterns = [
    path('', api_home, name='home'),  # Root URL
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]