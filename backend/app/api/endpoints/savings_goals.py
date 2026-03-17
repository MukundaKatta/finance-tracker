from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.savings_goal import SavingsGoal
from app.schemas.savings_goal import SavingsGoalCreate, SavingsGoalUpdate, SavingsGoalResponse, SavingsGoalWithProgress

router = APIRouter()


@router.get("/", response_model=list[SavingsGoalWithProgress])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavingsGoal).where(SavingsGoal.user_id == current_user.id).order_by(SavingsGoal.created_at)
    )
    goals = result.scalars().all()
    enriched = []
    for g in goals:
        target = float(g.target_amount)
        current = float(g.current_amount)
        percentage = (current / target * 100) if target > 0 else 0
        remaining = max(0, target - current)
        days_left = None
        monthly_needed = None
        if g.target_date:
            delta = (g.target_date - date.today()).days
            days_left = max(0, delta)
            months_left = max(1, delta / 30)
            monthly_needed = round(remaining / months_left, 2) if remaining > 0 else 0

        enriched.append(
            SavingsGoalWithProgress(
                id=g.id,
                name=g.name,
                target_amount=target,
                current_amount=current,
                target_date=g.target_date,
                icon=g.icon,
                color=g.color,
                created_at=g.created_at,
                percentage=round(percentage, 1),
                remaining=remaining,
                days_left=days_left,
                monthly_needed=monthly_needed,
            )
        )
    return enriched


@router.post("/", response_model=SavingsGoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_in: SavingsGoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    goal = SavingsGoal(user_id=current_user.id, **goal_in.model_dump())
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return goal


@router.patch("/{goal_id}", response_model=SavingsGoalResponse)
async def update_goal(
    goal_id: int,
    goal_in: SavingsGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavingsGoal).where(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    for field, value in goal_in.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    await db.flush()
    await db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavingsGoal).where(SavingsGoal.id == goal_id, SavingsGoal.user_id == current_user.id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    await db.delete(goal)
