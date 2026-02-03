from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

@api_view(['POST'])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'User exists'}, status=400)
    
    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({'message': 'User created', 'username': user.username}, status=201)

@api_view(['POST'])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        return Response({'message': 'Login success', 'username': user.username})
    return Response({'error': 'Invalid credentials'}, status=401)