/* =========================================================
   HOTEL MANAGEMENT SOFTWARE
   Guests Module - V3-7 Design
   ========================================================= */

(function () {
    "use strict";

    const KEY_GUESTS = "hotelGuests";
    const KEY_BOOKINGS = "hotelBookings";

    window.Guests = {

        container: null,

        /* =================================================
           STORAGE
           ================================================= */

        getGuests: function () {
            return HotelApp.getStorage(
                KEY_GUESTS,
                []
            );
        },

        saveGuests: function (data) {
            HotelApp.setStorage(
                KEY_GUESTS,
                data
            );
        },

        getBookings: function () {
            return HotelApp.getStorage(
                KEY_BOOKINGS,
                []
            );
        },

        /* =================================================
           RENDER
           ================================================= */

        render: function (container) {

            if (!container) {
                return;
            }

            this.container = container;

            this.renderPage();
        },

        /* =================================================
           PAGE
           ================================================= */

        renderPage: function () {

            const guests =
                this.getGuests();

            const bookings =
                this.getBookings();

            const activeGuests =
                bookings.filter(
                    function (booking) {
                        return (
                            booking.status ===
                            "Booked" ||
                            booking.status ===
                            "Checked-In"
                        );
                    }
                ).length;

            this.container.innerHTML = `

                <div class="page-header">

                    <div>

                        <h2>
                            Guests
                        </h2>

                        <p class="muted">
                            Manage guest profiles and KYC details
                        </p>

                    </div>

                    <div class="page-header-actions">

                        <button
                            class="btn btn-primary"
                            onclick="Guests.openAddGuest()">
                            + New Guest
                        </button>

                    </div>

                </div>


                <!-- STATS -->

                <div class="stats-grid">

                    <div class="stat-card">

                        <div class="stat-card-top">

                            <span class="stat-label">
                                Total Guests
                            </span>

                            <div class="stat-icon">
                                👤
                            </div>

                        </div>

                        <div class="stat-value">
                            ${guests.length}
                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-card-top">

                            <span class="stat-label">
                                Active Guests
                            </span>

                            <div class="stat-icon">
                                🏨
                            </div>

                        </div>

                        <div class="stat-value">
                            ${activeGuests}
                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-card-top">

                            <span class="stat-label">
                                KYC Records
                            </span>

                            <div class="stat-icon">
                                🪪
                            </div>

                        </div>

                        <div class="stat-value">
                            ${guests.filter(
                                function (guest) {
                                    return (
                                        guest.idType &&
                                        guest.idNumber
                                    );
                                }
                            ).length}
                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-card-top">

                            <span class="stat-label">
                                With Address
                            </span>

                            <div class="stat-icon">
                                📍
                            </div>

                        </div>

                        <div class="stat-value">
                            ${guests.filter(
                                function (guest) {
                                    return !!guest.address;
                                }
                            ).length}
                        </div>

                    </div>

                </div>


                <!-- SEARCH -->

                <div class="card">

                    <div class="filter-bar">

                        <div class="filter-item">

                            <label>
                                Search Guest
                            </label>

                            <input
                                type="text"
                                id="guestSearch"
                                class="form-control"
                                placeholder="Name, mobile, ID..."
                                oninput="Guests.refreshTable()">

                        </div>

                    </div>

                    <div id="guestsTableArea"></div>

                </div>

            `;

            this.refreshTable();
        },

        /* =================================================
           TABLE
           ================================================= */

        refreshTable: function () {

            const search =
                (
                    document.getElementById(
                        "guestSearch"
                    )?.value || ""
                )
                .toLowerCase()
                .trim();

            let guests =
                this.getGuests();

            if (search) {

                guests =
                    guests.filter(
                        function (guest) {

                            const text = [

                                guest.fullName,
                                guest.name,
                                guest.mobile,
                                guest.phone,
                                guest.idType,
                                guest.idNumber,
                                guest.address

                            ]
                            .join(" ")
                            .toLowerCase();

                            return text.includes(
                                search
                            );
                        }
                    );
            }

            guests.sort(
                function (a, b) {

                    return new Date(
                        b.updatedAt ||
                        b.createdAt ||
                        0
                    ) -
                    new Date(
                        a.updatedAt ||
                        a.createdAt ||
                        0
                    );
                }
            );

            this.renderTable(
                guests
            );
        },

        renderTable: function (guests) {

            const area =
                document.getElementById(
                    "guestsTableArea"
                );

            if (!area) {
                return;
            }

            if (!guests.length) {

                area.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            👤
                        </div>

                        <h3>
                            No guests found
                        </h3>

                        <p>
                            New Guest button se
                            guest add karein.
                        </p>

                    </div>

                `;

                return;
            }

            area.innerHTML = `

                <div class="table-wrapper">

                    <table class="data-table">

                        <thead>

                            <tr>

                                <th>
                                    Guest
                                </th>

                                <th>
                                    Mobile
                                </th>

                                <th>
                                    ID
                                </th>

                                <th>
                                    Address
                                </th>

                                <th>
                                    Bookings
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${guests.map(
                                this.guestRow.bind(this)
                            ).join("")}

                        </tbody>

                    </table>

                </div>

            `;
        },

        /* =================================================
           GUEST ROW
           ================================================= */

        guestRow: function (guest) {

            const bookings =
                this.getBookings();

            const guestBookings =
                bookings.filter(
                    function (booking) {

                        return String(
                            booking.guestId
                        ) === String(
                            guest.id
                        );

                    }
                );

            return `

                <tr>

                    <td>

                        <strong>
                            ${this.escape(
                                guest.fullName ||
                                guest.name ||
                                "-"
                            )}
                        </strong>

                        <div class="muted">
                            ${this.formatDate(
                                guest.createdAt
                            )}
                        </div>

                    </td>


                    <td>

                        ${this.escape(
                            guest.mobile ||
                            guest.phone ||
                            "-"
                        )}

                    </td>


                    <td>

                        <strong>
                            ${this.escape(
                                guest.idType ||
                                "-"
                            )}
                        </strong>

                        <div class="muted">
                            ${this.escape(
                                guest.idNumber ||
                                ""
                            )}
                        </div>

                    </td>


                    <td>

                        <div class="guest-address-cell">

                            ${this.escape(
                                guest.address ||
                                "-"
                            )}

                        </div>

                    </td>


                    <td>

                        <strong>
                            ${guestBookings.length}
                        </strong>

                    </td>


                    <td>

                        <div class="table-actions">

                            <button
                                class="btn btn-sm btn-light"
                                onclick="Guests.viewGuest('${this.safeId(guest.id)}')">
                                View
                            </button>

                            <button
                                class="btn btn-sm btn-primary"
                                onclick="Guests.openEditGuest('${this.safeId(guest.id)}')">
                                Edit
                            </button>

                        </div>

                    </td>

                </tr>

            `;
        },

        /* =================================================
           ADD GUEST
           ================================================= */

        openAddGuest: function () {

            const content = `

                <form
                    id="guestForm"
                    onsubmit="Guests.saveGuest(event)">

                    <input
                        type="hidden"
                        id="guestEditId"
                        value="">


                    <div class="section-title">
                        Guest KYC Details
                    </div>


                    <div class="form-row">

                        <div class="form-group">

                            <label>
                                Full Name
                                <span class="required">*</span>
                            </label>

                            <input
                                type="text"
                                id="guestFullName"
                                class="form-control"
                                placeholder="Guest full name"
                                required>

                        </div>


                        <div class="form-group">

                            <label>
                                Mobile
                                <span class="required">*</span>
                            </label>

                            <input
                                type="tel"
                                id="guestMobileNumber"
                                class="form-control"
                                placeholder="10 digit mobile number"
                                maxlength="10"
                                required>

                        </div>

                    </div>


                    <div class="form-row">

                        <div class="form-group">

                            <label>
                                ID Type
                                <span class="required">*</span>
                            </label>

                            <select
                                id="guestKycIdType"
                                class="form-select"
                                required>

                                <option value="">
                                    Select ID Type
                                </option>

                                <option value="Aadhaar">
                                    Aadhaar
                                </option>

                                <option value="Passport">
                                    Passport
                                </option>

                                <option value="Driving Licence">
                                    Driving Licence
                                </option>

                                <option value="Voter ID">
                                    Voter ID
                                </option>

                                <option value="Other">
                                    Other
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label>
                                ID Number
                                <span class="required">*</span>
                            </label>

                            <input
                                type="text"
                                id="guestKycIdNumber"
                                class="form-control"
                                placeholder="ID number"
                                required>

                        </div>

                    </div>


                    <div class="form-group">

                        <label>
                            Full Address
                            <span class="required">*</span>
                        </label>

                        <textarea
                            id="guestFullAddress"
                            class="form-textarea"
                            placeholder="Complete guest address"
                            required></textarea>

                    </div>


                    <div class="modal-footer"
                         style="
                            margin:0 -20px -20px;
                         ">

                        <button
                            type="button"
                            class="btn btn-light"
                            data-modal-close>
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="btn btn-primary">
                            Save Guest
                        </button>

                    </div>

                </form>

            `;

            HotelApp.openModal(
                "New Guest",
                content
            );
        },

        /* =================================================
           EDIT GUEST
           ================================================= */

        openEditGuest: function (id) {

            const guest =
                this.getGuests().find(
                    function (item) {
                        return String(
                            item.id
                        ) === String(id);
                    }
                );

            if (!guest) {

                HotelApp.showToast(
                    "Guest nahi mila.",
                    "error"
                );

                return;
            }

            const content = `

                <form
                    id="guestForm"
                    onsubmit="Guests.saveGuest(event)">

                    <input
                        type="hidden"
                        id="guestEditId"
                        value="${this.escape(
                            guest.id
                        )}">


                    <div class="section-title">
                        Guest KYC Details
                    </div>


                    <div class="form-row">

                        <div class="form-group">

                            <label>
                                Full Name
                                <span class="required">*</span>
                            </label>

                            <input
                                type="text"
                                id="guestFullName"
                                class="form-control"
                                value="${this.escape(
                                    guest.fullName ||
                                    guest.name ||
                                    ""
                                )}"
                                required>

                        </div>


                        <div class="form-group">

                            <label>
                                Mobile
                                <span class="required">*</span>
                            </label>

                            <input
                                type="tel"
                                id="guestMobileNumber"
                                class="form-control"
                                maxlength="10"
                                value="${this.escape(
                                    guest.mobile ||
                                    guest.phone ||
                                    ""
                                )}"
                                required>

                        </div>

                    </div>


                    <div class="form-row">

                        <div class="form-group">

                            <label>
                                ID Type
                                <span class="required">*</span>
                            </label>

                            <select
                                id="guestKycIdType"
                                class="form-select"
                                required>

                                <option value="">
                                    Select ID Type
                                </option>

                                <option value="Aadhaar"
                                    ${guest.idType === "Aadhaar" ? "selected" : ""}>
                                    Aadhaar
                                </option>

                                <option value="Passport"
                                    ${guest.idType === "Passport" ? "selected" : ""}>
                                    Passport
                                </option>

                                <option value="Driving Licence"
                                    ${guest.idType === "Driving Licence" ? "selected" : ""}>
                                    Driving Licence
                                </option>

                                <option value="Voter ID"
                                    ${guest.idType === "Voter ID" ? "selected" : ""}>
                                    Voter ID
                                </option>

                                <option value="Other"
                                    ${guest.idType === "Other" ? "selected" : ""}>
                                    Other
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label>
                                ID Number
                                <span class="required">*</span>
                            </label>

                            <input
                                type="text"
                                id="guestKycIdNumber"
                                class="form-control"
                                value="${this.escape(
                                    guest.idNumber ||
                                    ""
                                )}"
                                required>

                        </div>

                    </div>


                    <div class="form-group">

                        <label>
                            Full Address
                            <span class="required">*</span>
                        </label>

                        <textarea
                            id="guestFullAddress"
                            class="form-textarea"
                            required>${this.escape(
                                guest.address ||
                                ""
                            )}</textarea>

                    </div>


                    <div class="modal-footer"
                         style="
                            margin:0 -20px -20px;
                         ">

                        <button
                            type="button"
                            class="btn btn-light"
                            data-modal-close>
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="btn btn-primary">
                            Update Guest
                        </button>

                    </div>

                </form>

            `;

            HotelApp.openModal(
                "Edit Guest",
                content
            );
        },

        /* =================================================
           SAVE GUEST
           ================================================= */

        saveGuest: function (event) {

            if (event) {
                event.preventDefault();
            }

            const editId =
                document.getElementById(
                    "guestEditId"
                )?.value || "";

            const fullName =
                document.getElementById(
                    "guestFullName"
                )?.value.trim();

            const mobile =
                document.getElementById(
                    "guestMobileNumber"
                )?.value.trim();

            const idType =
                document.getElementById(
                    "guestKycIdType"
                )?.value;

            const idNumber =
                document.getElementById(
                    "guestKycIdNumber"
                )?.value.trim();

            const address =
                document.getElementById(
                    "guestFullAddress"
                )?.value.trim();

            /* ---------------------------------------------
               VALIDATION
               --------------------------------------------- */

            if (!fullName) {

                HotelApp.showToast(
                    "Full name required hai.",
                    "error"
                );

                return;
            }

            if (!/^[0-9]{10}$/.test(mobile)) {

                HotelApp.showToast(
                    "Valid 10 digit mobile number enter karein.",
                    "error"
                );

                return;
            }

            if (!idType) {

                HotelApp.showToast(
                    "ID type select karein.",
                    "error"
                );

                return;
            }

            if (!idNumber) {

                HotelApp.showToast(
                    "ID number required hai.",
                    "error"
                );

                return;
            }

            if (!address) {

                HotelApp.showToast(
                    "Full address required hai.",
                    "error"
                );

                return;
            }

            const guests =
                this.getGuests();

            /* ---------------------------------------------
               EDIT
               --------------------------------------------- */

            if (editId) {

                const guest =
                    guests.find(
                        function (item) {
                            return String(
                                item.id
                            ) === String(
                                editId
                            );
                        }
                    );

                if (!guest) {

                    HotelApp.showToast(
                        "Guest nahi mila.",
                        "error"
                    );

                    return;
                }

                const duplicate =
                    guests.find(
                        function (item) {

                            return (
                                String(
                                    item.id
                                ) !== String(
                                    editId
                                ) &&
                                String(
                                    item.mobile ||
                                    item.phone ||
                                    ""
                                ) === String(
                                    mobile
                                )
                            );

                        }
                    );

                if (duplicate) {

                    HotelApp.showToast(
                        "Is mobile number ka guest already hai.",
                        "error"
                    );

                    return;
                }

                guest.fullName =
                    fullName;

                guest.name =
                    fullName;

                guest.mobile =
                    mobile;

                guest.phone =
                    mobile;

                guest.idType =
                    idType;

                guest.idNumber =
                    idNumber;

                guest.address =
                    address;

                guest.updatedAt =
                    new Date().toISOString();

                this.saveGuests(
                    guests
                );

                HotelApp.closeModal();

                HotelApp.showToast(
                    "Guest details update ho gayi.",
                    "success"
                );

                this.render(
                    document.getElementById(
                        "pageContainer"
                    )
                );

                return;
            }

            /* ---------------------------------------------
               NEW GUEST
               --------------------------------------------- */

            const duplicate =
                guests.find(
                    function (item) {

                        return String(
                            item.mobile ||
                            item.phone ||
                            ""
                        ) === String(
                            mobile
                        );

                    }
                );

            if (duplicate) {

                HotelApp.showToast(
                    "Is mobile number ka guest already hai.",
                    "error"
                );

                return;
            }

            const guest = {

                id:
                    HotelApp.generateId(
                        "GST"
                    ),

                fullName:
                    fullName,

                name:
                    fullName,

                mobile:
                    mobile,

                phone:
                    mobile,

                idType:
                    idType,

                idNumber:
                    idNumber,

                address:
                    address,

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            };

            guests.push(
                guest
            );

            this.saveGuests(
                guests
            );

            HotelApp.closeModal();

            HotelApp.showToast(
                "Guest successfully add ho gaya.",
                "success"
            );

            this.render(
                document.getElementById(
                    "pageContainer"
                )
            );
        },

        /* =================================================
           VIEW GUEST
           ================================================= */

        viewGuest: function (id) {

            const guest =
                this.getGuests().find(
                    function (item) {
                        return String(
                            item.id
                        ) === String(id);
                    }
                );

            if (!guest) {

                HotelApp.showToast(
                    "Guest nahi mila.",
                    "error"
                );

                return;
            }

            const bookings =
                this.getBookings()
                    .filter(
                        function (booking) {
                            return String(
                                booking.guestId
                            ) === String(
                                guest.id
                            );
                        }
                    );

            const activeBooking =
                bookings.find(
                    function (booking) {
                        return (
                            booking.status ===
                            "Booked" ||
                            booking.status ===
                            "Checked-In"
                        );
                    }
                );

            const content = `

                <div>

                    <div class="section-title">
                        Guest Information
                    </div>


                    <div class="detail-grid">

                        <div>

                            <span class="detail-label">
                                Full Name
                            </span>

                            <strong>
                                ${this.escape(
                                    guest.fullName ||
                                    guest.name ||
                                    "-"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span class="detail-label">
                                Mobile
                            </span>

                            <strong>
                                ${this.escape(
                                    guest.mobile ||
                                    guest.phone ||
                                    "-"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span class="detail-label">
                                ID Type
                            </span>

                            <strong>
                                ${this.escape(
                                    guest.idType ||
                                    "-"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span class="detail-label">
                                ID Number
                            </span>

                            <strong>
                                ${this.escape(
                                    guest.idNumber ||
                                    "-"
                                )}
                            </strong>

                        </div>


                        <div style="grid-column:1/-1;">

                            <span class="detail-label">
                                Full Address
                            </span>

                            <strong>
                                ${this.escape(
                                    guest.address ||
                                    "-"
                                )}
                            </strong>

                        </div>

                    </div>


                    ${
                        activeBooking
                        ? `

                            <div class="section-title">
                                Current Stay
                            </div>

                            <div class="alert alert-info">

                                <strong>
                                    Room ${this.escape(
                                        activeBooking.roomNumber
                                    )}
                                </strong>

                                <br>

                                ${this.escape(
                                    activeBooking.status
                                )}

                                <br>

                                ${this.formatDate(
                                    activeBooking.checkIn
                                )}
                                -
                                ${this.formatDate(
                                    activeBooking.checkOut
                                )}

                            </div>

                        `
                        : ""
                    }


                    <div class="section-title">
                        Booking History
                    </div>


                    ${
                        bookings.length
                        ? `

                            <div class="table-wrapper">

                                <table class="data-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                Booking
                                            </th>

                                            <th>
                                                Room
                                            </th>

                                            <th>
                                                Stay
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Total
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        ${bookings.map(
                                            function (booking) {

                                                return `

                                                    <tr>

                                                        <td>
                                                            ${this.escape(
                                                                booking.bookingNumber ||
                                                                "-"
                                                            )}
                                                        </td>

                                                        <td>
                                                            ${this.escape(
                                                                booking.roomNumber ||
                                                                "-"
                                                            )}
                                                        </td>

                                                        <td>
                                                            ${this.formatDate(
                                                                booking.checkIn
                                                            )}
                                                            -
                                                            ${this.formatDate(
                                                                booking.checkOut
                                                            )}
                                                        </td>

                                                        <td>
                                                            ${this.escape(
                                                                booking.status ||
                                                                "-"
                                                            )}
                                                        </td>

                                                        <td>
                                                            ${this.money(
                                                                booking.totalAmount
                                                            )}
                                                        </td>

                                                    </tr>

                                                `;

                                            }.bind(this)
                                        ).join("")}

                                    </tbody>

                                </table>

                            </div>

                        `
                        : `

                            <div class="empty-state">

                                <p>
                                    Is guest ki koi booking nahi hai.
                                </p>

                            </div>

                        `
                    }


                    <div class="modal-footer"
                         style="
                            margin:20px -20px -20px;
                         ">

                        <button
                            type="button"
                            class="btn btn-light"
                            data-modal-close>
                            Close
                        </button>

                    </div>

                </div>

            `;

            HotelApp.openModal(
                "Guest Details",
                content
            );
        },

        /* =================================================
           HELPERS
           ================================================= */

        money: function (value) {

            return HotelApp.formatCurrency(
                Number(value) || 0
            );
        },

        formatDate: function (value) {

            if (!value) {
                return "-";
            }

            return HotelApp.formatDate(
                value
            );
        },

        escape: function (value) {

            return HotelApp.escapeHtml(
                value == null
                    ? ""
                    : String(value)
            );
        },

        safeId: function (value) {

            return String(
                value == null
                    ? ""
                    : value
            )
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'");
        }

    };

})();