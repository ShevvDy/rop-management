import re
from datetime import date, datetime, time, timedelta, UTC
from enum import Enum
from typing import Optional, Any

from neomodel import AsyncStructuredNode, adb, AsyncRelationshipManager, AsyncNodeSet, AsyncOne, AsyncZeroOrMore, AsyncZeroOrOne
from neomodel.exceptions import DoesNotExist
from neomodel.properties import Property

from ..exceptions import NotFoundException
from ..utils.types import DictStrAny


class BaseNode(AsyncStructuredNode):
    """
    Базовый класс для всех узлов Neo4j.
    Аналог Base класса для SQLAlchemy.
    """
    __abstract_node__ = True

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._relations = {}

    def __getattr__(self, item):
        """Переопределяем доступ к атрибутам для загрузки связей по требованию"""
        if item in self._relations:
            return self._relations[item]
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{item}'. If it's a relation, load it firstly")

    async def load_relations(self, *relations: str) -> None:
        """Загружает указанные связи для узла"""
        for relation in relations:
            sub_relations = relation.split('.', maxsplit=1)
            rel_name = sub_relations[0]
            rel_field = f"{rel_name}_rel"
            if rel_name in self._relations:
                if len(sub_relations) > 1:
                    relation_model = self._relations[rel_name]
                    if isinstance(relation_model, list):
                        for item in relation_model:
                            await item.load_relations(sub_relations[1])
                    else:
                        await relation_model.load_relations(sub_relations[1])
                continue
            if hasattr(self, rel_field):
                manager = getattr(self, rel_field)
                if isinstance(manager, AsyncRelationshipManager):
                    if isinstance(manager, AsyncZeroOrMore):
                        values = await manager.all()
                        if len(sub_relations) > 1:
                            for item in values:
                                await item.load_relations(sub_relations[1])
                    elif isinstance(manager, AsyncZeroOrOne) or isinstance(manager, AsyncOne):
                        values = await manager.single()
                        if len(sub_relations) > 1 and values:
                            await values.load_relations(sub_relations[1])
                    else:
                        raise ValueError(f"Unsupported relationship cardinality for {rel_name}: {manager.__class__.__name__}")
                    self._relations[rel_name] = values
                    continue
            raise AttributeError(f"Relation '{rel_name}' not found in {self.__class__.__name__}")

    async def refresh(self) -> None:
        self._relations = {}
        await super().refresh()

    @classmethod
    def _get_pk_name(cls) -> str:
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', cls.__name__)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower() + '_id'

    @property
    def pk_value(self) -> int:
        return getattr(self, self._get_pk_name())

    @staticmethod
    def now() -> datetime:
        """Возвращает текущее время (MSK, UTC+3)"""
        return datetime.now(UTC).replace(microsecond=0, tzinfo=None) + timedelta(hours=3)

    @staticmethod
    def today() -> date:
        """Возвращает текущую дату (MSK, UTC+3)"""
        now = datetime.now(UTC) + timedelta(hours=3)
        return now.date()

    @classmethod
    async def _get_next_id(cls) -> int:
        """
        Генерирует следующий ID для модели.
        Находит максимальный ID и возвращает ID+1.
        """
        pk_name = cls._get_pk_name()

        # Cypher запрос для получения максимального ID
        query = f"MATCH (n:{cls.__name__}) RETURN MAX(n.{pk_name}) as max_id"
        results, _ = await adb.cypher_query(query)

        if results and results[0][0] is not None:
            return results[0][0] + 1
        return 1

    @classmethod
    async def get_by_id(cls, item_id: int, relations: list[str] | None = None) -> Optional['BaseNode']:
        """
        Получить узел по ID.

        Args:
            item_id: Значение ID узла (например, faculty_id)
            relations: Список связей для загрузки (fetch_relations)

        Returns:
            Экземпляр узла

        Raises:
            NotFoundException: Если узел не найден
        """
        pk_name = cls._get_pk_name()

        try:
            # Используем поле ID модели (например, faculty_id)
            filter_kwargs = {pk_name: item_id}
            node = await cls.nodes.get(**filter_kwargs)

            # Загрузка связей если указаны
            if relations:
                await node.load_relations(*relations)

            return node
        except DoesNotExist:
            raise NotFoundException(f'{cls.__name__} с id {item_id} не найден')

    @staticmethod
    def _to_dict_value(value: Any) -> Any:
        """Конвертирует значение в JSON-сериализуемый формат"""
        if isinstance(value, date):
            return value.isoformat()
        if isinstance(value, datetime):
            return value.replace(microsecond=0).isoformat()
        if isinstance(value, time):
            return value.strftime("%H:%M")
        if isinstance(value, Enum):
            return value.name
        if hasattr(value, "to_dict"):
            return value.to_dict()
        if isinstance(value, list):
            return [BaseNode._to_dict_value(v) for v in value]
        return value

    async def to_dict(self, properties: list[str] | None = None, relations: list[str] | None = None) -> DictStrAny:
        """
        Конвертирует узел в словарь.

        Args:
            properties: Список свойств для включения (None = все)
            relations: Список связей для включения (None = все)

        Returns:
            Словарь с данными узла
        """
        result = {}

        # Получаем все свойства узла
        if properties is None:
            properties = []
            for attr_name in dir(self.__class__):
                if attr_name.startswith('_'):
                    continue
                attr = getattr(self.__class__, attr_name, None)
                # Проверяем что это Property, а не связь или метод
                if isinstance(attr, Property):
                    properties.append(attr_name)

        # Добавляем свойства
        for prop in properties:
            if hasattr(self, prop):
                value = getattr(self, prop)
                # Пропускаем методы
                if not callable(value):
                    result[prop] = self._to_dict_value(value)

        # Добавляем связи если указаны
        if relations:
            await self.load_relations(*relations)

        return result

    @classmethod
    async def get_list(
        cls,
        skip: int = 0,
        limit: int | None = None,
        order_by: str | None = None,
        filters: dict[str, Any] | None = None,
        relations: list[str] | None = None,
    ) -> list['BaseNode']:
        """
        Получить список узлов с фильтрацией и пагинацией.

        Args:
            skip: Количество пропускаемых записей
            limit: Максимальное количество записей
            order_by: Поле для сортировки (например, 'uid', '-created_at')
            filters: Словарь фильтров {property: value}
            relations: Список связей для загрузки

        Returns:
            Список узлов
        """
        query: AsyncNodeSet = cls.nodes  # noqa F821

        # Применяем фильтры
        if filters:
            query.filter(**filters)

        # Сортировка
        if not order_by:
            order_by = cls._get_pk_name()  # Сортируем по ID по умолчанию
        query.order_by(order_by)

        # Пагинация
        query.skip = skip
        if limit is not None:
            query.limit = limit

        # Получаем результаты
        nodes = await query.all()

        # Загружаем связи если указаны
        if relations:
            for node in nodes:
                await node.load_relations(*relations)

        return nodes

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        """Хук перед созданием узла"""
        pass

    async def _after_creation(self, data: DictStrAny) -> None:
        """Хук после создания узла"""
        pass

    @classmethod
    async def create_node(cls, data: DictStrAny) -> 'BaseNode':
        """
        Создать новый узел.

        Args:
            data: Словарь с данными узла

        Returns:
            Созданный узел
        """
        await cls._before_creation(data)

        pk_name = cls._get_pk_name()
        # Генерируем ID если не указан
        data[pk_name] = await cls._get_next_id()
        # Создаём узел
        node = cls(**data)
        await node.save()

        await node._after_creation(data)
        return node

    async def _before_update(self, data: DictStrAny) -> None:
        """Хук перед обновлением узла"""
        pass

    def _update_simple_fields(self, data: DictStrAny) -> None:
        """Обновляет простые поля узла"""
        for key, value in data.items():
            if hasattr(self, key):
                attr = getattr(self.__class__, key, None)
                # Проверяем что это Property, а не связь
                if isinstance(attr, Property):
                    setattr(self, key, value)

    async def _after_update(self, data: DictStrAny) -> None:
        """Хук после обновления узла"""
        pass

    @classmethod
    async def update_node(cls, item_id: int, data: DictStrAny) -> 'BaseNode':
        """
        Обновить узел по ID.

        Args:
            item_id: ID узла
            data: Словарь с новыми данными

        Returns:
            Обновлённый узел
        """
        node = await cls.get_by_id(item_id)
        await node._before_update(data)
        node._update_simple_fields(data)
        if hasattr(node, 'updated_at'):
            node.updated_at = cls.now()
        await node.save()
        await node._after_update(data)
        return node

    async def _before_delete(self) -> None:
        """Хук перед удалением узла"""
        pass

    @classmethod
    async def delete_by_id(cls, item_id: int) -> DictStrAny:
        """
        Удалить узел по ID.

        Args:
            item_id: ID узла

        Returns:
            Данные удалённого узла в виде словаря
        """
        node = await cls.get_by_id(item_id)
        # Сохраняем данные перед удалением
        node_data = await node.to_dict()
        await node._before_delete()
        await node.delete()
        return node_data
