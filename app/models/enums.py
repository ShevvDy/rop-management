class ChoiceEnum:
    __slots__ = ()

    def __init_subclass__(cls, **kwargs):
        """Автоматически создает атрибуты класса из __slots__"""
        super().__init_subclass__(**kwargs)
        for value in cls.__slots__:
            setattr(cls, value, value)

    @classmethod
    def choices(cls) -> dict[str, str]:
        """Возвращает словарь choices для использования в neomodel StringProperty"""
        return {v: v for v in cls.__slots__}

    @classmethod
    def values(cls) -> list[str]:
        """Возвращает список всех значений"""
        return list(cls.__slots__)

    @classmethod
    def has_value(cls, value: str) -> bool:
        """Проверяет существует ли значение"""
        return value in cls.__slots__


class EducationLevel(ChoiceEnum):
    """Уровень образования"""
    __slots__ = ("bachelor", "master", "phd")


class EducationForm(ChoiceEnum):
    """Форма обучения"""
    __slots__ = ("offline", "online", "combined")


class EducationLang(ChoiceEnum):
    """Язык обучения"""
    __slots__ = ("ru", "en")


class StudentStatus(ChoiceEnum):
    """Статус студента"""
    __slots__ = ("send_down", "academic_leave")
