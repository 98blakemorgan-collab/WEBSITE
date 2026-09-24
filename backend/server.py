from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import secrets
import base64
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import jwt
import bcrypt
import stripe
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Response, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
CURRENCY = "aud"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("plantagenet")

app = FastAPI(title="Plantagenet Players")
api = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_utc():
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": now_utc() + timedelta(days=7), "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="lax", max_age=7 * 24 * 3600, path="/",
    )


def public_user(u: dict) -> dict:
    return {
        "id": u["id"], "email": u["email"], "name": u.get("name", ""),
        "role": u.get("role", "member"),
        "membership_type": u.get("membership_type"),
        "membership_status": u.get("membership_status", "none"),
        "membership_expiry": u.get("membership_expiry"),
        "interests": u.get("interests", []),
        "phone": u.get("phone", ""),
        "created_at": u.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TicketTier(BaseModel):
    name: str
    price: float
    capacity: int


class CastMember(BaseModel):
    actor: str = ""
    role: str = ""


class CrewMember(BaseModel):
    name: str = ""
    role: str = ""


class ShowIn(BaseModel):
    title: str
    tagline: Optional[str] = ""
    description: str
    genre: Optional[str] = "Community Production"
    poster_url: Optional[str] = ""
    venue: Optional[str] = "Plantagenet Hall, Mount Barker"
    status: str = "upcoming"  # upcoming | current | past
    performances: List[str] = []  # ISO datetime strings
    ticket_tiers: List[TicketTier] = []
    director: Optional[str] = ""
    duration: Optional[str] = ""
    synopsis: Optional[str] = ""
    cast: List[CastMember] = []
    crew: List[CrewMember] = []


class CheckoutIn(BaseModel):
    show_id: str
    tier_name: str
    quantity: int = Field(1, ge=1, le=20)
    origin_url: str
    buyer_name: Optional[str] = ""
    buyer_email: Optional[str] = ""
    marketing_opt_in: bool = False


class MembershipApplyIn(BaseModel):
    membership_type: str  # On Stage | Backstage | Technical | Front of House | Patron
    interests: List[str] = []
    message: Optional[str] = ""


class MemberUpdateIn(BaseModel):
    membership_status: Optional[str] = None
    membership_type: Optional[str] = None
    membership_expiry: Optional[str] = None
    role: Optional[str] = None


class ContentIn(BaseModel):
    data: dict


class CampaignIn(BaseModel):
    subject: str
    body: str
    audience: str = "all"  # all | active | On Stage | Backstage | Technical | Front of House


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()), "email": email, "name": data.name.strip(),
        "phone": data.phone or "", "password_hash": hash_password(data.password),
        "role": "member", "membership_type": None, "membership_status": "none",
        "membership_expiry": None, "interests": [], "created_at": now_utc().isoformat(),
    }
    await db.users.insert_one(user)
    token = create_access_token(user["id"], email, "member")
    set_auth_cookie(response, token)
    return {"token": token, "user": public_user(user)}


@api.post("/auth/login")
async def login(data: LoginIn, response: Response):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email, user.get("role", "member"))
    set_auth_cookie(response, token)
    return {"token": token, "user": public_user(user)}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Shows (public read, admin write)
# ---------------------------------------------------------------------------
async def enrich_show(show: dict) -> dict:
    sold = await db.tickets.aggregate([
        {"$match": {"show_id": show["id"]}},
        {"$group": {"_id": "$tier_name", "sold": {"$sum": "$quantity"}}},
    ]).to_list(100)
    sold_map = {s["_id"]: s["sold"] for s in sold}
    for tier in show.get("ticket_tiers", []):
        tier["sold"] = sold_map.get(tier["name"], 0)
        tier["available"] = max(tier.get("capacity", 0) - tier["sold"], 0)
    return show


@api.get("/shows")
async def list_shows(status: Optional[str] = None):
    q = {}
    if status:
        q["status"] = status
    shows = await db.shows.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [await enrich_show(s) for s in shows]


