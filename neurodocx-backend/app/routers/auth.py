import re
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db, User
from ..auth import hash_password, verify_password, create_access_token, get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str


class PasswordCheckRequest(BaseModel):
    password: str


class PasswordGenRequest(BaseModel):
    length: int = 16
    include_symbols: bool = True
    include_numbers: bool = True
    include_uppercase: bool = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def check_password_strength(password: str) -> dict:
    score = 0
    feedback = []

    if len(password) >= 8:
        score += 1
    else:
        feedback.append("Use at least 8 characters")

    if len(password) >= 12:
        score += 1

    if re.search(r'[A-Z]', password):
        score += 1
    else:
        feedback.append("Add uppercase letters")

    if re.search(r'[a-z]', password):
        score += 1
    else:
        feedback.append("Add lowercase letters")

    if re.search(r'\d', password):
        score += 1
    else:
        feedback.append("Add numbers")

    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1
    else:
        feedback.append("Add special characters (!@#$...)")

    if not re.search(r'(.)\1{2,}', password):
        score += 1
    else:
        feedback.append("Avoid repeating characters")

    levels = {7: "Very Strong", 6: "Strong", 5: "Good", 4: "Fair", 3: "Weak", 2: "Very Weak", 1: "Very Weak", 0: "Very Weak"}
    colors = {"Very Strong": "green", "Strong": "green", "Good": "blue", "Fair": "yellow", "Weak": "orange", "Very Weak": "red"}
    level = levels.get(score, "Very Weak")

    return {
        "score": score,
        "max_score": 7,
        "level": level,
        "color": colors[level],
        "percentage": round((score / 7) * 100),
        "feedback": feedback,
    }


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', req.email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    strength = check_password_strength(req.password)
    if strength["score"] < 5:
        tips = ". ".join(strength["feedback"])
        raise HTTPException(
            status_code=400,
            detail=f"Password too weak ({strength['level']}). {tips}"
        )

    user = User(
        email=req.email,
        username=req.username,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "username": user.username},
    }


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "username": user.username},
    }


@router.post("/password/check")
def password_check(req: PasswordCheckRequest):
    return check_password_strength(req.password)


@router.post("/password/generate")
def password_generate(req: PasswordGenRequest):
    if req.length < 8 or req.length > 64:
        raise HTTPException(status_code=400, detail="Length must be between 8 and 64")

    chars = string.ascii_lowercase
    required = [secrets.choice(string.ascii_lowercase)]

    if req.include_uppercase:
        chars += string.ascii_uppercase
        required.append(secrets.choice(string.ascii_uppercase))
    if req.include_numbers:
        chars += string.digits
        required.append(secrets.choice(string.digits))
    if req.include_symbols:
        symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        chars += symbols
        required.append(secrets.choice(symbols))

    remaining = req.length - len(required)
    password_chars = required + [secrets.choice(chars) for _ in range(remaining)]
    secrets.SystemRandom().shuffle(password_chars)
    password = "".join(password_chars)

    return {
        "password": password,
        "strength": check_password_strength(password),
    }


@router.post("/password/change")
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    strength = check_password_strength(req.new_password)
    if strength["score"] < 3:
        raise HTTPException(status_code=400, detail=f"New password too weak. {'. '.join(strength['feedback'])}")

    current_user.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
