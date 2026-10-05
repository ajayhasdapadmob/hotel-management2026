/* =========================================================
   HOTEL MANAGEMENT SYSTEM - BILLING
   V3-7 MASTER STYLE
   ========================================================= */

window.Billing = (() => {

    const BOOKINGS_KEY = "hotelBookings";
    const INVOICES_KEY = "hotelInvoices";
    const PAYMENTS_KEY = "hotelPayments";

    let container = null;

    /* ---------------------------------------------------------
       Storage
       --------------------------------------------------------- */

    function getBookings() {
        return HotelApp.getStorage(BOOKINGS_KEY, []);
    }

    function saveBookings(data) {
        HotelApp.setStorage(BOOKINGS_KEY, data);
    }

    function getInvoices() {
        return HotelApp.getStorage(INVOICES_KEY, []);
    }

    function saveInvoices(data) {
        HotelApp.setStorage(INVOICES_KEY, data);
    }

    function getPayments() {
        return HotelApp.getStorage(PAYMENTS_KEY, []);
    }

    function savePayments(data) {
        HotelApp.setStorage(PAYMENTS_KEY, data);
    }

    /* ---------------------------------------------------------
       Render
       --------------------------------------------------------- */

    function render(target) {
        container = target;
        renderPage();
    }

    function renderPage() {

        if (!container) return;

        const bookings = getBookings();

        const totalRevenue =
            bookings.reduce(
                (sum, booking) =>
                    sum + Number(booking.paidAmount || 0),
                0
            );

        const outstanding =
            bookings.reduce(
                (sum, booking) =>
                    sum + Number(
                        booking.outstandingAmount || 0
                    ),
                0
            );

        const invoiceCount =
            getInvoices().length;

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>Billing</h1>
                    <p>Invoices, payments and outstanding amounts</p>
                </div>

                <button
                    class="btn btn-primary"
                    id="createInvoiceBtn"
                >
                    + New Invoice
                </button>
            </div>

            <div class="stats-grid">

                <div class="stat-card">
                    <div class="stat-card-icon">🧾</div>
                    <div>
                        <div class="stat-card-label">
                            Total Invoices
                        </div>
                        <div class="stat-card-value">
                            ${invoiceCount}
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-card-icon">💰</div>
                    <div>
                        <div class="stat-card-label">
                            Paid Amount
                        </div>
                        <div class="stat-card-value">
                            ${formatCurrency(totalRevenue)}
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-card-icon">⏳</div>
                    <div>
                        <div class="stat-card-label">
                            Outstanding
                        </div>
                        <div class="stat-card-value">
                            ${formatCurrency(outstanding)}
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-card-icon">📊</div>
                    <div>
                        <div class="stat-card-label">
                            Total Billing
                        </div>
                        <div class="stat-card-value">
                            ${formatCurrency(
                                totalRevenue + outstanding
                            )}
                        </div>
                    </div>
                </div>

            </div>

            <div class="card">

                <div class="filter-bar">

                    <div class="search-box">
                        <span>🔍</span>

                        <input
                            type="text"
                            id="billingSearch"
                            placeholder="Search invoice, guest, mobile or room..."
                        >
                    </div>

                    <select
                        id="billingStatusFilter"
                        class="form-control"
                    >
                        <option value="">All Payments</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="pending">Pending</option>
                    </select>

                </div>

                <div id="billingTableContainer"></div>

            </div>
        `;

        document
            .getElementById("billingSearch")
            ?.addEventListener(
                "input",
                refreshTable
            );

        document
            .getElementById("billingStatusFilter")
            ?.addEventListener(
                "change",
                refreshTable
            );

        document
            .getElementById("createInvoiceBtn")
            ?.addEventListener(
                "click",
                openCreateInvoice
            );

        refreshTable();
    }

    /* ---------------------------------------------------------
       Refresh table
       --------------------------------------------------------- */

    function refreshTable() {

        const tableContainer =
            document.getElementById(
                "billingTableContainer"
            );

        if (!tableContainer) return;

        const search =
            (
                document.getElementById(
                    "billingSearch"
                )?.value || ""
            )
                .trim()
                .toLowerCase();

        const statusFilter =
            document.getElementById(
                "billingStatusFilter"
            )?.value || "";

        const bookings = getBookings();

        const invoices = getInvoices();

        const rows = [];

        /*
         * Existing invoices
         */
        invoices.forEach(invoice => {

            const booking =
                bookings.find(b =>
                    String(b.id) ===
                    String(invoice.bookingId)
                );

            rows.push({
                ...invoice,

                bookingId:
                    invoice.bookingId ||
                    booking?.id ||
                    "",

                guestName:
                    invoice.guestName ||
                    booking?.guestName ||
                    "Guest",

                mobile:
                    invoice.mobile ||
                    booking?.mobile ||
                    "",

                roomNumber:
                    invoice.roomNumber ||
                    booking?.roomNumber ||
                    "",

                totalAmount:
                    Number(
                        invoice.totalAmount ??
                        booking?.totalAmount ??
                        0
                    ),

                paidAmount:
                    Number(
                        invoice.paidAmount ??
                        booking?.paidAmount ??
                        0
                    ),

                outstandingAmount:
                    Number(
                        invoice.outstandingAmount ??
                        booking?.outstandingAmount ??
                        0
                    )
            });
        });

        /*
         * If booking has no invoice record yet,
         * show it as billing row.
         */
        bookings.forEach(booking => {

            const alreadyExists =
                rows.some(row =>
                    String(row.bookingId) ===
                    String(booking.id)
                );

            if (alreadyExists) return;

            rows.push({
                id:
                    booking.invoiceId ||
                    booking.id,

                invoiceNumber:
                    generateInvoiceNumberFromBooking(
                        booking
                    ),

                bookingId:
                    booking.id,

                guestName:
                    booking.guestName || "Guest",

                mobile:
                    booking.mobile || "",

                roomNumber:
                    booking.roomNumber || "",

                totalAmount:
                    Number(
                        booking.totalAmount || 0
                    ),

                paidAmount:
                    Number(
                        booking.paidAmount || 0
                    ),

                outstandingAmount:
                    Number(
                        booking.outstandingAmount || 0
                    ),

                createdAt:
                    booking.createdAt
            });
        });

        const filtered =
            rows.filter(invoice => {

                const searchable = `
                    ${invoice.invoiceNumber || ""}
                    ${invoice.guestName || ""}
                    ${invoice.mobile || ""}
                    ${invoice.roomNumber || ""}
                    ${invoice.bookingId || ""}
                `.toLowerCase();

                if (
                    search &&
                    !searchable.includes(search)
                ) {
                    return false;
                }

                const paymentStatus =
                    getPaymentStatus(invoice);

                if (
                    statusFilter &&
                    paymentStatus !== statusFilter
                ) {
                    return false;
                }

                return true;
            });

        filtered.sort((a, b) => {

            const da =
                new Date(
                    a.createdAt || 0
                ).getTime();

            const db =
                new Date(
                    b.createdAt || 0
                ).getTime();

            return db - da;
        });

        if (!filtered.length) {

            tableContainer.innerHTML = `
                <div class="empty-state">

                    <div class="empty-state-icon">
                        🧾
                    </div>

                    <h3>No invoices found</h3>

                    <p>
                        Create an invoice or change your search.
                    </p>

                </div>
            `;

            return;
        }

        tableContainer.innerHTML = `
            <div class="table-responsive">

                <table class="data-table">

                    <thead>

                        <tr>
                            <th>Invoice</th>
                            <th>Guest</th>
                            <th>Room</th>
                            <th>Total</th>
                            <th>Paid</th>
                            <th>Outstanding</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>

                    </thead>

                    <tbody>
                        ${filtered
                            .map(invoiceRow)
                            .join("")}
                    </tbody>

                </table>

            </div>
        `;

        tableContainer
            .querySelectorAll(
                "[data-billing-action]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.billingAction;

                        const id =
                            button.dataset.id;

                        if (action === "view") {
                            viewInvoice(id);
                        }

                        if (action === "pay") {
                            openPayment(id);
                        }

                        if (action === "print") {
                            printInvoice(id);
                        }
                    }
                );
            });
    }

    /* ---------------------------------------------------------
       Invoice row
       --------------------------------------------------------- */

    function invoiceRow(invoice) {

        const status =
            getPaymentStatus(invoice);

        return `
            <tr>

                <td>
                    <strong>
                        ${escapeHtml(
                            invoice.invoiceNumber ||
                            invoice.id ||
                            "INV"
                        )}
                    </strong>
                </td>

                <td>

                    <strong>
                        ${escapeHtml(
                            invoice.guestName ||
                            "Guest"
                        )}
                    </strong>

                    <br>

                    <small>
                        ${escapeHtml(
                            invoice.mobile || ""
                        )}
                    </small>

                </td>

                <td>
                    Room
                    ${escapeHtml(
                        invoice.roomNumber || "—"
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        invoice.totalAmount
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        invoice.paidAmount
                    )}
                </td>

                <td>
                    <strong>
                        ${formatCurrency(
                            invoice.outstandingAmount
                        )}
                    </strong>
                </td>

                <td>
                    ${paymentBadge(status)}
                </td>

                <td>

                    <div class="action-buttons">

                        <button
                            class="btn btn-sm btn-secondary"
                            data-billing-action="view"
                            data-id="${safeId(invoice.id)}"
                        >
                            View
                        </button>

                        ${
                            Number(
                                invoice.outstandingAmount || 0
                            ) > 0
                            ? `
                            <button
                                class="btn btn-sm btn-primary"
                                data-billing-action="pay"
                                data-id="${safeId(invoice.id)}"
                            >
                                Pay
                            </button>
                            `
                            : ""
                        }

                        <button
                            class="btn btn-sm btn-secondary"
                            data-billing-action="print"
                            data-id="${safeId(invoice.id)}"
                        >
                            Print
                        </button>

                    </div>

                </td>

            </tr>
        `;
    }

    /* ---------------------------------------------------------
       Create invoice
       --------------------------------------------------------- */

    function openCreateInvoice() {

        const bookings =
            getBookings().filter(booking =>
                booking.status !== "cancelled"
            );

        if (!bookings.length) {

            HotelApp.showToast(
                "Create a booking first",
                "error"
            );

            return;
        }

        HotelApp.openModal(
            "New Invoice",
            `
            <form id="invoiceForm">

                <div class="form-group">

                    <label>
                        Booking *
                    </label>

                    <select
                        id="invoiceBooking"
                        class="form-control"
                        required
                    >

                        <option value="">
                            Select Booking
                        </option>

                        ${bookings.map(booking => `
                            <option
                                value="${safeId(
                                    booking.id
                                )}"
                            >
                                ${escapeHtml(
                                    booking.bookingNumber ||
                                    booking.id
                                )}
                                -
                                ${escapeHtml(
                                    booking.guestName ||
                                    "Guest"
                                )}
                                -
                                Room
                                ${escapeHtml(
                                    booking.roomNumber ||
                                    ""
                                )}
                            </option>
                        `).join("")}

                    </select>

                </div>

                <div
                    id="selectedBookingDetails"
                    class="payment-summary"
                ></div>

                <div class="form-grid">

                    <div class="form-group">

                        <label>
                            Total Amount
                        </label>

                        <input
                            type="number"
                            id="invoiceTotal"
                            class="form-control"
                            min="0"
                            step="0.01"
                            value="0"
                            required
                        >

                    </div>

                    <div class="form-group">

                        <label>
                            Paid Amount
                        </label>

                        <input
                            type="number"
                            id="invoicePaid"
                            class="form-control"
                            min="0"
                            step="0.01"
                            value="0"
                        >

                    </div>

                </div>

                <div class="form-group">

                    <label>
                        Payment Method
                    </label>

                    <select
                        id="invoicePaymentMethod"
                        class="form-control"
                    >
                        <option value="cash">
                            Cash
                        </option>

                        <option value="upi">
                            UPI / QR
                        </option>

                        <option value="card">
                            Card
                        </option>

                        <option value="bank">
                            Bank Transfer
                        </option>
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
                        Create Invoice
                    </button>

                </div>

            </form>
            `
        );

        const bookingSelect =
            document.getElementById(
                "invoiceBooking"
            );

        bookingSelect?.addEventListener(
            "change",
            () => {

                const booking =
                    bookings.find(b =>
                        String(b.id) ===
                        String(
                            bookingSelect.value
                        )
                    );

                if (!booking) return;

                document.getElementById(
                    "invoiceTotal"
                ).value =
                    Number(
                        booking.totalAmount || 0
                    );

                document.getElementById(
                    "invoicePaid"
                ).value =
                    Number(
                        booking.paidAmount || 0
                    );

                updateSelectedBookingDetails(
                    booking
                );
            }
        );

        document
            .getElementById("invoiceForm")
            ?.addEventListener(
                "submit",
                saveNewInvoice
            );
    }

    /* ---------------------------------------------------------
       Save invoice
       --------------------------------------------------------- */

    function saveNewInvoice(event) {

        event.preventDefault();

        const bookingId =
            document.getElementById(
                "invoiceBooking"
            )?.value || "";

        const total =
            Number(
                document.getElementById(
                    "invoiceTotal"
                )?.value || 0
            );

        const paid =
            Number(
                document.getElementById(
                    "invoicePaid"
                )?.value || 0
            );

        const method =
            document.getElementById(
                "invoicePaymentMethod"
            )?.value || "cash";

        if (!bookingId) {

            HotelApp.showToast(
                "Please select a booking",
                "error"
            );

            return;
        }

        if (total < 0 || paid < 0) {

            HotelApp.showToast(
                "Invalid amount",
                "error"
            );

            return;
        }

        if (paid > total) {

            HotelApp.showToast(
                "Paid amount cannot exceed total",
                "error"
            );

            return;
        }

        const bookings =
            getBookings();

        const booking =
            bookings.find(b =>
                String(b.id) ===
                String(bookingId)
            );

        if (!booking) {

            HotelApp.showToast(
                "Booking not found",
                "error"
            );

            return;
        }

        const invoices =
            getInvoices();

        const existing =
            invoices.findIndex(invoice =>
                String(invoice.bookingId) ===
                String(bookingId)
            );

        const invoice = {

            id:
                existing >= 0
                ? invoices[existing].id
                : HotelApp.generateId("invoice"),

            invoiceNumber:
                existing >= 0
                ? invoices[existing].invoiceNumber
                : generateInvoiceNumber(),

            bookingId:
                booking.id,

            guestId:
                booking.guestId || "",

            guestName:
                booking.guestName || "Guest",

            mobile:
                booking.mobile || "",

            roomId:
                booking.roomId || "",

            roomNumber:
                booking.roomNumber || "",

            totalAmount:
                total,

            paidAmount:
                paid,

            outstandingAmount:
                Math.max(0, total - paid),

            paymentMethod:
                method,

            createdAt:
                existing >= 0
                ? invoices[existing].createdAt
                : new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        };

        if (existing >= 0) {
            invoices[existing] = invoice;
        } else {
            invoices.push(invoice);
        }

        saveInvoices(invoices);

        /*
         * Keep booking billing synchronized.
         */
        const bookingIndex =
            bookings.findIndex(b =>
                String(b.id) ===
                String(bookingId)
            );

        if (bookingIndex !== -1) {

            bookings[bookingIndex] = {
                ...bookings[bookingIndex],

                invoiceId:
                    invoice.id,

                totalAmount:
                    total,

                paidAmount:
                    paid,

                outstandingAmount:
                    Math.max(
                        0,
                        total - paid
                    ),

                paymentMethod:
                    method,

                updatedAt:
                    new Date().toISOString()
            };

            saveBookings(bookings);
        }

        /*
         * If payment was made now,
         * create payment record.
         */
        if (paid > 0) {

            const payments =
                getPayments();

            payments.push({
                id:
                    HotelApp.generateId("payment"),

                invoiceId:
                    invoice.id,

                bookingId:
                    booking.id,

                amount:
                    paid,

                method,

                source:
                    "hotel",

                createdAt:
                    new Date().toISOString()
            });

            savePayments(payments);
        }

        HotelApp.closeModal();

        refreshTable();

        HotelApp.showToast(
            "Invoice created successfully",
            "success"
        );
    }

    /* ---------------------------------------------------------
       View invoice
       --------------------------------------------------------- */

    function viewInvoice(id) {

        const invoice =
            findInvoice(id);

        if (!invoice) return;

        HotelApp.openModal(
            "Invoice Details",
            `
            <div class="details-grid">

                <div class="detail-item">
                    <span>Invoice</span>
                    <strong>
                        ${escapeHtml(
                            invoice.invoiceNumber ||
                            invoice.id
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Guest</span>
                    <strong>
                        ${escapeHtml(
                            invoice.guestName ||
                            "Guest"
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Mobile</span>
                    <strong>
                        ${escapeHtml(
                            invoice.mobile || ""
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Room</span>
                    <strong>
                        ${escapeHtml(
                            invoice.roomNumber ||
                            "—"
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Total</span>
                    <strong>
                        ${formatCurrency(
                            invoice.totalAmount
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Paid</span>
                    <strong>
                        ${formatCurrency(
                            invoice.paidAmount
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Outstanding</span>
                    <strong>
                        ${formatCurrency(
                            invoice.outstandingAmount
                        )}
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Status</span>
                    <strong>
                        ${paymentBadge(
                            getPaymentStatus(invoice)
                        )}
                    </strong>
                </div>

            </div>

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    data-close-modal
                >
                    Close
                </button>

                ${
                    Number(
                        invoice.outstandingAmount || 0
                    ) > 0
                    ? `
                    <button
                        type="button"
                        class="btn btn-primary"
                        id="invoicePayBtn"
                    >
                        Pay Outstanding
                    </button>
                    `
                    : ""
                }

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="invoicePrintBtn"
                >
                    Print Invoice
                </button>

            </div>
            `
        );

        document
            .getElementById("invoicePayBtn")
            ?.addEventListener(
                "click",
                () => {
                    HotelApp.closeModal();
                    openPayment(invoice.id);
                }
            );

        document
            .getElementById("invoicePrintBtn")
            ?.addEventListener(
                "click",
                () => {
                    HotelApp.closeModal();
                    printInvoice(invoice.id);
                }
            );
    }

    /* ---------------------------------------------------------
       Payment
       --------------------------------------------------------- */

    function openPayment(id) {

        const invoice =
            findInvoice(id);

        if (!invoice) return;

        const outstanding =
            Number(
                invoice.outstandingAmount || 0
            );

        if (outstanding <= 0) {

            HotelApp.showToast(
                "Invoice is already fully paid",
                "success"
            );

            return;
        }

        HotelApp.openModal(
            "Payment",
            `
            <div class="payment-summary">

                <div>
                    <span>Invoice</span>
                    <strong>
                        ${escapeHtml(
                            invoice.invoiceNumber
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total</span>
                    <strong>
                        ${formatCurrency(
                            invoice.totalAmount
                        )}
                    </strong>
                </div>

                <div>
                    <span>Already Paid</span>
                    <strong>
                        ${formatCurrency(
                            invoice.paidAmount
                        )}
                    </strong>
                </div>

                <div>
                    <span>Outstanding</span>
                    <strong>
                        ${formatCurrency(
                            outstanding
                        )}
                    </strong>
                </div>

            </div>

            <form id="billingPaymentForm">

                <div class="form-group">

                    <label>
                        Payment Amount *
                    </label>

                    <input
                        type="number"
                        id="billingPaymentAmount"
                        class="form-control"
                        min="1"
                        max="${outstanding}"
                        step="0.01"
                        value="${outstanding}"
                        required
                    >

                </div>

                <div class="form-group">

                    <label>
                        Payment Method
                    </label>

                    <select
                        id="billingPaymentMethod"
                        class="form-control"
                    >

                        <option value="cash">
                            Cash
                        </option>

                        <option value="upi">
                            UPI / QR
                        </option>

                        <option value="card">
                            Card
                        </option>

                        <option value="bank">
                            Bank Transfer
                        </option>

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
            .getElementById(
                "billingPaymentForm"
            )
            ?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const amount =
                        Number(
                            document.getElementById(
                                "billingPaymentAmount"
                            ).value || 0
                        );

                    const method =
                        document.getElementById(
                            "billingPaymentMethod"
                        ).value;

                    if (
                        amount <= 0 ||
                        amount > outstanding
                    ) {

                        HotelApp.showToast(
                            "Invalid payment amount",
                            "error"
                        );

                        return;
                    }

                    const invoices =
                        getInvoices();

                    const index =
                        invoices.findIndex(
                            invoice =>
                                String(invoice.id) ===
                                String(id)
                        );

                    if (index === -1) return;

                    const oldPaid =
                        Number(
                            invoices[index].paidAmount ||
                            0
                        );

                    const newPaid =
                        oldPaid + amount;

                    const newOutstanding =
                        Math.max(
                            0,
                            Number(
                                invoices[index]
                                    .totalAmount || 0
                            ) - newPaid
                        );

                    invoices[index] = {
                        ...invoices[index],

                        paidAmount:
                            newPaid,

                        outstandingAmount:
                            newOutstanding,

                        paymentMethod:
                            method,

                        updatedAt:
                            new Date().toISOString()
                    };

                    saveInvoices(invoices);

                    /*
                     * Synchronize booking.
                     */
                    const bookings =
                        getBookings();

                    const bookingIndex =
                        bookings.findIndex(
                            booking =>
                                String(
                                    booking.id
                                ) ===
                                String(
                                    invoices[index]
                                        .bookingId
                                )
                        );

                    if (bookingIndex !== -1) {

                        bookings[bookingIndex] = {
                            ...bookings[
                                bookingIndex
                            ],

                            paidAmount:
                                newPaid,

                            outstandingAmount:
                                newOutstanding,

                            updatedAt:
                                new Date().toISOString()
                        };

                        saveBookings(bookings);
                    }

                    /*
                     * Payment history
                     */
                    const payments =
                        getPayments();

                    payments.push({
                        id:
                            HotelApp.generateId(
                                "payment"
                            ),

                        invoiceId:
                            invoices[index].id,

                        bookingId:
                            invoices[index]
                                .bookingId,

                        amount,

                        method,

                        source:
                            "hotel",

                        createdAt:
                            new Date().toISOString()
                    });

                    savePayments(payments);

                    HotelApp.closeModal();

                    refreshTable();

                    HotelApp.showToast(
                        "Payment saved successfully",
                        "success"
                    );
                }
            );
    }

    /* ---------------------------------------------------------
       Print invoice
       --------------------------------------------------------- */

    function printInvoice(id) {

        const invoice =
            findInvoice(id);

        if (!invoice) return;

        /*
         * IMPORTANT:
         * QR is intentionally NOT printed.
         */

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=900,height=700"
            );

        if (!printWindow) {

            HotelApp.showToast(
                "Please allow popup for printing",
                "error"
            );

            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>

            <html>

            <head>

                <title>
                    ${escapeHtml(
                        invoice.invoiceNumber ||
                        "Invoice"
                    )}
                </title>

                <style>

                    body {
                        font-family: Arial, sans-serif;
                        margin: 40px;
                        color: #222;
                    }

                    .invoice {
                        max-width: 800px;
                        margin: auto;
                    }

                    h1 {
                        margin-bottom: 5px;
                    }

                    .muted {
                        color: #666;
                    }

                    .line {
                        border-top: 1px solid #ddd;
                        margin: 20px 0;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }

                    th,
                    td {
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: left;
                    }

                    .right {
                        text-align: right;
                    }

                    .total {
                        font-size: 18px;
                        font-weight: bold;
                    }

                    @media print {
                        body {
                            margin: 10px;
                        }
                    }

                </style>

            </head>

            <body>

                <div class="invoice">

                    <h1>HOTEL INVOICE</h1>

                    <div class="muted">
                        Invoice:
                        ${escapeHtml(
                            invoice.invoiceNumber ||
                            ""
                        )}
                    </div>

                    <div class="line"></div>

                    <p>
                        <strong>Guest:</strong>
                        ${escapeHtml(
                            invoice.guestName ||
                            "Guest"
                        )}
                    </p>

                    <p>
                        <strong>Mobile:</strong>
                        ${escapeHtml(
                            invoice.mobile ||
                            ""
                        )}
                    </p>

                    <p>
                        <strong>Room:</strong>
                        ${escapeHtml(
                            invoice.roomNumber ||
                            "—"
                        )}
                    </p>

                    <table>

                        <thead>

                            <tr>
                                <th>Description</th>
                                <th class="right">
                                    Amount
                                </th>
                            </tr>

                        </thead>

                        <tbody>

                            <tr>
                                <td>
                                    Hotel / Room Charges
                                </td>

                                <td class="right">
                                    ${formatCurrency(
                                        invoice.totalAmount
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    Paid
                                </td>

                                <td class="right">
                                    ${formatCurrency(
                                        invoice.paidAmount
                                    )}
                                </td>
                            </tr>

                            <tr>
                                <td class="total">
                                    Outstanding
                                </td>

                                <td class="right total">
                                    ${formatCurrency(
                                        invoice.outstandingAmount
                                    )}
                                </td>
                            </tr>

                        </tbody>

                    </table>

                    <div class="line"></div>

                    <p>
                        Payment Status:
                        <strong>
                            ${capitalize(
                                getPaymentStatus(
                                    invoice
                                )
                            )}
                        </strong>
                    </p>

                    <p class="muted">
                        Thank you for staying with us.
                    </p>

                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                <\/script>

            </body>

            </html>
        `);

        printWindow.document.close();
    }

    /* ---------------------------------------------------------
       Helpers
       --------------------------------------------------------- */

    function findInvoice(id) {

        let invoice =
            getInvoices().find(invoice =>
                String(invoice.id) ===
                String(id)
            );

        if (invoice) return invoice;

        const booking =
            getBookings().find(booking =>
                String(
                    booking.invoiceId ||
                    booking.id
                ) === String(id)
            );

        if (!booking) return null;

        return {
            id:
                booking.invoiceId ||
                booking.id,

            invoiceNumber:
                generateInvoiceNumberFromBooking(
                    booking
                ),

            bookingId:
                booking.id,

            guestId:
                booking.guestId || "",

            guestName:
                booking.guestName || "Guest",

            mobile:
                booking.mobile || "",

            roomNumber:
                booking.roomNumber || "",

            totalAmount:
                Number(
                    booking.totalAmount || 0
                ),

            paidAmount:
                Number(
                    booking.paidAmount || 0
                ),

            outstandingAmount:
                Number(
                    booking.outstandingAmount || 0
                ),

            createdAt:
                booking.createdAt
        };
    }

    function updateSelectedBookingDetails(
        booking
    ) {

        const element =
            document.getElementById(
                "selectedBookingDetails"
            );

        if (!element) return;

        element.innerHTML = `
            <div>
                <span>Guest</span>
                <strong>
                    ${escapeHtml(
                        booking.guestName ||
                        "Guest"
                    )}
                </strong>
            </div>

            <div>
                <span>Room</span>
                <strong>
                    ${escapeHtml(
                        booking.roomNumber ||
                        "—"
                    )}
                </strong>
            </div>

            <div>
                <span>Outstanding</span>
                <strong>
                    ${formatCurrency(
                        booking.outstandingAmount ||
                        0
                    )}
                </strong>
            </div>
        `;
    }

    function generateInvoiceNumber() {

        const now =
            new Date();

        const date =
            now.getFullYear().toString() +
            String(
                now.getMonth() + 1
            ).padStart(2, "0") +
            String(
                now.getDate()
            ).padStart(2, "0");

        const random =
            Math.floor(
                1000 +
                Math.random() * 9000
            );

        return `INV-${date}-${random}`;
    }

    function generateInvoiceNumberFromBooking(
        booking
    ) {

        if (booking.invoiceNumber) {
            return booking.invoiceNumber;
        }

        return `INV-${String(
            booking.bookingNumber ||
            booking.id
        ).slice(-8)}`;
    }

    function getPaymentStatus(invoice) {

        const total =
            Number(
                invoice.totalAmount || 0
            );

        const paid =
            Number(
                invoice.paidAmount || 0
            );

        if (total <= 0) {
            return "pending";
        }

        if (paid >= total) {
            return "paid";
        }

        if (paid > 0) {
            return "partial";
        }

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

    function formatCurrency(value) {

        if (
            typeof HotelApp.formatCurrency ===
            "function"
        ) {
            return HotelApp.formatCurrency(
                Number(value || 0)
            );
        }

        return "₹" +
            Number(
                value || 0
            ).toLocaleString("en-IN");
    }

    function escapeHtml(value) {

        if (
            typeof HotelApp.escapeHtml ===
            "function"
        ) {
            return HotelApp.escapeHtml(
                String(value ?? "")
            );
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
            .replace(
                /[^a-zA-Z0-9_-]/g,
                ""
            );
    }

    function capitalize(value) {

        if (!value) return "";

        return String(value)
            .charAt(0)
            .toUpperCase() +
            String(value)
                .slice(1)
                .replace("-", " ");
    }

    return {
        render,
        refreshTable,
        openCreateInvoice,
        viewInvoice,
        openPayment,
        printInvoice
    };

})();