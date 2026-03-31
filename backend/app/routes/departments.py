from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from typing import List

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("", response_model=List[DepartmentRead])
async def get_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    departments = db.query(Department).offset(skip).limit(limit).all()
    return departments


@router.get("/{department_id}", response_model=DepartmentRead)
async def get_department(department_id: int, db: Session = Depends(get_db)):
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.post("", response_model=DepartmentRead)
async def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    new_department = Department(**department.dict())
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    return new_department


@router.put("/{department_id}", response_model=DepartmentRead)
async def update_department(
    department_id: int,
    department_update: DepartmentUpdate,
    db: Session = Depends(get_db),
):
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    update_data = department_update.dict(exclude_unset=True)

    if "name" in update_data:
        existing = (
            db.query(Department)
            .filter(Department.name == update_data["name"], Department.id != department_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Department name already exists")

    for key, value in update_data.items():
        setattr(department, key, value)

    db.commit()
    db.refresh(department)
    return department


@router.delete("/{department_id}")
async def delete_department(department_id: int, db: Session = Depends(get_db)):
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db.delete(department)
    db.commit()
    return {"message": "Department deleted"}
