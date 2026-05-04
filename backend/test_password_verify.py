import hashlib
from app.core.security import verify_password

password = "123456789"
stored_hash = "15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225"

# Teste 1: SHA256 simples
sha256_hash = hashlib.sha256(password.encode()).hexdigest()
print(f"Senha: {password}")
print(f"Hash SHA256 calculado: {sha256_hash}")
print(f"Hash armazenado: {stored_hash}")
print(f"SHA256 match: {sha256_hash == stored_hash}")

# Teste 2: Verificar se é válido como bcrypt
try:
    bcrypt_result = verify_password(password, stored_hash)
    print(f"\nTentativa bcrypt: {bcrypt_result}")
except Exception as e:
    print(f"\nErro bcrypt: {e}")

# Teste 3: Função simple_verify (que deve ser usada)
def simple_verify(plain_password: str, hashed_password: str) -> bool:
    """Verifica senha com SHA256 - TEMPORÁRIO PARA TESTES"""
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

simple_result = simple_verify(password, stored_hash)
print(f"\nSimple verify result: {simple_result}")

# Teste 4: Verificar comprimento e caracteres do hash
print(f"\nHash length: {len(stored_hash)}")
print(f"All hex chars: {all(c in '0123456789abcdef' for c in stored_hash)}")
