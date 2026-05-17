"""
Race and post CRUD — admin only.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.race import Race, Post, RaceStatus
from app.schemas.race import RaceCreate, RaceRead, RaceUpdate, PostCreate, PostRead, PostUpdate

router = APIRouter(prefix="/races", tags=["races"])


async def _get_race_with_posts(db: AsyncSession, race_id: int) -> Race:
    result = await db.execute(
        select(Race).options(selectinload(Race.posts)).where(Race.id == race_id)
    )
    race = result.scalar_one_or_none()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    return race


@router.post("/", response_model=RaceRead, status_code=status.HTTP_201_CREATED)
async def create_race(body: RaceCreate, db: AsyncSession = Depends(get_db)):
    race = Race(**body.model_dump())
    db.add(race)
    await db.commit()
    return await _get_race_with_posts(db, race.id)


@router.get("/", response_model=list[RaceRead])
async def list_races(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Race).options(selectinload(Race.posts)).order_by(Race.scheduled_at.desc())
    )
    return result.scalars().all()


@router.get("/{race_id}", response_model=RaceRead)
async def get_race(race_id: int, db: AsyncSession = Depends(get_db)):
    return await _get_race_with_posts(db, race_id)


@router.patch("/{race_id}", response_model=RaceRead)
async def update_race(race_id: int, body: RaceUpdate, db: AsyncSession = Depends(get_db)):
    race = await _get_race_with_posts(db, race_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(race, field, value)
    await db.commit()
    return await _get_race_with_posts(db, race_id)


@router.post("/{race_id}/start", response_model=RaceRead)
async def start_race(race_id: int, db: AsyncSession = Depends(get_db)):
    race = await _get_race_with_posts(db, race_id)
    if race.status != RaceStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Race is not in DRAFT status")
    race.status = RaceStatus.ACTIVE
    await db.commit()
    return await _get_race_with_posts(db, race_id)


@router.post("/{race_id}/finish", response_model=RaceRead)
async def finish_race(race_id: int, db: AsyncSession = Depends(get_db)):
    race = await _get_race_with_posts(db, race_id)
    if race.status != RaceStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Race is not ACTIVE")
    race.status = RaceStatus.FINISHED
    await db.commit()
    return await _get_race_with_posts(db, race_id)


# --- Posts ---

@router.post("/{race_id}/posts", response_model=PostRead, status_code=status.HTTP_201_CREATED)
async def create_post(race_id: int, body: PostCreate, db: AsyncSession = Depends(get_db)):
    race = await db.get(Race, race_id)
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    post = Post(race_id=race_id, **body.model_dump())
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


@router.get("/{race_id}/posts", response_model=list[PostRead])
async def list_posts(race_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Post).where(Post.race_id == race_id))
    return result.scalars().all()


@router.patch("/{race_id}/posts/{post_id}", response_model=PostRead)
async def update_post(race_id: int, post_id: int, body: PostUpdate, db: AsyncSession = Depends(get_db)):
    post = await db.get(Post, post_id)
    if not post or post.race_id != race_id:
        raise HTTPException(status_code=404, detail="Post not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(post, field, value)
    await db.flush()
    await db.refresh(post)
    return post


@router.delete("/{race_id}/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(race_id: int, post_id: int, db: AsyncSession = Depends(get_db)):
    post = await db.get(Post, post_id)
    if not post or post.race_id != race_id:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
    await db.flush()
