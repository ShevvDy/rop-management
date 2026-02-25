from neomodel import (
    ArrayProperty,
    DateProperty,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
)

from ..base_node import BaseNode


class Checkpoint(BaseNode):
    """
    Контрольная точка в рамках потока.
    Представляет собой событие/занятие с материалами и заметками.
    """

    checkpoint_id = IntegerProperty(unique_index=True)  # Уникальный идентификатор контрольной точки
    checkpoint_date = DateProperty()  # NULL если дата не определена
    materials = ArrayProperty(StringProperty(), default=[])  # Массив ссылок на материалы
    notes = StringProperty()  # Заметки/комментарии

    # Связи (исходящие)
    stream_rel = AsyncRelationshipTo(
        ".stream.Stream",
        "CHECKPOINT_IN_STREAM"
    )

    tags_rel = AsyncRelationshipTo(
        ".tag.Tag",
        "HAS_TAG"
    )