@api.get("/shows/{show_id}")
async def get_show(show_id: str):
    show = await db.shows.find_one({"id": show_id}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    return await enrich_show(show)


@api.post("/admin/shows")
async def create_show(data: ShowIn, admin: dict = Depends(require_admin)):
    show = data.model_dump()
    show["id"] = str(uuid.uuid4())
    show["created_at"] = now_utc().isoformat()
    await db.shows.insert_one(show)
    return await enrich_show({k: v for k, v in show.items() if k != "_id"})


@api.put("/admin/shows/{show_id}")
async def update_show(show_id: str, data: ShowIn, admin: dict = Depends(require_admin)):
    existing = await db.shows.find_one({"id": show_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Show not found")
    update = data.model_dump()
    await db.shows.update_one({"id": show_id}, {"$set": update})
    show = await db.shows.find_one({"id": show_id}, {"_id": 0})
    return await enrich_show(show)


@api.delete("/admin/shows/{show_id}")
async def delete_show(show_id: str, admin: dict = Depends(require_admin)):
    await db.shows.delete_one({"id": show_id})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Payments / Tickets
# ---------------------------------------------------------------------------
async def issue_tickets(txn: dict):
    """Create ticket records after a paid transaction (idempotent)."""
    if await db.tickets.find_one({"session_id": txn["session_id"]}):
        return
    show = await db.shows.find_one({"id": txn["show_id"]}, {"_id": 0})
    show_title = show["title"] if show else "Show"
    for i in range(txn["quantity"]):
        await db.tickets.insert_one({
            "id": str(uuid.uuid4()),
            "code": "PP-" + secrets.token_hex(4).upper(),
            "session_id": txn["session_id"],
            "user_id": txn.get("user_id"),
            "buyer_email": txn.get("buyer_email"),
            "show_id": txn["show_id"],
            "show_title": show_title,
            "tier_name": txn["tier_name"],
            "quantity": 1,
            "unit_price": txn["unit_price"],
            "created_at": now_utc().isoformat(),
        })


@api.post("/payments/checkout")
async def create_checkout(data: CheckoutIn, request: Request):
    show = await db.shows.find_one({"id": data.show_id}, {"_id": 0})
    if not show:
        raise HTTPException(status_code=404, detail="Show not found")
    tier = next((t for t in show.get("ticket_tiers", []) if t["name"] == data.tier_name), None)
    if not tier:
        raise HTTPException(status_code=400, detail="Ticket tier not found")

    # optional user (guest checkout allowed)
    user = None
    try:
        user = await get_current_user(request)
    except HTTPException:
        pass

    buyer_email = (user or {}).get("email") or (data.buyer_email or "").lower().strip() or None
    buyer_name = (user or {}).get("name") or data.buyer_name or ""
    if data.marketing_opt_in and buyer_email:
        await db.marketing_contacts.update_one(
            {"email": buyer_email},
            {"$set": {"email": buyer_email, "name": buyer_name, "opt_in": True,
                      "source": "ticket_purchase", "updated_at": now_utc().isoformat()}},
            upsert=True,
        )
    unit_price = float(tier["price"])
    session = stripe.checkout.Session.create(
        line_items=[{
            "price_data": {
                "currency": CURRENCY,
                "product_data": {"name": f"{show['title']} — {tier['name']}"},
                "unit_amount": int(round(unit_price * 100)),
            },
            "quantity": data.quantity,
        }],
        mode="payment",
        success_url=f"{data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{data.origin_url}/payment/cancel",
        metadata={"show_id": data.show_id, "tier_name": data.tier_name,
                  "user_id": (user or {}).get("id", "")},
    )
    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": (user or {}).get("id"),
        "buyer_email": buyer_email,
        "buyer_name": buyer_name,
        "marketing_opt_in": bool(data.marketing_opt_in),
        "show_id": data.show_id,
        "show_title": show["title"],
        "tier_name": data.tier_name,
        "quantity": data.quantity,
        "unit_price": unit_price,
        "amount": unit_price * data.quantity,
        "currency": CURRENCY,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "updated_at": now_utc().isoformat()}},
                )
                record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
                await issue_tickets(record)
        except stripe.error.StripeError:
            pass
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"], "show_title": record.get("show_title"),
            "quantity": record.get("quantity"), "amount": record.get("amount")}


