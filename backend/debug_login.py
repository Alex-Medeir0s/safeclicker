#!/usr/bin/env python
"""Debug script to check login flow"""

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash, verify_password
import hashlib

session = SessionLocal()

# Get admin user
user = session.query(User).filter(User.email == 'admin@safeclicker.com').first()

if not user:
    print("❌ User not found")
    session.close()
    exit(1)

print(f"✓ User found: {user.email}")
print(f"  Role: {user.role}")
print(f"  Department: {user.department_id}")
print(f"  Stored hash: {user.hashed_password}")

# Test password
password = "admin123"
print(f"\nTesting password: {password}")

# Expected SHA256
expected_sha256 = hashlib.sha256(password.encode()).hexdigest()
print(f"  Expected SHA256: {expected_sha256}")
print(f"  Hash length: {len(user.hashed_password)}")
print(f"  Match: {user.hashed_password == expected_sha256}")

# Test with verify_password
try:
    match = verify_password(password, user.hashed_password)
    print(f"  verify_password result: {match}")
except Exception as e:
    print(f"  verify_password error: {e}")

# Check if it's a valid hex hash
try:
    int(user.hashed_password, 16)
    print(f"  Is valid hex: True")
except:
    print(f"  Is valid hex: False")

session.close()
