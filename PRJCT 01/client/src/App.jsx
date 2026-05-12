import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Home,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  UserRound,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, setToken } from "./api.js";
import { fallbackItems } from "./fallbackData.js";

const categories = ["All", "Tools", "Home", "Power", "Media", "Cleaning", "Events", "Garden"];

const initialListingForm = {
  title: "",
  description: "",
  category: "Tools",
  pricePerDay: 2500,
  valueTier: "low",
  trustLevelRequired: 1,
  location: "",
  imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80"
};

function formatNaira(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function getTierLabel(tier) {
  return {
    low: "Low value",
    medium: "Medium value",
    high: "High value"
  }[tier];
}

export default function App() {
  const [activeTab, setActiveTab] = useState("browse");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "admin@rentit.test",
    password: "password123",
    inviteCode: "ESTATE-ALPHA"
  });
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({ q: "", category: "All" });
  const [bookings, setBookings] = useState({ asRenter: [], asOwner: [] });
  const [adminSummary, setAdminSummary] = useState(null);
  const [listingForm, setListingForm] = useState(initialListingForm);
  const [verificationForm, setVerificationForm] = useState({
    selfieUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    idNumber: ""
  });
  const [bookingForm, setBookingForm] = useState({
    days: 2,
    termsAccepted: false,
    conditionAccepted: false,
    videoUrl: "simulated-handover-video.mp4",
    notes: ""
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const isVerified = user?.verification?.status === "verified";

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = filters.category === "All" || item.category === filters.category;
      const searchText = `${item.title} ${item.description} ${item.location}`.toLowerCase();
      const matchesSearch = searchText.includes(filters.q.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, filters]);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    await Promise.all([loadCurrentUser(), loadItems()]);
  }

  async function loadCurrentUser() {
    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }

  async function loadItems() {
    try {
      const data = await api.items(filters);
      setItems(data.items);
      setError("");
    } catch {
      setItems(fallbackItems);
      setError("API offline: showing preview items. Start the server and seed MongoDB for live data.");
    }
  }

  async function loadBookings() {
    if (!user) return;

    try {
      const data = await api.myBookings();
      setBookings(data);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function loadAdminSummary() {
    if (user?.role !== "admin") return;

    try {
      const data = await api.adminSummary();
      setAdminSummary(data);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setIsBusy(true);
    setError("");

    try {
      const data =
        authMode === "signup"
          ? await api.signup(authForm)
          : await api.login({ email: authForm.email, password: authForm.password });

      setToken(data.token);
      setUser(data.user);
      setStatus(`Welcome, ${data.user.name}.`);
      await Promise.all([loadItems(), loadBookings()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsBusy(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setBookings({ asRenter: [], asOwner: [] });
    setAdminSummary(null);
    setStatus("Signed out.");
  }

  async function handleVerification(event) {
    event.preventDefault();
    setIsBusy(true);
    setStatus("Verifying identity...");
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const data = await api.verify(verificationForm);
      setUser(data.user);
      setStatus("Identity verified. Your badge is active.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateItem(event) {
    event.preventDefault();
    setIsBusy(true);
    setError("");

    try {
      await api.createItem(listingForm);
      setListingForm(initialListingForm);
      setStatus("Listing published.");
      setActiveTab("browse");
      await loadItems();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateBooking(event) {
    event.preventDefault();

    if (!selectedItem) return;

    setIsBusy(true);
    setError("");

    try {
      await api.createBooking({
        itemId: selectedItem._id,
        days: Number(bookingForm.days),
        termsAccepted: bookingForm.termsAccepted,
        handoverChecklist: {
          videoUrl: bookingForm.videoUrl,
          conditionAccepted: bookingForm.conditionAccepted,
          notes: bookingForm.notes
        }
      });

      setStatus(`${selectedItem.title} rental started.`);
      setSelectedItem(null);
      setBookingForm({
        days: 2,
        termsAccepted: false,
        conditionAccepted: false,
        videoUrl: "simulated-handover-video.mp4",
        notes: ""
      });
      await Promise.all([loadItems(), loadBookings()]);
      setActiveTab("rentals");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleBookingStatus(id, statusValue) {
    setIsBusy(true);
    setError("");

    try {
      await api.updateBookingStatus(id, statusValue);
      setStatus(statusValue === "returned" ? "Return confirmed. Trust progress updated." : "Booking updated.");
      await Promise.all([loadBookings(), loadItems(), loadCurrentUser()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsBusy(false);
    }
  }

  const navItems = [
    { id: "browse", label: "Browse", icon: Home },
    { id: "list", label: "List Item", icon: Plus },
    { id: "rentals", label: "Rentals", icon: ClipboardCheck },
    { id: "profile", label: "Profile", icon: UserRound },
    ...(user?.role === "admin" ? [{ id: "admin", label: "Admin", icon: Settings }] : [])
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">R</div>
          <div>
            <strong>RentIt</strong>
            <span>Greenfield Estate</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeTab === item.id ? "nav-button active" : "nav-button"}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === "rentals") loadBookings();
                  if (item.id === "admin") loadAdminSummary();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="mini-profile">
                <span>{user.name}</span>
                <small>Trust Level {user.trust?.level || 1}</small>
              </div>
              <button className="ghost-button" onClick={handleLogout}>
                <LogOut size={16} />
                Sign out
              </button>
            </>
          ) : (
            <span className="muted">Use seeded login after running the database seed.</span>
          )}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Estate rental marketplace</p>
            <h1>{activeTab === "browse" ? "Borrow from trusted neighbors" : navItems.find((item) => item.id === activeTab)?.label}</h1>
          </div>
          {user ? (
            <div className="trust-pill">
              <Gauge size={18} />
              <span>Level {user.trust?.level || 1}</span>
              {isVerified && <BadgeCheck size={18} />}
            </div>
          ) : null}
        </header>

        {status && <div className="notice success">{status}</div>}
        {error && <div className="notice warning">{error}</div>}

        {!user ? (
          <AuthPanel
            authMode={authMode}
            setAuthMode={setAuthMode}
            authForm={authForm}
            setAuthForm={setAuthForm}
            onSubmit={handleAuth}
            isBusy={isBusy}
          />
        ) : null}

        {activeTab === "browse" && (
          <BrowseView
            items={filteredItems}
            filters={filters}
            setFilters={setFilters}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            bookingForm={bookingForm}
            setBookingForm={setBookingForm}
            onBook={handleCreateBooking}
            user={user}
            isVerified={isVerified}
            setActiveTab={setActiveTab}
            isBusy={isBusy}
          />
        )}

        {activeTab === "list" && (
          <ListingView
            user={user}
            isVerified={isVerified}
            setActiveTab={setActiveTab}
            listingForm={listingForm}
            setListingForm={setListingForm}
            onSubmit={handleCreateItem}
            isBusy={isBusy}
          />
        )}

        {activeTab === "rentals" && (
          <RentalsView bookings={bookings} onStatus={handleBookingStatus} isBusy={isBusy} />
        )}

        {activeTab === "profile" && (
          <ProfileView
            user={user}
            isVerified={isVerified}
            verificationForm={verificationForm}
            setVerificationForm={setVerificationForm}
            onVerify={handleVerification}
            isBusy={isBusy}
          />
        )}

        {activeTab === "admin" && user?.role === "admin" && <AdminView summary={adminSummary} onRefresh={loadAdminSummary} />}
      </main>
    </div>
  );
}

function AuthPanel({ authMode, setAuthMode, authForm, setAuthForm, onSubmit, isBusy }) {
  return (
    <section className="auth-layout">
      <div className="auth-copy">
        <p className="eyebrow">Closed estate access</p>
        <h2>Start with admin@rentit.test after seeding.</h2>
        <p>
          Demo password is <strong>password123</strong>. New residents can use invite code <strong>ESTATE-ALPHA</strong>.
        </p>
      </div>
      <form className="panel form-grid" onSubmit={onSubmit}>
        <div className="segmented">
          <button type="button" className={authMode === "login" ? "selected" : ""} onClick={() => setAuthMode("login")}>
            Login
          </button>
          <button type="button" className={authMode === "signup" ? "selected" : ""} onClick={() => setAuthMode("signup")}>
            Signup
          </button>
        </div>

        {authMode === "signup" && (
          <label>
            Name
            <input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={authForm.email}
            onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={authForm.password}
            onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
          />
        </label>

        {authMode === "signup" && (
          <label>
            Invite code
            <input value={authForm.inviteCode} onChange={(event) => setAuthForm({ ...authForm, inviteCode: event.target.value })} />
          </label>
        )}

        <button className="primary-button" disabled={isBusy}>
          {isBusy ? "Working..." : authMode === "signup" ? "Create account" : "Login"}
        </button>
      </form>
    </section>
  );
}

function BrowseView({
  items,
  filters,
  setFilters,
  selectedItem,
  setSelectedItem,
  bookingForm,
  setBookingForm,
  onBook,
  user,
  isVerified,
  setActiveTab,
  isBusy
}) {
  return (
    <div className="content-grid">
      <section className="market-column">
        <div className="toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              placeholder="Search power washer, ladder, camera..."
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            />
          </label>
          <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="item-grid">
          {items.map((item) => (
            <article key={item._id} className="item-card">
              <img src={item.imageUrl} alt={item.title} />
              <div className="item-card-body">
                <div className="row-between">
                  <span className="category-chip">{item.category}</span>
                  <strong>{formatNaira(item.pricePerDay)}/day</strong>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="meta-row">
                  <span>{item.location}</span>
                  <span>{getTierLabel(item.valueTier)}</span>
                </div>
                <button className="secondary-button" onClick={() => setSelectedItem(item)}>
                  View rental
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="detail-panel">
        {selectedItem ? (
          <>
            <img className="detail-image" src={selectedItem.imageUrl} alt={selectedItem.title} />
            <div className="detail-heading">
              <div>
                <span className="category-chip">{selectedItem.category}</span>
                <h2>{selectedItem.title}</h2>
              </div>
              <strong>{formatNaira(selectedItem.pricePerDay)}/day</strong>
            </div>
            <p>{selectedItem.description}</p>
            <div className="stats-strip">
              <span>Trust Level {selectedItem.trustLevelRequired || 1}+</span>
              <span>{selectedItem.owner?.name || "Estate lister"}</span>
              <span>{selectedItem.location}</span>
            </div>

            {!user && <p className="notice compact">Login to rent this item.</p>}

            {user && !isVerified && (
              <button className="primary-button" onClick={() => setActiveTab("profile")}>
                Verify before renting
              </button>
            )}

            {user && isVerified && (
              <form className="checkout-form" onSubmit={onBook}>
                <label>
                  Rental days
                  <input
                    type="number"
                    min="1"
                    value={bookingForm.days}
                    onChange={(event) => setBookingForm({ ...bookingForm, days: event.target.value })}
                  />
                </label>
                <PriceBreakdown item={selectedItem} days={bookingForm.days} />
                <label>
                  Handover video
                  <input
                    value={bookingForm.videoUrl}
                    onChange={(event) => setBookingForm({ ...bookingForm, videoUrl: event.target.value })}
                  />
                </label>
                <label>
                  Condition notes
                  <textarea
                    value={bookingForm.notes}
                    onChange={(event) => setBookingForm({ ...bookingForm, notes: event.target.value })}
                    placeholder="Turns on, no visible cracks, cable included."
                  />
                </label>
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    checked={bookingForm.conditionAccepted}
                    onChange={(event) => setBookingForm({ ...bookingForm, conditionAccepted: event.target.checked })}
                  />
                  I accept the item condition at handover.
                </label>
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    checked={bookingForm.termsAccepted}
                    onChange={(event) => setBookingForm({ ...bookingForm, termsAccepted: event.target.checked })}
                  />
                  I accept RentIt's rental terms.
                </label>
                <button className="primary-button" disabled={!bookingForm.termsAccepted || !bookingForm.conditionAccepted || isBusy}>
                  <WalletCards size={18} />
                  {isBusy ? "Processing..." : "Simulate payment"}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Camera size={34} />
            <h2>Select an item</h2>
            <p>Rental details, trust requirements, and checkout appear here.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function PriceBreakdown({ item, days }) {
  const rentalDays = Number(days) || 1;
  const total = item.pricePerDay * rentalDays;
  const fee = Math.round(total * 0.1);
  const ownerPayout = total - fee;

  return (
    <div className="price-box">
      <span>Total: {formatNaira(total)}</span>
      <span>Owner payout: {formatNaira(ownerPayout)}</span>
      <span>RentIt fee: {formatNaira(fee)}</span>
    </div>
  );
}

function ListingView({ user, isVerified, setActiveTab, listingForm, setListingForm, onSubmit, isBusy }) {
  if (!user) {
    return <div className="panel empty-state">Login to list an item.</div>;
  }

  if (!isVerified) {
    return (
      <section className="panel empty-state">
        <ShieldCheck size={34} />
        <h2>Verification required</h2>
        <button className="primary-button" onClick={() => setActiveTab("profile")}>
          Verify identity
        </button>
      </section>
    );
  }

  return (
    <section className="panel">
      <form className="listing-form" onSubmit={onSubmit}>
        <label>
          Item title
          <input value={listingForm.title} onChange={(event) => setListingForm({ ...listingForm, title: event.target.value })} required />
        </label>
        <label>
          Description
          <textarea
            value={listingForm.description}
            onChange={(event) => setListingForm({ ...listingForm, description: event.target.value })}
            required
          />
        </label>
        <div className="form-row">
          <label>
            Category
            <select value={listingForm.category} onChange={(event) => setListingForm({ ...listingForm, category: event.target.value })}>
              {categories.filter((category) => category !== "All").map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Price per day
            <input
              type="number"
              min="1"
              value={listingForm.pricePerDay}
              onChange={(event) => setListingForm({ ...listingForm, pricePerDay: Number(event.target.value) })}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Value tier
            <select
              value={listingForm.valueTier}
              onChange={(event) => {
                const valueTier = event.target.value;
                const level = valueTier === "high" ? 3 : valueTier === "medium" ? 2 : 1;
                setListingForm({ ...listingForm, valueTier, trustLevelRequired: level });
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Location
            <input value={listingForm.location} onChange={(event) => setListingForm({ ...listingForm, location: event.target.value })} required />
          </label>
        </div>
        <label>
          Image URL
          <input value={listingForm.imageUrl} onChange={(event) => setListingForm({ ...listingForm, imageUrl: event.target.value })} />
        </label>
        <button className="primary-button" disabled={isBusy}>
          <Plus size={18} />
          {isBusy ? "Publishing..." : "Publish listing"}
        </button>
      </form>
    </section>
  );
}

function RentalsView({ bookings, onStatus, isBusy }) {
  const hasBookings = bookings.asRenter.length || bookings.asOwner.length;

  if (!hasBookings) {
    return (
      <section className="panel empty-state">
        <ClipboardCheck size={34} />
        <h2>No rentals yet</h2>
        <p>Active rentals and owner handovers will appear here.</p>
      </section>
    );
  }

  return (
    <div className="rentals-grid">
      <BookingList title="Items I rented" bookings={bookings.asRenter} onStatus={onStatus} isBusy={isBusy} />
      <BookingList title="My items rented out" bookings={bookings.asOwner} onStatus={onStatus} isBusy={isBusy} />
    </div>
  );
}

function BookingList({ title, bookings, onStatus, isBusy }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="booking-list">
        {bookings.map((booking) => (
          <article key={booking._id} className="booking-row">
            <img src={booking.item?.imageUrl} alt={booking.item?.title} />
            <div>
              <strong>{booking.item?.title}</strong>
              <span>{booking.days} day rental</span>
              <span>{formatNaira(booking.payment?.totalAmount)} total</span>
            </div>
            <div className="booking-actions">
              <span className={`status-badge ${booking.status}`}>{booking.status}</span>
              {booking.status === "active" && (
                <button className="secondary-button" disabled={isBusy} onClick={() => onStatus(booking._id, "returned")}>
                  Mark returned
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileView({ user, isVerified, verificationForm, setVerificationForm, onVerify, isBusy }) {
  if (!user) {
    return <div className="panel empty-state">Login to view your profile.</div>;
  }

  return (
    <div className="profile-grid">
      <section className="panel">
        <div className="profile-heading">
          <div className="avatar">{user.name?.slice(0, 1)}</div>
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="trust-meter">
          <div className="row-between">
            <span>Trust Level {user.trust?.level || 1}</span>
            <span>{user.trust?.progressToNextLevel || 0}%</span>
          </div>
          <div className="meter-track">
            <div style={{ width: `${user.trust?.progressToNextLevel || 0}%` }} />
          </div>
          <small>{user.trust?.completedRentals || 0} successful returns</small>
        </div>
        <div className="profile-badges">
          <span className={isVerified ? "badge good" : "badge"}>{isVerified ? "Verified" : "Unverified"}</span>
          <span className="badge">Estate: {user.estateName}</span>
          <span className="badge">Role: {user.role}</span>
        </div>
      </section>

      <section className="panel">
        <h2>Identity verification</h2>
        {isVerified ? (
          <div className="verified-box">
            <CheckCircle2 size={34} />
            <strong>Verified badge active</strong>
            <span>ID ending {user.verification?.idNumberMasked?.slice(-4)}</span>
          </div>
        ) : (
          <form className="form-grid" onSubmit={onVerify}>
            <label>
              Selfie URL
              <input
                value={verificationForm.selfieUrl}
                onChange={(event) => setVerificationForm({ ...verificationForm, selfieUrl: event.target.value })}
              />
            </label>
            <label>
              NIN/BVN demo number
              <input
                value={verificationForm.idNumber}
                onChange={(event) => setVerificationForm({ ...verificationForm, idNumber: event.target.value })}
                placeholder="12345678901"
              />
            </label>
            <button className="primary-button" disabled={isBusy}>
              <Upload size={18} />
              {isBusy ? "Verifying..." : "Submit verification"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function AdminView({ summary, onRefresh }) {
  if (!summary) {
    return (
      <section className="panel empty-state">
        <Settings size={34} />
        <h2>Admin summary</h2>
        <button className="primary-button" onClick={onRefresh}>
          Load dashboard
        </button>
      </section>
    );
  }

  return (
    <div className="admin-stack">
      <section className="metric-grid">
        {Object.entries(summary.stats).map(([key, value]) => (
          <div className="metric" key={key}>
            <span>{key}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Recent bookings</h2>
        <div className="admin-table">
          {summary.bookings.map((booking) => (
            <div key={booking._id}>
              <span>{booking.item?.title}</span>
              <span>{booking.renter?.name}</span>
              <span>{booking.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Invite codes</h2>
        <div className="admin-table">
          {summary.inviteCodes.map((code) => (
            <div key={code._id}>
              <span>{code.code}</span>
              <span>{code.estateName}</span>
              <span>
                {code.uses}/{code.maxUses}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