@api.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": obj.get("payment_status", "paid"),
                      "updated_at": now_utc().isoformat()}},
        )
        rec = await db.payment_transactions.find_one({"session_id": obj["id"]}, {"_id": 0})
        if rec and rec.get("payment_status") == "paid":
            await issue_tickets(rec)
    return {"status": "ok"}


@api.get("/tickets/my")
async def my_tickets(user: dict = Depends(get_current_user)):
    tickets = await db.tickets.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return tickets


# ---------------------------------------------------------------------------
# Membership
# ---------------------------------------------------------------------------
@api.post("/membership/apply")
async def apply_membership(data: MembershipApplyIn, user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": user["id"]}, {"$set": {
        "membership_type": data.membership_type,
        "interests": data.interests,
        "membership_status": "pending",
        "membership_message": data.message,
        "applied_at": now_utc().isoformat(),
    }})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return public_user(updated)


# ---------------------------------------------------------------------------
# Admin: members
# ---------------------------------------------------------------------------
@api.get("/admin/members")
async def admin_members(admin: dict = Depends(require_admin)):
    members = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return members


@api.put("/admin/members/{member_id}")
async def admin_update_member(member_id: str, data: MemberUpdateIn, admin: dict = Depends(require_admin)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users.update_one({"id": member_id}, {"$set": update})
    m = await db.users.find_one({"id": member_id}, {"_id": 0, "password_hash": 0})
    return m


@api.delete("/admin/members/{member_id}")
async def admin_delete_member(member_id: str, admin: dict = Depends(require_admin)):
    target = await db.users.find_one({"id": member_id})
    if target and target.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete an admin account")
    await db.users.delete_one({"id": member_id})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Admin: tickets & payments
# ---------------------------------------------------------------------------
@api.get("/admin/tickets")
async def admin_tickets(admin: dict = Depends(require_admin)):
    return await db.tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)


@api.get("/admin/transactions")
async def admin_transactions(admin: dict = Depends(require_admin)):
    return await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)


# ---------------------------------------------------------------------------
# Editable site content (CMS)
# ---------------------------------------------------------------------------
@api.get("/content")
async def get_all_content():
    docs = await db.site_content.find({}, {"_id": 0}).to_list(100)
    return {d["key"]: d["data"] for d in docs}


