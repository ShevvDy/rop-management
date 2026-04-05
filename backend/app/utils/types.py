from typing import Any


DictStrAny = dict[str, Any]
CourseKey = int | str
CourseEdge = dict[str, CourseKey]
CourseNodes = dict[CourseKey, DictStrAny]
