from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    name: str = Field(..., description="Имя пользователя")
    surname: str = Field(..., description="Фамилия пользователя")
    patronymic: Optional[str] = Field(None, description="Отчество пользователя")
    email: Optional[EmailStr] = Field(None, description="Email пользователя")
    phone: Optional[str] = Field(None, description="Телефон пользователя")
    isu_id: Optional[int] = Field(None, description="ID пользователя в ИСУ")
    avatar: Optional[str] = Field(None, description="URL аватара пользователя")


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Имя пользователя")
    surname: Optional[str] = Field(None, description="Фамилия пользователя")
    patronymic: Optional[str] = Field(None, description="Отчество пользователя")
    email: Optional[EmailStr] = Field(None, description="Email пользователя")
    phone: Optional[str] = Field(None, description="Телефон пользователя")
    isu_id: Optional[int] = Field(None, description="ID пользователя в ИСУ")
    avatar: Optional[str] = Field(None, description="URL аватара пользователя")


class UserResponse(UserBase):
    user_id: int

    class Config:
        from_attributes = True
