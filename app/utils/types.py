from typing import Any

from sqlalchemy import BinaryExpression, BooleanClauseList


DictStrAny = dict[str, Any]
WhereClause = BinaryExpression | BooleanClauseList
