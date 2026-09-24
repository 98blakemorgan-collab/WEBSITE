"""Backend tests for Plantagenet Players theatre management system."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://theater-hub-13.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "7yg268b5cs@privaterelay.appleid.com"
ADMIN_PASSWORD = "Plantagenet1953!"
MEMBER_EMAIL = "member@plantagenetplayers.site"
MEMBER_PASSWORD = "Member123!"


# --- fixtures ------------------------------------------------------------
@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def member_token(s):
    r = s.post(f"{API}/auth/login", json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


def H(tok):
    return {"Authorization": f"Bearer {tok}"}


# --- auth ----------------------------------------------------------------
class TestAuth:
    def test_login_admin(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["role"] == "admin"
        assert data["token"]

    def test_login_member(self, s):
        r = s.post(f"{API}/auth/login", json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "member"

    def test_login_invalid(self, s):
        r = s.post(f"{API}/auth/login", json={"email": MEMBER_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_register_and_me(self, s):
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "Pass123!"})
        assert r.status_code == 200, r.text
        tok = r.json()["token"]
        me = s.get(f"{API}/auth/me", headers=H(tok))
        assert me.status_code == 200
        assert me.json()["email"] == email.lower()

    def test_register_duplicate(self, s):
        r = s.post(f"{API}/auth/register", json={"name": "X", "email": MEMBER_EMAIL, "password": "x"})
        assert r.status_code == 400

    def test_me_unauthenticated(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401


# --- shows ---------------------------------------------------------------
class TestShows:
    def test_list_shows(self, s):
        r = s.get(f"{API}/shows")
        assert r.status_code == 200
        shows = r.json()
        assert len(shows) >= 4
        # tiers enriched with sold/available
        for sh in shows:
            for t in sh.get("ticket_tiers", []):
                assert "sold" in t and "available" in t

    def test_filter_status(self, s):
        r = s.get(f"{API}/shows", params={"status": "current"})
        assert r.status_code == 200
        assert all(x["status"] == "current" for x in r.json())

    def test_get_show(self, s):
        shows = s.get(f"{API}/shows").json()
        r = s.get(f"{API}/shows/{shows[0]['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == shows[0]["id"]

    def test_get_show_404(self, s):
        r = s.get(f"{API}/shows/nonexistent")
        assert r.status_code == 404


# --- admin CRUD shows ----------------------------------------------------
class TestAdminShows:
    def test_show_crud(self, s, admin_token):
        payload = {
            "title": "TEST_Show", "description": "d", "status": "upcoming",
            "performances": ["2026-12-01T19:30:00"],
            "ticket_tiers": [{"name": "GA", "price": 20.0, "capacity": 50}],
        }
        r = s.post(f"{API}/admin/shows", headers=H(admin_token), json=payload)
        assert r.status_code == 200, r.text
        sid = r.json()["id"]

        # verify GET
        g = s.get(f"{API}/shows/{sid}")
        assert g.status_code == 200
        assert g.json()["title"] == "TEST_Show"

        # update
        payload["title"] = "TEST_Show_Updated"
        u = s.put(f"{API}/admin/shows/{sid}", headers=H(admin_token), json=payload)
        assert u.status_code == 200
        assert u.json()["title"] == "TEST_Show_Updated"

        # delete
        d = s.delete(f"{API}/admin/shows/{sid}", headers=H(admin_token))
        assert d.status_code == 200
        assert s.get(f"{API}/shows/{sid}").status_code == 404

    def test_admin_shows_forbidden_for_member(self, s, member_token):
        r = s.post(f"{API}/admin/shows", headers=H(member_token),
                   json={"title": "x", "description": "y"})
        assert r.status_code == 403


# --- payments ------------------------------------------------------------
class TestPayments:
    def test_checkout_creates_session(self, s):
        shows = s.get(f"{API}/shows").json()
        show = next(x for x in shows if x["ticket_tiers"])
        tier = show["ticket_tiers"][0]
        r = s.post(f"{API}/payments/checkout", json={
            "show_id": show["id"], "tier_name": tier["name"],
            "quantity": 1, "origin_url": BASE_URL,
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["checkout_url"].startswith("https://")
        assert data["session_id"]

        # transaction persisted
        st = s.get(f"{API}/payments/status/{data['session_id']}")
        assert st.status_code == 200
        assert st.json()["payment_status"] in ("pending", "paid")

    def test_checkout_invalid_tier(self, s):
        shows = s.get(f"{API}/shows").json()
        r = s.post(f"{API}/payments/checkout", json={
            "show_id": shows[0]["id"], "tier_name": "NoSuchTier",
            "quantity": 1, "origin_url": BASE_URL,
        })
        assert r.status_code == 400

    def test_status_unknown_session(self, s):
        r = s.get(f"{API}/payments/status/cs_unknown")
        assert r.status_code == 404


# --- membership ----------------------------------------------------------
class TestMembership:
    def test_apply_requires_auth(self, s):
        r = s.post(f"{API}/membership/apply", json={"membership_type": "On Stage"})
        assert r.status_code == 401

    def test_apply_success(self, s):
        # create fresh user
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        reg = s.post(f"{API}/auth/register", json={"name": "M", "email": email, "password": "Pass123!"}).json()
        tok = reg["token"]
        r = s.post(f"{API}/membership/apply", headers=H(tok),
                   json={"membership_type": "Backstage", "interests": ["Lighting"]})
        assert r.status_code == 200
        assert r.json()["membership_status"] == "pending"
        assert r.json()["membership_type"] == "Backstage"


# --- admin endpoints -----------------------------------------------------
class TestAdmin:
    def test_stats(self, s, admin_token):
        r = s.get(f"{API}/admin/stats", headers=H(admin_token))
        assert r.status_code == 200
        for k in ("revenue", "tickets_sold", "members", "upcoming_shows", "fixtures", "revenue_by_show"):
            assert k in r.json()

    def test_members(self, s, admin_token):
        r = s.get(f"{API}/admin/members", headers=H(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert all("password_hash" not in m for m in r.json())

    def test_tickets(self, s, admin_token):
        r = s.get(f"{API}/admin/tickets", headers=H(admin_token))
        assert r.status_code == 200

    def test_transactions(self, s, admin_token):
        r = s.get(f"{API}/admin/transactions", headers=H(admin_token))
        assert r.status_code == 200

    def test_member_cannot_access_admin(self, s, member_token):
        assert s.get(f"{API}/admin/stats", headers=H(member_token)).status_code == 403
        assert s.get(f"{API}/admin/members", headers=H(member_token)).status_code == 403


# --- fixtures CRUD --------------------------------------------------------
class TestFixtures:
    def test_list_seeded(self, s, admin_token):
        r = s.get(f"{API}/admin/fixtures", headers=H(admin_token))
        assert r.status_code == 200
        assert len(r.json()) >= 6

    def test_fixture_crud(self, s, admin_token):
        payload = {
            "name": "TEST_Fixture", "manufacturer": "ETC", "model": "S4",
            "fixture_type": "Profile", "quantity": 1, "dmx_address": "A500",
            "dmx_channels": 1, "power_watts": 500, "lamp_hours": 10,
            "location": "LX 1", "status": "In Service", "notes": "",
        }
        r = s.post(f"{API}/admin/fixtures", headers=H(admin_token), json=payload)
        assert r.status_code == 200
        fid = r.json()["id"]

        payload["lamp_hours"] = 999
        u = s.put(f"{API}/admin/fixtures/{fid}", headers=H(admin_token), json=payload)
        assert u.status_code == 200
        assert u.json()["lamp_hours"] == 999

        d = s.delete(f"{API}/admin/fixtures/{fid}", headers=H(admin_token))
        assert d.status_code == 200


# --- campaigns -----------------------------------------------------------
class TestCampaigns:
    def test_send_campaign(self, s, admin_token):
        r = s.post(f"{API}/admin/campaigns", headers=H(admin_token),
                   json={"subject": "TEST_Subject", "body": "hi", "audience": "all"})
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "sent"
        assert data["recipient_count"] >= 1

        # appears in list
        lst = s.get(f"{API}/admin/campaigns", headers=H(admin_token)).json()
        assert any(c["subject"] == "TEST_Subject" for c in lst)


# --- tickets my ----------------------------------------------------------
class TestMyTickets:
    def test_my_tickets_auth(self, s, member_token):
        r = s.get(f"{API}/tickets/my", headers=H(member_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_my_tickets_unauth(self, s):
        r = s.get(f"{API}/tickets/my")
        assert r.status_code == 401
