"""
ProdVision Configuration
Production configuration for the ProdVision SQLite application
"""

# Application Configuration
SECRET_KEY = 'prod-secret-key-change-in-production'  # Change this in production!
DEBUG = False  # Set to False for production
HOST = '0.0.0.0'  # Allow external connections for server
PORT = 7070

# Instructions:
# 1. The application uses individual SQLite databases for each application (CVAR ALL, CVAR NYQ, XVA, REG, OTHERS)
# 2. Database files: ./data/cvar_all.db, ./data/cvar_nyq.db, ./data/xva.db, ./data/reg.db, ./data/others.db
# 3. For production: Set DEBUG=False and use a proper WSGI server
# 4. For 24/7 operation: Use systemd, supervisor, or similar process manager
