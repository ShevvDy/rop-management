class AppException(Exception):
    """Базовое исключение приложения"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(AppException):
    """Исключение для случаев, когда запись не найдена"""
    def __init__(self, message: str = "Запись не найдена"):
        super().__init__(message, status_code=404)


class BadRequestException(AppException):
    """Исключение для неправильных параметров запроса"""
    def __init__(self, message: str = "Неправильные параметры запроса"):
        super().__init__(message, status_code=400)


class ConflictException(AppException):
    """Исключение для конфликтов (например, дубликаты)"""
    def __init__(self, message: str = "Конфликт данных"):
        super().__init__(message, status_code=409)


class ForbiddenException(AppException):
    """Исключение для запрещенных операций"""
    def __init__(self, message: str = "Доступ запрещен"):
        super().__init__(message, status_code=403)


class UnauthorizedException(AppException):
    """Исключение для неавторизованных запросов"""
    def __init__(self, message: str = "Требуется авторизация"):
        super().__init__(message, status_code=401)


class UniqueConstraintException(ConflictException):
    """Исключение для нарушения уникальности"""
    def __init__(self, message: str = "Запись с такими данными уже существует"):
        super().__init__(message)


class ForeignKeyException(BadRequestException):
    """Исключение для нарушения внешних ключей"""
    def __init__(self, message: str = "Ссылка на несуществующую запись"):
        super().__init__(message)
