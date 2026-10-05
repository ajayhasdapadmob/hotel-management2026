/* =========================================================
   HOTEL MANAGEMENT SYSTEM - BOOKINGS
   V3-7 MASTER STYLE
   ========================================================= */

window.Bookings = (() => {

    const STORAGE_KEY = "hotelBookings";
    const GUESTS_KEY = "hotelGuests";
    const ROOMS_KEY = "hotelRooms";

    let container = null;

    /* ---------------------------------------------------------
       Storage helpers
       --------------------------------------------------------- */

    function getBookings() {
        return HotelApp.getStorage(STORAGE_KEY, []);
    }

    function saveBookings(data) {
        HotelApp.setStorage(STORAGE_KEY, data);
    }

    function getGuests() {
        return HotelApp.getStorage(GUESTS_KEY, []);
    }

    function saveGuests(data) {
        HotelApp.setStorage(GUESTS_KEY, data);
    }

    function getRooms() {
        return HotelApp.getStorage(ROOMS_KEY, []);
    }

    function saveRooms(data) {
        HotelApp.setStorage(ROOMS_KEY, data);
    }

    /* ---------------------------------------------------------
       Public render
       --------------------------------------------------------- */

    function render(target) {
        container = target;
        renderPage();
    }

    /* ---------------------------------------------------------
       Main page
       --------------------------------------------------------- */

    function renderPage() {
        if (!container) return;

        const bookings = getBookings();

        const today = new Date();
        const todayString = today.toISOString().slice(0, 10);

        const todayBookings = bookings.filter(b => {
            return String(b.checkIn || "").slice(0, 10) === todayString;
        }).length;

        const activeBookings = bookings.filter(b =>
            b.status === "confirmed" ||
            b.status === "checked-in"
        ).length;

        const checkedIn = bookings.filter(b =>
            b.status === "checked-in"
        ).length;

        const pending = bookings.filter(b =>
            b.status === "pending"
        ).length;

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>Bookings</h1>
                    <p>Manage reservations, check-in and check-out</p>
                </div>

                <button class="btn btn-primary" id="addBookingBtn">
                    + New Booking
                </button>
            </div>

            <div class="stats-grid">

                <div class="stat-card">
                    <div class="stat-card-icon">📅</div>
                    <div>
                        <div class="stat-card-label">Today's Bookings</div>
                        <div class="stat-card-value">${todayBookings}</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-card-icon">📋</div>
                    <div>
                        <div class="stat-card-label">Active Bookings</div>
                        <div class="stat-card-value">${activeBookings}</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-card-icon">🛏️</div>
                    <div>
                        <div class="stat-card-label">Checked In</div>
                        <div class="stat-card-value">${checkedIn}</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-card-icon">⏳</div>
                    <div>
                        <div class="stat-card-label">Pending</div>
                        <div class="stat-card-value">${pending}</div>
                    </div>
                </div>

            </div>

            <div class="card">

                <div class="filter-bar">

                    <div class="search-box">
                        <span>🔍</span>
                        <input
                            type="text"
                            id="bookingSearch"
                            placeholder="Search booking, guest, mobile or room..."
                        >
                    </div>

                    <select id="bookingStatusFilter" class="form-control">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="checked-in">Checked In</option>
                        <option value="checked-out">Checked Out</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select id="bookingDateFilter" class="form-control">
                        <option value="">All Dates</option>
                        <option value="today">Today</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="past">Past</option>
                    </select>

                </div>

                <div id="bookingTableContainer"></div>

            </div>
        `;

        document
            .getElementById("addBookingBtn")
            ?.addEventListener("click", openNewBooking);

        document
            .getElementById("bookingSearch")
            ?.addEventListener("input", refreshTable);

        document
            .getElementById("bookingStatusFilter")
            ?.addEventListener("change", refreshTable);

        document
            .getElementById("bookingDateFilter")
            ?.addEventListener("change", refreshTable);

        refreshTable();
    }

    /* ---------------------------------------------------------
       Refresh table
       --------------------------------------------------------- */

    function refreshTable() {

        const tableContainer =
            document.getElementById("bookingTableContainer");

        if (!tableContainer) return;

        let bookings = getBookings();

        const search =
            (document.getElementById("bookingSearch")?.value || "")
                .trim()
                .toLowerCase();

        const status =
            document.getElementById("bookingStatusFilter")?.value || "";

        const dateFilter =
            document.getElementById("bookingDateFilter")?.value || "";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        bookings = bookings.filter(booking => {

            const guestName =
                booking.guestName ||
                booking.guest?.fullName ||
                "";

            const mobile =
                booking.mobile ||
                booking.guestMobile ||
                booking.guest?.mobile ||
                "";

            const room =
                booking.roomNumber ||
                booking.room?.roomNumber ||
                "";

            const bookingId =
                booking.bookingNumber ||
                booking.bookingId ||
                booking.id ||
                "";

            const searchable = `
                ${guestName}
                ${mobile}
                ${room}
                ${bookingId}
            `.toLowerCase();

            if (search && !searchable.includes(search)) {
                return false;
            }

            if (status && booking.status !== status) {
                return false;
            }

            const checkIn = parseDate(booking.checkIn);

            if (dateFilter === "today") {
                if (!checkIn) return false;

                return checkIn.toDateString() === today.toDateString();
            }

            if (dateFilter === "upcoming") {
                if (!checkIn) return false;
                return checkIn > today;
            }

            if (dateFilter === "past") {
                if (!checkIn) return false;
                return checkIn < today;
            }

            return true;
        });

        bookings.sort((a, b) => {
            const da = parseDate(a.checkIn)?.getTime() || 0;
            const db = parseDate(b.checkIn)?.getTime() || 0;
            return db - da;
        });

        if (!bookings.length) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <h3>No bookings found</h3>
                    <p>Create a new booking or change your search/filter.</p>
                </div>
            `;
            return;
        }

        tableContainer.innerHTML = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Booking</th>
                            <th>Guest</th>
                            <th>Room</th>
                            <th>Check-In</th>
                            <th>Check-Out</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${bookings.map(bookingRow).join("")}
                    </tbody>
                </table>
            </div>
        `;

        tableContainer
            .querySelectorAll("[data-booking-action]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const action =
                        button.dataset.bookingAction;

                    const id =
                        button.dataset.id;

                    if (action === "view") {
                        viewBooking(id);
                    }

                    if (action === "edit") {
                        editBooking(id);
                    }

                    if (action === "checkin") {
                        checkIn(id);
                    }

                    if (action === "checkout") {
                        checkOut(id);
                    }

                    if (action === "cancel") {
                        cancelBooking(id);
                    }

                    if (action === "delete") {
                        deleteBooking(id);
                    }
                });
            });
    }

    /* ---------------------------------------------------------
       Booking row
       --------------------------------------------------------- */

    function bookingRow(booking) {

        const guestName =
            booking.guestName ||
            booking.guest?.fullName ||
            "Guest";

        const mobile =
            booking.mobile ||
            booking.guestMobile ||
            booking.guest?.mobile ||
            "";

        const room =
            booking.roomNumber ||
            booking.room?.roomNumber ||
            "—";

        const bookingNumber =
            booking.bookingNumber ||
            booking.bookingId ||
            booking.id;

        const paymentStatus =
            getPaymentStatus(booking);

        return `
            <tr>

                <td>
                    <strong>${escapeHtml(bookingNumber)}</strong>
                </td>

                <td>
                    <div>
                        <strong>${escapeHtml(guestName)}</strong>
                    </div>
                    <small>${escapeHtml(mobile)}</small>
                </td>

                <td>
                    <strong>Room ${escapeHtml(room)}</strong>
                </td>

                <td>
                    ${formatDateValue(booking.checkIn)}
                </td>

                <td>
                    ${formatDateValue(booking.checkOut)}
                </td>

                <td>
                    ${paymentBadge(paymentStatus)}
                </td>

                <td>
                    ${statusBadge(booking.status)}
                </td>

                <td>
                    <div class="action-buttons">

                        <button
                            class="btn btn-sm btn-secondary"
                            data-booking-action="view"
                            data-id="${safeId(booking.id)}"
                            title="View"
                        >
                            View
                        </button>

                        ${
                            booking.status !== "checked-out" &&
                            booking.status !== "cancelled"
                            ? `
                            <button
                                class="btn btn-sm btn-secondary"
                                data-booking-action="edit"
                                data-id="${safeId(booking.id)}"
                            >
                                Edit
                            </button>
                            `
                            : ""
                        }

                        ${
                            booking.status === "confirmed" ||
                            booking.status === "pending"
                            ? `
                            <button
                                class="btn btn-sm btn-primary"
                                data-booking-action="checkin"
                                data-id="${safeId(booking.id)}"
                            >
                                Check In
                            </button>
                            `
                            : ""
                        }

                        ${
                            booking.status === "checked-in"
                            ? `
                            <button
                                class="btn btn-sm btn-primary"
                                data-booking-action="checkout"
                                data-id="${safeId(booking.id)}"
                            >
                                Check Out
                            </button>
                            `
                            : ""
                        }

                        ${
                            booking.status !== "checked-out" &&
                            booking.status !== "cancelled"
                            ? `
                            <button
                                class="btn btn-sm btn-danger"
                                data-booking-action="cancel"
                                data-id="${safeId(booking.id)}"
                            >
                                Cancel
                            </button>
                            `
                            : ""
                        }

                    </div>
                </td>

            </tr>
        `;
    }

    /* ---------------------------------------------------------
       New booking
       --------------------------------------------------------- */

    function openNewBooking() {

        const rooms = getRooms()
            .filter(room => room.status === "available");

        const guests = getGuests();

        HotelApp.openModal(
            "New Booking",
            `
            <form id="bookingForm">

                <input
                    type="hidden"
                    id="bookingEditId"
                    value=""
                >

                <div class="form-section">
                    <h3>Guest Details</h3>

                    <div class="form-grid">

                        <div class="form-group">
                            <label>Guest</label>

                            <select
                                id="bookingGuestSelect"
                                class="form-control"
                            >
                                <option value="">
                                    + New Guest
                                </option>

                                ${guests.map(guest => `
                                    <option value="${safeId(guest.id)}">
                                        ${escapeHtml(
                                            guest.fullName ||
                                            guest.name ||
                                            "Guest"
                                        )}
                                        - ${escapeHtml(
                                            guest.mobile || ""
                                        )}
                                    </option>
                                `).join("")}

                            </select>
                        </div>

                        <div class="form-group">
                            <label>Full Name *</label>

                            <input
                                type="text"
                                id="bookingGuestName"
                                class="form-control"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label>Mobile Number *</label>

                            <input
                                type="tel"
                                id="bookingGuestMobile"
                                class="form-control"
                                maxlength="10"
                                required
                            >
                        </div>

                    </div>
                </div>

                <div class="form-section">
                    <h3>Room & Stay</h3>

                    <div class="form-grid">

                        <div class="form-group">
                            <label>Room *</label>

                            <select
                                id="bookingRoom"
                                class="form-control"
                                required
                            >

                                <option value="">
                                    Select Room
                                </option>

                                ${rooms.map(room => `
                                    <option
                                        value="${safeId(room.id)}"
                                    >
                                        Room ${escapeHtml(
                                            room.roomNumber
                                        )}
                                        -
                                        ${escapeHtml(
                                            room.type || "Room"
                                        )}
                                        -
                                        ${formatCurrency(
                                            Number(room.rate || 0)
                                        )}
                                    </option>
                                `).join("")}

                            </select>
                        </div>

                        <div class="form-group">
                            <label>Check-In *</label>

                            <input
                                type="date"
                                id="bookingCheckIn"
                                class="form-control"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label>Check-Out *</label>

                            <input
                                type="date"
                                id="bookingCheckOut"
                                class="form-control"
                                required
                            >
                        </div>

                    </div>
                </div>

                <div class="form-section">
                    <h3>Payment</h3>

                    <div class="form-grid">

                        <div class="form-group">
                            <label>Total Amount</label>

                            <input
                                type="number"
                                id="bookingTotal"
                                class="form-control"
                                min="0"
                                step="0.01"
                                value="0"
                            >
                        </div>

                        <div class="form-group">
                            <label>Advance Payment</label>

                            <input
                                type="number"
                                id="bookingAdvance"
                                class="form-control"
                                min="0"
                                step="0.01"
                                value="0"
                            >
                        </div>

                        <div class="form-group">
                            <label>Payment Method</label>

                            <select
                                id="bookingPaymentMethod"
                                class="form-control"
                            >
                                <option value="cash">Cash</option>
                                <option value="upi">UPI / QR</option>
                                <option value="card">Card</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                        </div>

                    </div>

                    <div
                        id="bookingPaymentSummary"
                        class="payment-summary"
                    ></div>

                </div>

                <div class="form-section">
                    <h3>Notes</h3>

                    <div class="form-group">
                        <textarea
                            id="bookingNotes"
                            class="form-control"
                            rows="3"
                            placeholder="Special request / notes"
                        ></textarea>
                    </div>
                </div>

                <div class="modal-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        data-close-modal
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Save Booking
                    </button>

                </div>

            </form>
            `,
            () => {}
        );

        const form =
            document.getElementById("bookingForm");

        const guestSelect =
            document.getElementById("bookingGuestSelect");

        guestSelect?.addEventListener("change", () => {

            const id = guestSelect.value;

            if (!id) {
                document.getElementById("bookingGuestName").value = "";
                document.getElementById("bookingGuestMobile").value = "";
                return;
            }

            const guest = getGuests().find(g =>
                String(g.id) === String(id)
            );

            if (!guest) return;

            document.getElementById("bookingGuestName").value =
                guest.fullName || guest.name || "";

            document.getElementById("bookingGuestMobile").value =
                guest.mobile || "";
        });

        document
            .getElementById("bookingAdvance")
            ?.addEventListener("input", updatePaymentSummary);

        document
            .getElementById("bookingTotal")
            ?.addEventListener("input", updatePaymentSummary);

        form?.addEventListener("submit", saveBooking);

        setDefaultDates();
        updatePaymentSummary();
    }

    /* ---------------------------------------------------------
       Save booking
       --------------------------------------------------------- */

    function saveBooking(event) {

        event.preventDefault();

        const id =
            document.getElementById("bookingEditId")?.value || "";

        const guestSelect =
            document.getElementById("bookingGuestSelect")?.value || "";

        const guestName =
            document.getElementById("bookingGuestName")?.value.trim() || "";

        const mobile =
            document.getElementById("bookingGuestMobile")?.value.trim() || "";

        const roomId =
            document.getElementById("bookingRoom")?.value || "";

        const checkIn =
            document.getElementById("bookingCheckIn")?.value || "";

        const checkOut =
            document.getElementById("bookingCheckOut")?.value || "";

        const total =
            Number(
                document.getElementById("bookingTotal")?.value || 0
            );

        const advance =
            Number(
                document.getElementById("bookingAdvance")?.value || 0
            );

        const paymentMethod =
            document.getElementById("bookingPaymentMethod")?.value ||
            "cash";

        const notes =
            document.getElementById("bookingNotes")?.value.trim() || "";

        if (!guestName) {
            HotelApp.showToast("Guest name is required", "error");
            return;
        }

        if (!/^[0-9]{10}$/.test(mobile)) {
            HotelApp.showToast(
                "Enter a valid 10 digit mobile number",
                "error"
            );
            return;
        }

        if (!roomId) {
            HotelApp.showToast("Please select a room", "error");
            return;
        }

        if (!checkIn || !checkOut) {
            HotelApp.showToast(
                "Check-in and check-out dates are required",
                "error"
            );
            return;
        }

        if (new Date(checkOut) <= new Date(checkIn)) {
            HotelApp.showToast(
                "Check-out must be after check-in",
                "error"
            );
            return;
        }

        if (advance < 0 || advance > total) {
            HotelApp.showToast(
                "Advance payment cannot be greater than total",
                "error"
            );
            return;
        }

        const rooms = getRooms();

        const room =
            rooms.find(r => String(r.id) === String(roomId));

        if (!room) {
            HotelApp.showToast("Selected room not found", "error");
            return;
        }

        /* Existing booking edit */
        if (id) {

            const bookings = getBookings();

            const index =
                bookings.findIndex(b =>
                    String(b.id) === String(id)
                );

            if (index === -1) {
                HotelApp.showToast(
                    "Booking not found",
                    "error"
                );
                return;
            }

            const oldBooking = bookings[index];

            bookings[index] = {
                ...oldBooking,

                guestId: guestSelect || oldBooking.guestId || "",
                guestName,
                mobile,

                roomId,
                roomNumber: room.roomNumber,

                checkIn,
                checkOut,

                totalAmount: total,
                advanceAmount: advance,
                paidAmount: advance,
                outstandingAmount: Math.max(
                    0,
                    total - advance
                ),

                paymentMethod,
                notes,

                updatedAt: new Date().toISOString()
            };

            saveBookings(bookings);

            HotelApp.closeModal();
            refreshTable();

            HotelApp.showToast(
                "Booking updated successfully",
                "success"
            );

            return;
        }

        /* Create / update guest */
        let guests = getGuests();

        let guest = guestSelect
            ? guests.find(g =>
                String(g.id) === String(guestSelect)
            )
            : null;

        if (!guest) {

            guest = guests.find(g =>
                String(g.mobile || "") === String(mobile)
            );

            if (!guest) {

                guest = {
                    id: HotelApp.generateId("guest"),
                    fullName: guestName,
                    mobile,
                    kyc: {
                        idType: "",
                        idNumber: "",
                        fullAddress: ""
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                guests.push(guest);
            }
        }

        saveGuests(guests);

        const bookings = getBookings();

        const booking = {
            id: HotelApp.generateId("booking"),

            bookingNumber:
                generateBookingNumber(),

            guestId: guest.id,

            guestName,
            mobile,

            roomId,
            roomNumber: room.roomNumber,

            checkIn,
            checkOut,

            totalAmount: total,
            advanceAmount: advance,
            paidAmount: advance,
            outstandingAmount: Math.max(
                0,
                total - advance
            ),

            paymentMethod,

            status: "confirmed",

            notes,

            invoiceId:
                HotelApp.generateId("invoice"),

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        bookings.push(booking);
        saveBookings(bookings);

        /* Room becomes occupied/reserved */
        const roomIndex =
            rooms.findIndex(r =>
                String(r.id) === String(roomId)
            );

        if (roomIndex !== -1) {

            rooms[roomIndex] = {
                ...rooms[roomIndex],

                status: "occupied",

                guestName,
                bookingId: booking.id,

                updatedAt: new Date().toISOString()
            };

            saveRooms(rooms);
        }

        HotelApp.closeModal();

        refreshTable();

        HotelApp.showToast(
            "Booking created successfully",
            "success"
        );
    }

    /* ---------------------------------------------------------
       Edit booking
       --------------------------------------------------------- */

    function editBooking(id) {

        const booking =
            getBookings().find(b =>
                String(b.id) === String(id)
            );

        if (!booking) return;

        openNewBooking();

        setTimeout(() => {

            document.getElementById("bookingEditId").value =
                booking.id;

            const guestSelect =
                document.getElementById("bookingGuestSelect");

            if (guestSelect) {
                guestSelect.value =
                    booking.guestId || "";
            }

            document.getElementById("bookingGuestName").value =
                booking.guestName || "";

            document.getElementById("bookingGuestMobile").value =
                booking.mobile || "";

            document.getElementById("bookingRoom").value =
                booking.roomId || "";

            document.getElementById("bookingCheckIn").value =
                normalizeDateInput(booking.checkIn);

            document.getElementById("bookingCheckOut").value =
                normalizeDateInput(booking.checkOut);

            document.getElementById("bookingTotal").value =
                Number(booking.totalAmount || 0);

            document.getElementById("bookingAdvance").value =
                Number(booking.advanceAmount || 0);

            document.getElementById("bookingPaymentMethod").value =
                booking.paymentMethod || "cash";

            document.getElementById("bookingNotes").value =
                booking.notes || "";

            updatePaymentSummary();

            const submit =
                document.querySelector("#bookingForm button[type='submit']");

            if (submit) {
                submit.textContent = "Update Booking";
            }

        }, 50);
    }

    /* ---------------------------------------------------------
       View booking
       --------------------------------------------------------- */

    function viewBooking(id) {

        const booking =
            getBookings().find(b =>
                String(b.id) === String(id)
            );

        if (!booking) return;

        const guestName =
            booking.guestName ||
            booking.guest?.fullName ||
            "Guest";

        const room =
            booking.roomNumber ||
            booking.room?.roomNumber ||
            "—";

        HotelApp.openModal(
            "Booking Details",
            `
            <div class="details-grid">

                <div class="detail-item">
                    <span>Booking Number</span>
                    <strong>
                        ${escapeHtml(
                            booking.bookingNumber ||
                            booking.bookingId ||
                            booking.id
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Status</span>
                    <strong>
                        ${statusBadge(booking.status)}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Guest</span>
                    <strong>
                        ${escapeHtml(guestName)}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Mobile</span>
                    <strong>
                        ${escapeHtml(
                            booking.mobile ||
                            booking.guestMobile ||
                            ""
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Room</span>
                    <strong>
                        Room ${escapeHtml(room)}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Check-In</span>
                    <strong>
                        ${formatDateValue(booking.checkIn)}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Check-Out</span>
                    <strong>
                        ${formatDateValue(booking.checkOut)}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Total</span>
                    <strong>
                        ${formatCurrency(
                            Number(booking.totalAmount || 0)
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Paid</span>
                    <strong>
                        ${formatCurrency(
                            Number(booking.paidAmount || 0)
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Outstanding</span>
                    <strong>
                        ${formatCurrency(
                            Number(
                                booking.outstandingAmount ||
                                0
                            )
                        )}
                    </strong>
                </div>

            </div>

            ${
                booking.notes
                ? `
                <div class="notes-box">
                    <strong>Notes</strong>
                    <p>${escapeHtml(booking.notes)}</p>
                </div>
                `
                : ""
            }

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    data-close-modal
                >
                    Close
                </button>

                ${
                    Number(booking.outstandingAmount || 0) > 0
                    ? `
                    <button
                        type="button"
                        class="btn btn-primary"
                        id="bookingPaymentBtn"
                    >
                        Add Payment
                    </button>
                    `
                    : ""
                }

            </div>
            `,
            () => {}
        );

        document
            .getElementById("bookingPaymentBtn")
            ?.addEventListener("click", () => {
                HotelApp.closeModal();
                openPayment(id);
            });
    }

    /* ---------------------------------------------------------
       Check-in
       --------------------------------------------------------- */

    function checkIn(id) {

        const bookings = getBookings();

        const index =
            bookings.findIndex(b =>
                String(b.id) === String(id)
            );

        if (index === -1) return;

        const booking = bookings[index];

        if (booking.status === "checked-in") {
            return;
        }

        if (booking.status === "cancelled") {
            HotelApp.showToast(
                "Cancelled booking cannot be checked in",
                "error"
            );
            return;
        }

        const rooms = getRooms();

        const roomIndex =
            rooms.findIndex(r =>
                String(r.id) === String(booking.roomId)
            );

        if (roomIndex !== -1) {

            const room = rooms[roomIndex];

            rooms[roomIndex] = {
                ...room,
                status: "occupied",
                guestName: booking.guestName,
                bookingId: booking.id,
                updatedAt: new Date().toISOString()
            };

            saveRooms(rooms);
        }

        bookings[index] = {
            ...booking,
            status: "checked-in",
            actualCheckIn: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        saveBookings(bookings);

        refreshTable();

        HotelApp.showToast(
            "Guest checked in successfully",
            "success"
        );
    }

    /* ---------------------------------------------------------
       Check-out
       --------------------------------------------------------- */

    function checkOut(id) {

        const bookings = getBookings();

        const index =
            bookings.findIndex(b =>
                String(b.id) === String(id)
            );

        if (index === -1) return;

        const booking = bookings[index];

        const outstanding =
            Number(booking.outstandingAmount || 0);

        if (outstanding > 0) {

            const proceed =
                confirm(
                    `Outstanding amount is ${formatCurrency(outstanding)}.\n\nContinue check-out?`
                );

            if (!proceed) return;
        }

        const rooms = getRooms();

        const roomIndex =
            rooms.findIndex(r =>
                String(r.id) === String(booking.roomId)
            );

        if (roomIndex !== -1) {

            rooms[roomIndex] = {
                ...rooms[roomIndex],

                status: "cleaning",

                guestName: "",
                bookingId: "",

                updatedAt: new Date().toISOString()
            };

            saveRooms(rooms);
        }

        bookings[index] = {
            ...booking,

            status: "checked-out",

            actualCheckOut:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };

        saveBookings(bookings);

        refreshTable();

        HotelApp.showToast(
            "Guest checked out successfully",
            "success"
        );
    }

    /* ---------------------------------------------------------
       Cancel booking
       --------------------------------------------------------- */

    function cancelBooking(id) {

        const booking =
            getBookings().find(b =>
                String(b.id) === String(id)
            );

        if (!booking) return;

        const proceed =
            confirm(
                "Are you sure you want to cancel this booking?"
            );

        if (!proceed) return;

        const bookings = getBookings();

        const index =
            bookings.findIndex(b =>
                String(b.id) === String(id)
            );

        if (index === -1) return;

        bookings[index] = {
            ...bookings[index],

            status: "cancelled",

            cancelledAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };

        saveBookings(bookings);

        const rooms = getRooms();

        const roomIndex =
            rooms.findIndex(r =>
                String(r.id) === String(booking.roomId)
            );

        if (roomIndex !== -1) {

            rooms[roomIndex] = {
                ...rooms[roomIndex],

                status: "available",

                guestName: "",
                bookingId: "",

                updatedAt:
                    new Date().toISOString()
            };

            saveRooms(rooms);
        }

        refreshTable();

        HotelApp.showToast(
            "Booking cancelled",
            "success"
        );
    }

    /* ---------------------------------------------------------
       Delete booking
       --------------------------------------------------------- */

    function deleteBooking(id) {

        const proceed =
            confirm(
                "Delete this booking permanently?"
            );

        if (!proceed) return;

        const bookings = getBookings();

        const filtered =
            bookings.filter(b =>
                String(b.id) !== String(id)
            );

        saveBookings(filtered);

        refreshTable();

        HotelApp.showToast(
            "Booking deleted",
            "success"
        );
    }

    /* ---------------------------------------------------------
       Payment
       --------------------------------------------------------- */

    function openPayment(id) {

        const booking =
            getBookings().find(b =>
                String(b.id) === String(id)
            );

        if (!booking) return;

        const outstanding =
            Number(booking.outstandingAmount || 0);

        HotelApp.openModal(
            "Add Payment",
            `
            <form id="bookingPaymentForm">

                <div class="payment-summary">

                    <div>
                        <span>Total</span>
                        <strong>
                            ${formatCurrency(
                                Number(
                                    booking.totalAmount || 0
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Already Paid</span>
                        <strong>
                            ${formatCurrency(
                                Number(
                                    booking.paidAmount || 0
                                )
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Outstanding</span>
                        <strong>
                            ${formatCurrency(outstanding)}
                        </strong>
                    </div>

                </div>

                <div class="form-group">
                    <label>Payment Amount *</label>

                    <input
                        type="number"
                        id="paymentAmount"
                        class="form-control"
                        min="1"
                        max="${outstanding}"
                        step="0.01"
                        value="${outstanding}"
                        required
                    >
                </div>

                <div class="form-group">
                    <label>Payment Method</label>

                    <select
                        id="paymentMethod"
                        class="form-control"
                    >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI / QR</option>
                        <option value="card">Card</option>
                        <option value="bank">Bank Transfer</option>
                    </select>
                </div>

                <div class="modal-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        data-close-modal
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Save Payment
                    </button>

                </div>

            </form>
            `
        );

        document
            .getElementById("bookingPaymentForm")
            ?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const amount =
                        Number(
                            document.getElementById(
                                "paymentAmount"
                            ).value || 0
                        );

                    const method =
                        document.getElementById(
                            "paymentMethod"
                        ).value;

                    if (amount <= 0 || amount > outstanding) {
                        HotelApp.showToast(
                            "Invalid payment amount",
                            "error"
                        );
                        return;
                    }

                    const bookings = getBookings();

                    const index =
                        bookings.findIndex(b =>
                            String(b.id) === String(id)
                        );

                    if (index === -1) return;

                    const oldPaid =
                        Number(
                            bookings[index].paidAmount || 0
                        );

                    const newPaid =
                        oldPaid + amount;

                    bookings[index] = {
                        ...bookings[index],

                        paidAmount: newPaid,

                        outstandingAmount:
                            Math.max(
                                0,
                                Number(
                                    bookings[index].totalAmount || 0
                                ) - newPaid
                            ),

                        paymentMethod: method,

                        updatedAt:
                            new Date().toISOString()
                    };

                    saveBookings(bookings);

                    HotelApp.closeModal();

                    refreshTable();

                    HotelApp.showToast(
                        "Payment added successfully",
                        "success"
                    );
                }
            );
    }

    /* ---------------------------------------------------------
       Payment summary
       --------------------------------------------------------- */

    function updatePaymentSummary() {

        const total =
            Number(
                document.getElementById("bookingTotal")?.value || 0
            );

        const advance =
            Number(
                document.getElementById("bookingAdvance")?.value || 0
            );

        const outstanding =
            Math.max(0, total - advance);

        const el =
            document.getElementById(
                "bookingPaymentSummary"
            );

        if (!el) return;

        el.innerHTML = `
            <div>
                <span>Total</span>
                <strong>
                    ${formatCurrency(total)}
                </strong>
            </div>

            <div>
                <span>Advance</span>
                <strong>
                    ${formatCurrency(advance)}
                </strong>
            </div>

            <div>
                <span>Outstanding</span>
                <strong>
                    ${formatCurrency(outstanding)}
                </strong>
            </div>
        `;
    }

    /* ---------------------------------------------------------
       Date defaults
       --------------------------------------------------------- */

    function setDefaultDates() {

        const today =
            new Date();

        const tomorrow =
            new Date(today);

        tomorrow.setDate(
            tomorrow.getDate() + 1
        );

        const checkIn =
            document.getElementById(
                "bookingCheckIn"
            );

        const checkOut =
            document.getElementById(
                "bookingCheckOut"
            );

        if (checkIn) {
            checkIn.value =
                formatInputDate(today);
        }

        if (checkOut) {
            checkOut.value =
                formatInputDate(tomorrow);
        }
    }

    /* ---------------------------------------------------------
       Helpers
       --------------------------------------------------------- */

    function generateBookingNumber() {

        const now =
            new Date();

        const date =
            now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0");

        const random =
            Math.floor(
                1000 + Math.random() * 9000
            );

        return `BK-${date}-${random}`;
    }

    function getPaymentStatus(booking) {

        const total =
            Number(booking.totalAmount || 0);

        const paid =
            Number(booking.paidAmount || 0);

        const outstanding =
            Math.max(0, total - paid);

        if (total <= 0) return "pending";

        if (outstanding <= 0) return "paid";

        if (paid > 0) return "partial";

        return "pending";
    }

    function paymentBadge(status) {

        const labels = {
            paid: "Paid",
            partial: "Partial",
            pending: "Pending"
        };

        return `
            <span class="badge badge-${status}">
                ${labels[status] || status}
            </span>
        `;
    }

    function statusBadge(status) {

        const labels = {
            pending: "Pending",
            confirmed: "Confirmed",
            "checked-in": "Checked In",
            "checked-out": "Checked Out",
            cancelled: "Cancelled"
        };

        return `
            <span class="badge badge-${safeId(status || "pending")}">
                ${labels[status] || status || "Pending"}
            </span>
        `;
    }

    function parseDate(value) {

        if (!value) return null;

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date;
    }

    function formatDateValue(value) {

        const date =
            parseDate(value);

        if (!date) return "—";

        if (typeof HotelApp.formatDate === "function") {
            return HotelApp.formatDate(date);
        }

        return date.toLocaleDateString("en-IN");
    }

    function normalizeDateInput(value) {

        if (!value) return "";

        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return formatInputDate(date);
    }

    function formatInputDate(date) {

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    function formatCurrency(value) {

        if (typeof HotelApp.formatCurrency === "function") {
            return HotelApp.formatCurrency(value);
        }

        return "₹" + Number(value || 0).toLocaleString("en-IN");
    }

    function escapeHtml(value) {

        if (
            typeof HotelApp.escapeHtml === "function"
        ) {
            return HotelApp.escapeHtml(String(value ?? ""));
        }

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function safeId(value) {

        return String(value ?? "")
            .replace(/[^a-zA-Z0-9_-]/g, "");
    }

    return {
        render,
        refreshTable,
        openNewBooking,
        viewBooking,
        editBooking,
        checkIn,
        checkOut,
        cancelBooking,
        deleteBooking
    };

})();