@api.get("/content/{key}")
async def get_content_key(key: str):
    doc = await db.site_content.find_one({"key": key}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Content not found")
    return doc["data"]


@api.put("/admin/content/{key}")
async def update_content(key: str, body: ContentIn, admin: dict = Depends(require_admin)):
    await db.site_content.update_one(
        {"key": key}, {"$set": {"key": key, "data": body.data, "updated_at": now_utc().isoformat()}}, upsert=True
    )
    return {"key": key, "data": body.data}


# ---------------------------------------------------------------------------
# Media: image upload + library
# ---------------------------------------------------------------------------
VENUE_PHOTOS = [
    "/venue/slide-3.jpg", "/venue/slide-4.jpg", "/venue/slide-5.jpg", "/venue/slide-6.jpg",
    "/venue/slide-7.jpg", "/venue/slide-8.jpg", "/venue/slider-1.jpg", "/venue/slider-2.jpg",
    "/venue/coop.jpg", "/venue/shire.jpg", "/venue/bendigo.jpg", "/venue/lotto.jpg",
]


@api.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    content = await file.read()
    if len(content) > 6_000_000:
        raise HTTPException(status_code=400, detail="Image too large (max 6MB)")
    uid = str(uuid.uuid4())
    await db.uploads.insert_one({
        "id": uid, "content_type": file.content_type or "image/jpeg",
        "data": base64.b64encode(content).decode(), "created_at": now_utc().isoformat(),
    })
    return {"path": f"/api/uploads/{uid}"}


@api.get("/uploads/{uid}")
async def get_upload(uid: str):
    doc = await db.uploads.find_one({"id": uid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(content=base64.b64decode(doc["data"]), media_type=doc.get("content_type", "image/jpeg"))


@api.delete("/admin/uploads/{uid}")
async def delete_upload(uid: str, admin: dict = Depends(require_admin)):
    await db.uploads.delete_one({"id": uid})
    return {"ok": True}


@api.get("/admin/media")
async def list_media(admin: dict = Depends(require_admin)):
    ups = await db.uploads.find({}, {"_id": 0, "id": 1}).sort("created_at", -1).to_list(500)
    return {"photos": [f"/api/uploads/{u['id']}" for u in ups] + VENUE_PHOTOS}


# ---------------------------------------------------------------------------
# Admin: bulk email campaigns (compose + record; delivery mocked)
# ---------------------------------------------------------------------------
@api.get("/admin/campaigns")
async def list_campaigns(admin: dict = Depends(require_admin)):
    return await db.email_campaigns.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


def audience_query(audience: str):
    if audience == "all":
        return {}
    if audience == "active":
        return {"membership_status": "active"}
    return {"membership_type": audience}


@api.post("/admin/campaigns")
async def create_campaign(data: CampaignIn, admin: dict = Depends(require_admin)):
    if data.audience in ("marketing", "buyers"):
        q = {"opt_in": True} if data.audience == "marketing" else {}
        recipients = await db.marketing_contacts.find(q, {"_id": 0, "email": 1, "name": 1}).to_list(5000)
    else:
        recipients = await db.users.find(audience_query(data.audience), {"_id": 0, "email": 1, "name": 1}).to_list(5000)
    campaign = {
        "id": str(uuid.uuid4()),
        "subject": data.subject,
        "body": data.body,
        "audience": data.audience,
        "recipient_count": len(recipients),
        "recipients": [r["email"] for r in recipients],
        "status": "sent",
        "sent_by": admin["email"],
        "created_at": now_utc().isoformat(),
    }
    await db.email_campaigns.insert_one(campaign)
    logger.info(f"[BULK EMAIL - MOCK] '{data.subject}' queued to {len(recipients)} recipients ({data.audience})")
    return {k: v for k, v in campaign.items() if k != "_id"}


# ---------------------------------------------------------------------------
# Admin: dashboard stats
# ---------------------------------------------------------------------------
@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    paid = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(5000)
    revenue = sum(t.get("amount", 0) for t in paid)
    tickets_sold = await db.tickets.count_documents({})
    members = await db.users.count_documents({"role": "member"})
    active_members = await db.users.count_documents({"membership_status": "active"})
    shows_total = await db.shows.count_documents({})
    campaigns = await db.email_campaigns.count_documents({})

    # revenue per show
    by_show = {}
    for t in paid:
        by_show[t.get("show_title", "Unknown")] = by_show.get(t.get("show_title", "Unknown"), 0) + t.get("amount", 0)
    revenue_by_show = [{"show": k, "revenue": v} for k, v in by_show.items()]

    return {
        "revenue": round(revenue, 2),
        "tickets_sold": tickets_sold,
        "members": members,
        "active_members": active_members,
        "shows_total": shows_total,
        "campaigns": campaigns,
        "revenue_by_show": revenue_by_show,
    }


@api.get("/admin/contacts")
async def admin_contacts(admin: dict = Depends(require_admin)):
    return await db.marketing_contacts.find({}, {"_id": 0}).sort("updated_at", -1).to_list(5000)


@api.get("/sponsors")
async def get_sponsors():
    doc = await db.site_content.find_one({"key": "sponsors"}, {"_id": 0})
    return (doc or {}).get("data", {}).get("items", [])


@api.get("/")
async def root():
    return {"message": "Plantagenet Players API"}


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
DEFAULT_SPONSORS = [
    {"name": "Mount Barker Co-operative", "tier": "Community Partner", "logo": "/venue/coop.jpg", "url": "https://www.mtbarkercoop.com.au/"},
    {"name": "Shire of Plantagenet", "tier": "Production Partner", "logo": "/venue/shire.jpg", "url": "https://www.plantagenet.wa.gov.au/"},
    {"name": "Bendigo Bank Mount Barker", "tier": "Season Supporter", "logo": "/venue/bendigo.jpg", "url": "https://www.bendigobank.com.au/public/community/our-branches/mount-barker-wa"},
    {"name": "Lotterywest", "tier": "Major Grants Partner", "logo": "/venue/lotto.jpg", "url": "https://www.lotterywest.wa.gov.au/"},
]

DEFAULT_CONTENT = {
    "home": {
        "eyebrow": "Community Theatre since 1953",
        "title_line1": "Stories begin",
        "title_highlight": "here.",
        "subtitle": "Community-made theatre in Mount Barker. Come for the show — stay for the people, the laughter and the magic behind the curtain.",
        "slides": ["/venue/slide-4.jpg", "/venue/slider-1.jpg", "/venue/slide-7.jpg", "/venue/slide-8.jpg"],
        "find_part_title": "You don't have to act.",
        "find_part_desc": "Theatre needs all kinds of people. Experience is welcome; curiosity is enough.",
        "heritage_text": "Plantagenet Players have entertained Mount Barker and the Great Southern with variety shows, satire, melodrama, music and community productions since 1953.",
    },
    "story": {
        "hero_image": "/venue/slide-5.jpg",
        "intro": "Plantagenet Players have entertained Mount Barker and the Great Southern with variety shows, satire, melodrama, music and community productions since 1953. Today the group continues that community tradition, welcoming people on stage, backstage, in technical roles and front of house.",
        "timeline": [
            {"year": "1953", "text": "Plantagenet Players is founded, bringing live theatre to the Great Southern for the first time."},
            {"year": "1960s", "text": "The company's signature satirical variety shows become a beloved fixture of Mount Barker's social calendar."},
            {"year": "1980s", "text": "Melodramas and pantomimes draw families from across the region to Plantagenet Hall."},
            {"year": "2000s", "text": "A new generation of members takes the reins, expanding into musicals and contemporary works."},
            {"year": "Today", "text": "Over 70 years on, we continue the community tradition — welcoming people on stage, backstage, in technical roles and front of house."},
        ],
        "gallery": ["/venue/slide-8.jpg", "/venue/slide-3.jpg", "/venue/slide-4.jpg", "/venue/slider-2.jpg"],
    },
    "membership": {
        "title": "You don't have to act.",
        "description": "Theatre needs all kinds of people. Experience is welcome; curiosity is enough. Choose how you'd like to be involved.",
    },
    "contact": {
        "hall_name": "Plantagenet District Hall",
        "address": "Memorial Drive, Mount Barker WA 6324",
        "email": "boxoffice@plantagenetplayers.site",
        "phone": "(08) 9851 0000",
        "facebook": "https://www.facebook.com/plantagenetplayers",
        "abn": "",
        "venue_desc": "Plantagenet District Hall on Memorial Drive seats up to 165 with retractable theatre-style seating, an equipped stage with in-house lighting & sound, a full-service kitchen and bar with exterior serving windows, a spacious carpeted foyer and full air-conditioning. It's ideal for productions, receptions, reunions, conferences, community events and weddings.",
    },
    "documents": {"constitution_url": "", "agm_url": ""},
    "sponsors": {"items": DEFAULT_SPONSORS},
}


async def seed():
    # Admin
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": admin_email, "name": "Theatre Admin",
            "phone": "", "password_hash": hash_password(admin_password), "role": "admin",
            "membership_type": "Committee", "membership_status": "active",
            "membership_expiry": None, "interests": [], "created_at": now_utc().isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}})

    # Demo member
    if not await db.users.find_one({"email": "member@plantagenetplayers.site"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": "member@plantagenetplayers.site", "name": "Margaret Hill",
            "phone": "0400 123 456", "password_hash": hash_password("Member123!"), "role": "member",
            "membership_type": "On Stage", "membership_status": "active",
            "membership_expiry": "2026-12-31", "interests": ["Acting", "Singing"],
            "created_at": now_utc().isoformat(),
        })

    # Shows
    if await db.shows.count_documents({}) == 0:
        shows = [
            {
                "id": str(uuid.uuid4()),
                "title": "The Great Southern Satire",
                "tagline": "A riotous night of local wit and mischief",
                "description": "Our flagship variety production returns with sharp satire, live songs and community talent skewering everything from council meetings to country footy. A Plantagenet Players tradition since the 1960s.",
                "genre": "Satire & Variety",
                "poster_url": "https://images.pexels.com/photos/6896323/pexels-photo-6896323.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                "venue": "Plantagenet Hall, Mount Barker",
                "status": "current",
                "performances": ["2026-07-17T19:30:00", "2026-07-18T19:30:00", "2026-07-19T14:00:00"],
                "ticket_tiers": [
                    {"name": "Stalls", "price": 28.0, "capacity": 120},
                    {"name": "Circle", "price": 35.0, "capacity": 60},
                    {"name": "VIP Table (4)", "price": 160.0, "capacity": 10},
                ],
                "created_at": now_utc().isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Mount Barker Melodrama",
                "tagline": "Boo the villain, cheer the hero!",
                "description": "An old-fashioned melodrama in the finest community theatre tradition — twirling moustaches, damsels in distress and plenty of audience participation. Bring the whole family.",
                "genre": "Melodrama",
                "poster_url": "https://images.unsplash.com/photo-1558970439-add78fc68990?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHszfHx0aGVhdGVyJTIwcGVyZm9ybWFuY2UlMjBzdGFnZSUyMGFjdG9ycyUyMGRyYW1hJTIwc3BvdGxpZ2h0fGVufDB8fHx8MTc5MDI3NDAzN3ww&ixlib=rb-4.1.0&q=85",
                "venue": "Plantagenet Hall, Mount Barker",
                "status": "upcoming",
                "performances": ["2026-09-11T19:30:00", "2026-09-12T19:30:00"],
                "ticket_tiers": [
                    {"name": "Stalls", "price": 25.0, "capacity": 120},
                    {"name": "Circle", "price": 30.0, "capacity": 60},
                ],
                "created_at": now_utc().isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Spring Variety Show",
                "tagline": "Song, dance and a whole lot of heart",
                "description": "Our beloved annual variety spectacular featuring cast members of all ages, live music, comedy sketches and dance numbers celebrating the Great Southern spring.",
                "genre": "Musical Variety",
                "poster_url": "https://images.unsplash.com/photo-1630050525402-06c617847d27?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHw0fHx0aGVhdGVyJTIwcGVyZm9ybWFuY2UlMjBzdGFnZSUyMGFjdG9ycyUyMGRyYW1hJTIwc3BvdGxpZ2h0fGVufDB8fHx8MTc5MDI3NDAzN3ww&ixlib=rb-4.1.0&q=85",
                "venue": "Plantagenet Hall, Mount Barker",
                "status": "upcoming",
                "performances": ["2026-10-23T19:30:00", "2026-10-24T19:30:00", "2026-10-25T14:00:00"],
                "ticket_tiers": [
                    {"name": "Stalls", "price": 22.0, "capacity": 120},
                    {"name": "Family (4)", "price": 75.0, "capacity": 25},
                ],
                "created_at": now_utc().isoformat(),
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Blooming Good Show",
                "tagline": "Comedy, live songs, dance and community talent",
                "description": "Last season's sell-out celebration of local talent. Thank you to everyone who joined us — see you at the next one!",
                "genre": "Comedy Variety",
                "poster_url": "https://images.unsplash.com/photo-1503095396549-807759245b35?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTZ8MHwxfHNlYXJjaHwxfHx0aGVhdGVyJTIwcGVyZm9ybWFuY2UlMjBzdGFnZSUyMGFjdG9ycyUyMGRyYW1hJTIwc3BvdGxpZ2h0fGVufDB8fHx8MTc5MDI3NDAzN3ww&ixlib=rb-4.1.0&q=85",
                "venue": "Plantagenet Hall, Mount Barker",
                "status": "past",
                "performances": ["2026-03-14T19:30:00"],
                "ticket_tiers": [{"name": "General Admission", "price": 20.0, "capacity": 150}],
                "created_at": now_utc().isoformat(),
            },
        ]
        await db.shows.insert_many(shows)

    # Migration: point seeded shows at real Plantagenet Players photos + real venue
    poster_map = {
        "The Great Southern Satire": "/venue/slider-2.jpg",
        "Mount Barker Melodrama": "/venue/slide-6.jpg",
        "Spring Variety Show": "/venue/slide-7.jpg",
        "Blooming Good Show": "/venue/slider-1.jpg",
    }
    details_map = {
        "The Great Southern Satire": {"director": "Barbara Ellison", "duration": "2 hrs incl. interval",
            "synopsis": "A riotous night of local wit skewering everything from council meetings to country footy, stitched together with live songs and dance.",
            "cast": [{"actor": "Jill Marwick", "role": "Compère"}, {"actor": "Tom Reilly", "role": "The Mayor"}, {"actor": "The Company", "role": "Ensemble"}],
            "crew": [{"role": "Director", "name": "Barbara Ellison"}, {"role": "Lighting & Sound", "name": "Ken Doust"}]},
        "Mount Barker Melodrama": {"director": "Geoff Prosser", "duration": "1 hr 45 min",
            "synopsis": "An old-fashioned melodrama — boo the villain, cheer the hero — with plenty of audience participation for the whole family.",
            "cast": [{"actor": "David Kerr", "role": "The Villain"}, {"actor": "Sarah Lowe", "role": "The Heroine"}, {"actor": "The Nurses", "role": "Chorus"}],
            "crew": [{"role": "Director", "name": "Geoff Prosser"}, {"role": "Costumes", "name": "Margaret Hill"}]},
        "Spring Variety Show": {"director": "The Committee", "duration": "2 hrs",
            "synopsis": "Our beloved annual variety spectacular — song, dance and comedy from cast members of all ages.",
            "cast": [{"actor": "The Witches", "role": "Opening Number"}, {"actor": "Junior Players", "role": "Dance Troupe"}, {"actor": "The Company", "role": "Ensemble"}],
            "crew": [{"role": "Stage Manager", "name": "Ken Doust"}, {"role": "Musical Director", "name": "Barbara Ellison"}]},
        "Blooming Good Show": {"director": "Margaret Hill", "duration": "2 hrs incl. interval",
            "synopsis": "A festive celebration of local talent with comedy, live songs and dance.",
            "cast": [{"actor": "Santa's Helpers", "role": "Festive Ensemble"}, {"actor": "The Company", "role": "Singers & Dancers"}],
            "crew": [{"role": "Director", "name": "Margaret Hill"}, {"role": "Front of House", "name": "Tom Reilly"}]},
    }
    for title, url in poster_map.items():
        extra = details_map.get(title, {})
        await db.shows.update_one(
            {"title": title},
            {"$set": {"poster_url": url, "venue": "Plantagenet District Hall, Memorial Drive, Mount Barker",
                      "status": "past", "performances": [], **extra}},
        )

    # Editable site content (seed defaults once; admin can edit via /admin/content)
    for key, data in DEFAULT_CONTENT.items():
        if not await db.site_content.find_one({"key": key}):
            await db.site_content.insert_one({"key": key, "data": data, "updated_at": now_utc().isoformat()})


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.shows.create_index("id", unique=True)
    await db.tickets.create_index("session_id")
    await seed()
    # write test credentials
    creds = Path("/app/memory/test_credentials.md")
    creds.write_text(
        "# Test Credentials\n\n"
        f"## Admin\n- email: {os.environ['ADMIN_EMAIL']}\n- password: {os.environ['ADMIN_PASSWORD']}\n- role: admin\n\n"
        "## Demo Member\n- email: member@plantagenetplayers.site\n- password: Member123!\n- role: member\n\n"
        "## Auth endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- GET /api/auth/me\n- POST /api/auth/logout\n\n"
        "## Stripe test card\n- 4242 4242 4242 4242, any future expiry, any CVC\n"
    )
    logger.info("Startup seed complete")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
