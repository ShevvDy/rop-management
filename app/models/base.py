from datetime import date, datetime, time, timedelta, UTC
from enum import Enum
from typing import Optional, Any

from sqlalchemy import Column, Table, select, and_, inspect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

from ..exceptions import NotFoundException
from ..utils.types import WhereClause, DictStrAny


class Base(DeclarativeBase):
    __abstract__ = True
    __table__: Table
    __tablename__: str

    def __init__(self, **kwargs) -> None:  # noqa
        sa_info = inspect(type(self))
        relationships = sa_info.relationships
        columns = self.__table__.columns
        columns_names = columns.keys()
        for column, value in kwargs.items():
            if column in columns_names or column in relationships:
                setattr(self, column, value)

    def __repr__(self) -> str:
        return f"<{self.__tablename__} {self.get_pk_value()}>"

    @staticmethod
    def now() -> datetime:
        return datetime.now(UTC).replace(microsecond=0, tzinfo=None) + timedelta(hours=3)

    @staticmethod
    def today() -> date:
        now = datetime.now(UTC) + timedelta(hours=3)
        return now.date()

    @classmethod
    def get_pk_column(cls) -> Column:
        return cls.__table__.primary_key.columns[0]

    @classmethod
    def get_pk_name(cls) -> str:
        return cls.get_pk_column().key

    def get_pk_value(self) -> int:
        return getattr(self, self.get_pk_name())

    @classmethod
    async def get_by_id(cls, session: AsyncSession, item_id: int) -> Optional['Base']:
        query = select(cls).where(cls.get_pk_column() == item_id)  # noqa F821
        result = await session.execute(query)
        item = result.scalars().first()
        if item is None:
            raise NotFoundException(f'{cls.__tablename__} с id {item_id} не найден')
        return item

    @staticmethod
    def _to_dict_value(value: Any) -> Any:
        if isinstance(value, date):
            return value.isoformat()
        if isinstance(value, datetime):
            return value.replace(microsecond=0).isoformat()
        if isinstance(value, time):
            return value.strftime("%H:%M")
        if isinstance(value, Enum):
            return value.name
        if "to_dict" in dir(value):
            return value.to_dict()
        return value

    def to_dict(self, columns: list[str] = None, relations: list[str] = None) -> DictStrAny:
        cls = type(self)
        if columns is None:
            columns = self.__table__.columns.keys()
        if relations is None:
            sa_info = inspect(type(self))
            relations = sa_info.relationships.keys()
        fields = columns + relations
        result = {}
        for field in fields:
            if not hasattr(cls, field):
                continue
            value = getattr(self, field)
            result[field] = self._to_dict_value(value)
        return result

    @classmethod
    async def get_list(
        cls,
        session: AsyncSession,
        skip: int = 0,
        limit: int | None = None,
        join: list[tuple['Base', WhereClause]] | None = None,
        outer_join: list[tuple['Base', WhereClause]] | None = None,
        order_by: list[Column] | None = None,
        filters: list[WhereClause] | None = None,
    ) -> list['Base']:
        query = select(cls)
        if join is not None:
            for j in join:
                query = query.join(*j)
        if outer_join is not None:
            for j in outer_join:
                query = query.outerjoin(*j)
        if filters is not None:
            query = query.where(and_(*filters))
        if order_by is None:
            query = query.order_by(cls.get_pk_column())
        else:
            query = query.order_by(*order_by)
        query = query.offset(skip)
        if limit is not None:
            query = query.limit(limit)
        result = await session.execute(query)
        return result.scalars().all()  # noqa F821

    @classmethod
    async def _before_creation(cls, session: AsyncSession, data: DictStrAny) -> None:
        pass

    async def _after_creation(self, session: AsyncSession, data: DictStrAny) -> None:
        pass

    @classmethod
    async def create(cls, session: AsyncSession, data: DictStrAny) -> 'Base':
        await cls._before_creation(session, data)
        item = cls(**data)
        session.add(item)
        await session.flush()
        await item._after_creation(session, data)
        return item

    async def _before_update(self, session: AsyncSession, data: DictStrAny) -> None:
        pass

    def _update_simple_fields(self, data: DictStrAny) -> None:
        columns = self.__table__.columns
        for column in columns.keys():
            if column in data:
                setattr(self, column, data[column])

    async def _after_update(self, session: AsyncSession, data: DictStrAny) -> None:
        pass

    @classmethod
    async def update(cls, session: AsyncSession, item_id: int, data: DictStrAny) -> 'Base':
        item = await cls.get_by_id(session, item_id)
        await item._before_update(session, data)
        item._update_simple_fields(data)
        session.add(item)
        await session.flush()
        await item._after_update(session, data)
        return item

    async def _before_delete(self, session: AsyncSession) -> None:
        pass

    @classmethod
    async def delete(cls, session: AsyncSession, item_id: int) -> 'Base':
        item = await cls.get_by_id(session, item_id)
        await session.delete(item)
        await session.flush()
        return item
