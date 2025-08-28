#!/usr/bin/env python3
"""
Local Development Setup Script
This script sets up the Real Estate Management System for local development.
"""

import os
import sys
import subprocess
import sqlite3

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def create_virtual_environment():
    """Create virtual environment if it doesn't exist"""
    if not os.path.exists('venv'):
        print("🔧 Creating virtual environment...")
        try:
            subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
            print("✅ Virtual environment created")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to create virtual environment")
            return False
    else:
        print("✅ Virtual environment already exists")
        return True

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing Python dependencies...")
    try:
        # Determine the pip command based on OS
        if os.name == 'nt':  # Windows
            pip_cmd = os.path.join('venv', 'Scripts', 'pip')
        else:  # Unix/Linux/macOS
            pip_cmd = os.path.join('venv', 'bin', 'pip')
        
        subprocess.run([pip_cmd, 'install', '-r', 'requirements.txt'], check=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        return False

def create_database():
    """Create SQLite database"""
    print("🗄️  Creating database...")
    try:
        # Import and run the database creation script
        from create_database import create_sqlite_database
        if create_sqlite_database():
            print("✅ Database created successfully")
            return True
        else:
            print("❌ Failed to create database")
            return False
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = '.env'
    if not os.path.exists(env_file):
        print("📝 Creating .env file...")
        env_content = """SECRET_KEY=your-secret-key-change-this-in-production
FLASK_ENV=development
FLASK_DEBUG=True
"""
        try:
            with open(env_file, 'w') as f:
                f.write(env_content)
            print("✅ .env file created")
            return True
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
            return False
    else:
        print("✅ .env file already exists")
        return True

def check_frontend_setup():
    """Check if frontend dependencies are installed"""
    frontend_dir = 'frontend'
    node_modules = os.path.join(frontend_dir, 'node_modules')
    
    if not os.path.exists(frontend_dir):
        print("⚠️  Frontend directory not found")
        return False
    
    if not os.path.exists(node_modules):
        print("⚠️  Frontend dependencies not installed")
        print("   Run 'cd frontend && npm install' to install frontend dependencies")
        return False
    
    print("✅ Frontend dependencies found")
    return True

def main():
    """Main setup function"""
    print("🚀 Setting up Real Estate Management System for Local Development")
    print("=" * 70)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create virtual environment
    if not create_virtual_environment():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Create .env file
    if not create_env_file():
        sys.exit(1)
    
    # Create database
    if not create_database():
        sys.exit(1)
    
    # Check frontend setup
    check_frontend_setup()
    
    print("\n🎉 Setup completed successfully!")
    print("\n📝 Next steps:")
    print("1. Activate virtual environment:")
    if os.name == 'nt':  # Windows
        print("   venv\\Scripts\\activate")
    else:  # Unix/Linux/macOS
        print("   source venv/bin/activate")
    print("2. Start backend server: python app.py")
    print("3. In another terminal, start frontend:")
    print("   cd frontend && npm start")
    print("\n🌐 Access the application:")
    print("   Backend: http://localhost:5001")
    print("   Frontend: http://localhost:3000")

if __name__ == "__main__":
    main()
