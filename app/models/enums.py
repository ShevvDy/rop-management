from enum import Enum


class StrEnum(str, Enum):
    pass

class EducationLevel(StrEnum):
    bachelor = "bachelor"
    master = "master"
    phd = "phd"

class EducationForm(StrEnum):
    offline = "offline"
    online = "online"
    combined = "combined"

class EducationLang(StrEnum):
    ru = "ru"
    en = "en"

class StudentStatus(StrEnum):
    send_down = "send_down"
    academic_leave = "academic_leave"
    transferred_from = "transferred_from"
    transferred_to = "transferred_to"

class TeacherPosition(StrEnum):
    """Возможно, стоит вынести в таблицу"""
    junior = "junior"
    middle = "middle"
    senior = "senior"
