from fastapi import APIRouter
from .data import list_articles

router = APIRouter()


@router.get("/articles")
def get_articles(limit: int = 30, days_back: int = 1):
    return list_articles(limit=limit, days_back=days_back)
