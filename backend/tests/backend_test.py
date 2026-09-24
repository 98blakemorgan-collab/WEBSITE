"""Backend tests for Plantagenet Players theatre management system (iteration 2)."""
import os
import copy
import uuid
import pytest
import requests

from pathlib import Path
_fe_env = Path("/app/frontend/.env")
if _fe_env.exists() and not os.environ.get("REACT_APP_BACKEND_URL"):
    for line in _fe_env.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            os.environ["REACT_APP_BACKEND_URL"] = line.split("=", 1)[1].strip()
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "7yg268b5cs@privaterelay.appleid.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Plantagenet1953!")
MEMBER_EMAIL = os.environ.get("TEST_MEMBER_EMAIL", "member@plantagenetplayers.site")
MEMBER_PASSWORD = os.environ.get("TEST_MEMBER_PASSWORD", "Member123!")

CONTENT_KEYS = ["home", "story", "membership", "contact", "sponsors"]


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
        assert r.json()["user"]["role"] == "admin"

    def test_login_member(self, s):
        r = s.post(f"{API}/auth/login", json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "member"

    def test_login_invalid(self, s):
        r = s.post(f"{API}/auth/login", json={"email": MEMBER_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_unauthenticated(self, s):
        assert s.get(f"{API}/auth/me").status_code == 401


# --- shows ---------------------------------------------------------------
class TestShows:
    def test_list_shows(self, s):
        r = s.get(f"{API}/shows")
        assert r.status_code == 200
        shows = r.json()
        assert len(shows) >= 4
        for sh in shows:
            for t in sh.get("ticket_tiers", []):
                assert "sold" in t and "available" in t

    def test_filter_status_past(self, s):
        r = s.get(f"{API}/shows", params={"status": "past"})
        assert r.status_code == 200
        assert all(x["status"] == "past" for x in r.json())

    def test_get_show(self, s):
        shows = s.get(f"{API}/shows").json()
        r = s.get(f"{API}/shows/{shows[0]['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == shows[0]["id"]

    def test_get_show_404(self, s):
        assert s.get(f"{API}/shows/nonexistent").status_code == 404


# --- CMS content ---------------------------------------------------------
class TestContent:
    def test_get_all_content(self, s):
        r = s.get(f"{API}/content")
        assert r.status_code == 200
        data = r.json()
        for k in CONTENT_KEYS:
            assert k in data, f"missing key {k}"
        # spot-check structure
        assert "slides" in data["home"]
        assert "timeline" in data["story"]
        assert "items" in data["sponsors"]

    @pytest.mark.parametrize("key", CONTENT_KEYS)
    def test_get_content_key(self, s, key):
        r = s.get(f"{API}/content/{key}")
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

    def test_get_content_unknown_key(self, s):
        assert s.get(f"{API}/content/bogus_key").status_code == 404

    def test_update_content_requires_admin(self, s):
        r = s.put(f"{API}/admin/content/home", json={"data": {"x": 1}})
        assert r.status_code == 401

    def test_update_content_forbidden_for_member(self, s, member_token):
        r = s.put(f"{API}/admin/content/home", headers=H(member_token), json={"data": {"x": 1}})
        assert r.status_code == 403

    def test_update_membership_content_roundtrip(self, s, admin_token):
        # Fetch original
        original = s.get(f"{API}/content/membership").json()
        modified = copy.deepcopy(original)
        modified["title"] = f"TEST_TITLE_{uuid.uuid4().hex[:6]}"

        try:
            u = s.put(f"{API}/admin/content/membership", headers=H(admin_token), json={"data": modified})
            assert u.status_code == 200
            assert u.json()["data"]["title"] == modified["title"]

            # verify GET returns updated
            g = s.get(f"{API}/content/membership")
            assert g.status_code == 200
            assert g.json()["title"] == modified["title"]
        finally:
            # restore
            restore = s.put(f"{API}/admin/content/membership", headers=H(admin_token), json={"data": original})
            assert restore.status_code == 200
            final = s.get(f"{API}/content/membership").json()
            assert final == original

    def test_sponsors_endpoint_reads_from_content(self, s):
        r = s.get(f"{API}/sponsors")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        assert "name" in items[0]


# --- admin stats (fields updated: no fixtures) ---------------------------
class TestAdminStats:
    def test_stats_fields(self, s, admin_token):
        r = s.get(f"{API}/admin/stats", headers=H(admin_token))
        assert r.status_code == 200
        data = r.json()
        for k in ("revenue", "tickets_sold", "members", "active_members", "shows_total", "campaigns", "revenue_by_show"):
            assert k in data, f"missing stats field {k}"
        # NO fixtures field
        assert "fixtures" not in data
        assert "upcoming_shows" not in data  # replaced by shows_total

    def test_stats_forbidden_for_member(self, s, member_token):
        assert s.get(f"{API}/admin/stats", headers=H(member_token)).status_code == 403


# --- fixtures feature REMOVED --------------------------------------------
class TestFixturesRemoved:
    def test_admin_fixtures_gone(self, s, admin_token):
        r = s.get(f"{API}/admin/fixtures", headers=H(admin_token))
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
        assert s.get(f"{API}/shows/{sid}").status_code == 200

        payload["title"] = "TEST_Show_Updated"
        u = s.put(f"{API}/admin/shows/{sid}", headers=H(admin_token), json=payload)
        assert u.status_code == 200
        assert u.json()["title"] == "TEST_Show_Updated"

        assert s.delete(f"{API}/admin/shows/{sid}", headers=H(admin_token)).status_code == 200
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
        assert "stripe.com" in data["checkout_url"]

    def test_checkout_invalid_tier(self, s):
        shows = s.get(f"{API}/shows").json()
        r = s.post(f"{API}/payments/checkout", json={
            "show_id": shows[0]["id"], "tier_name": "NoSuchTier",
            "quantity": 1, "origin_url": BASE_URL,
        })
        assert r.status_code == 400


# --- membership ----------------------------------------------------------
class TestMembership:
    def test_apply_requires_auth(self, s):
        assert s.post(f"{API}/membership/apply", json={"membership_type": "On Stage"}).status_code == 401


# --- campaigns -----------------------------------------------------------
class TestCampaigns:
    def test_send_campaign(self, s, admin_token):
        r = s.post(f"{API}/admin/campaigns", headers=H(admin_token),
                   json={"subject": "TEST_Subject", "body": "hi", "audience": "all"})
        assert r.status_code == 200
        assert r.json()["status"] == "sent"
        assert r.json()["recipient_count"] >= 1


# --- admin authz sweep ---------------------------------------------------
class TestAdminAuthz:
    def test_member_cannot_access_admin_endpoints(self, s, member_token):
        for path in ("/admin/stats", "/admin/members", "/admin/tickets", "/admin/transactions",
                     "/admin/campaigns", "/admin/media", "/admin/contacts"):
            assert s.get(f"{API}{path}", headers=H(member_token)).status_code == 403, path

    def test_anon_cannot_access_admin_endpoints(self, s):
        for path in ("/admin/stats", "/admin/media", "/admin/contacts"):
            assert s.get(f"{API}{path}").status_code == 401, path


# --- Archive (past shows without dates) ----------------------------------
class TestArchive:
    def test_archive_past_shows(self, s):
        r = s.get(f"{API}/shows", params={"status": "past"})
        assert r.status_code == 200
        shows = r.json()
        assert len(shows) >= 1
        # All 4 seeded shows should be past by design
        assert len(shows) >= 4
        for sh in shows:
            assert sh["status"] == "past"
            # cast/crew present for detail view
            assert "cast" in sh
            assert "crew" in sh


# --- Media Library -------------------------------------------------------
class TestMedia:
    def test_list_media_admin(self, s, admin_token):
        r = s.get(f"{API}/admin/media", headers=H(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "photos" in data
        assert isinstance(data["photos"], list)
        assert len(data["photos"]) >= 1

    def test_upload_and_retrieve_image(self, s, admin_token):
        # 1x1 PNG bytes
        png = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
               b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8"
               b"\xcf\xc0\x00\x00\x00\x03\x00\x01\xe2\x21\xbc\x33\x00\x00\x00\x00IEND\xaeB`\x82")
        files = {"file": ("TEST_upload.png", png, "image/png")}
        r = requests.post(f"{API}/admin/upload", headers=H(admin_token), files=files)
        assert r.status_code == 200, r.text
        path = r.json()["path"]
        assert path.startswith("/api/uploads/")
        uid = path.split("/api/uploads/")[1]

        # Verify it appears in media list
        media = s.get(f"{API}/admin/media", headers=H(admin_token)).json()
        assert path in media["photos"]

        # Retrieve the image publicly
        g = requests.get(f"{BASE_URL}{path}")
        assert g.status_code == 200
        assert g.headers.get("content-type", "").startswith("image/")

        # Cleanup
        d = s.delete(f"{API}/admin/uploads/{uid}", headers=H(admin_token))
        assert d.status_code == 200

    def test_upload_requires_admin(self, s, member_token):
        files = {"file": ("x.png", b"abc", "image/png")}
        r = requests.post(f"{API}/admin/upload", headers=H(member_token), files=files)
        assert r.status_code == 403


# --- Guest checkout with marketing opt-in --------------------------------
class TestGuestCheckoutMarketing:
    def test_guest_checkout_stores_marketing_optin(self, s, admin_token):
        shows = s.get(f"{API}/shows").json()
        show = next(x for x in shows if x["ticket_tiers"])
        tier = show["ticket_tiers"][0]
        test_email = f"test_optin_{uuid.uuid4().hex[:6]}@example.com"
        r = s.post(f"{API}/payments/checkout", json={
            "show_id": show["id"], "tier_name": tier["name"],
            "quantity": 1, "origin_url": BASE_URL,
            "buyer_name": "TEST Guest", "buyer_email": test_email,
            "marketing_opt_in": True,
        })
        assert r.status_code == 200, r.text
        assert "checkout.stripe.com" in r.json()["checkout_url"] or "stripe.com" in r.json()["checkout_url"]

        # Verify the marketing contact was recorded
        contacts = s.get(f"{API}/admin/contacts", headers=H(admin_token)).json()
        emails = [c["email"] for c in contacts]
        assert test_email in emails, f"Marketing opt-in email {test_email} not recorded"
        contact = next(c for c in contacts if c["email"] == test_email)
        assert contact["opt_in"] is True
        assert contact["source"] == "ticket_purchase"


# --- Content: documents key for Our Story --------------------------------
class TestDocumentsContent:
    def test_documents_key_exists(self, s):
        r = s.get(f"{API}/content/documents")
        assert r.status_code == 200
        data = r.json()
        assert "constitution_url" in data
        assert "agm_url" in data

    def test_documents_editable_by_admin(self, s, admin_token):
        original = s.get(f"{API}/content/documents").json()
        try:
            modified = {"constitution_url": "https://example.com/constitution.pdf",
                        "agm_url": "https://example.com/agm.pdf"}
            u = s.put(f"{API}/admin/content/documents", headers=H(admin_token), json={"data": modified})
            assert u.status_code == 200
            g = s.get(f"{API}/content/documents").json()
            assert g["constitution_url"] == modified["constitution_url"]
            assert g["agm_url"] == modified["agm_url"]
        finally:
            s.put(f"{API}/admin/content/documents", headers=H(admin_token), json={"data": original})


# --- Marketing audience campaign -----------------------------------------
class TestMarketingCampaign:
    def test_marketing_audience_campaign(self, s, admin_token):
        r = s.post(f"{API}/admin/campaigns", headers=H(admin_token),
                   json={"subject": "TEST_Marketing", "body": "hi", "audience": "marketing"})
        assert r.status_code == 200
        data = r.json()
        assert data["audience"] == "marketing"
        assert data["status"] == "sent"
