from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.race import RaceStatus


class PostBase(BaseModel):
    label: str
    map_x: int | None = None
    map_y: int | None = None


class PostCreate(PostBase):
    pass


class PostRead(PostBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    race_id: int


class PostUpdate(BaseModel):
    label: str | None = None
    map_x: int | None = None
    map_y: int | None = None


class RaceBase(BaseModel):
    name: str
    venue: str
    scheduled_at: datetime


class RaceCreate(RaceBase):
    pass


class RaceRead(RaceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: RaceStatus
    created_at: datetime
    posts: list[PostRead] = []


class RaceUpdate(BaseModel):
    name: str | None = None
    venue: str | None = None
    scheduled_at: datetime | None = None
    status: RaceStatus | None = None
