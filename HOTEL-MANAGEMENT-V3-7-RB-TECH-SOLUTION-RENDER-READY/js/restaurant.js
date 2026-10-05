/* =========================================================
   HOTEL MANAGEMENT SOFTWARE
   Restaurant / POS Module
   ========================================================= */

(function () {
  "use strict";

  const KEY_ORDERS = "restaurantOrders";
  const KEY_ITEMS = "restaurantItems";
  const KEY_ROOMS = "hotelRooms";
  const KEY_BOOKINGS = "hotelBookings";
  const KEY_INVOICES = "hotelInvoices";

  /* =========================================================
     STORAGE HELPERS
     ========================================================= */

  function readStorage(key, fallback) {
    try {
      if (
        window.HotelApp &&
        typeof HotelApp.getStorage === "function"
      ) {
        const data = HotelApp.getStorage(key, fallback);
        return Array.isArray(data) ? data : fallback;
      }

      const raw = localStorage.getItem(key);

      if (!raw) return fallback;

      const data = JSON.parse(raw);

      return Array.isArray(data) ? data : fallback;
    } catch (error) {
      console.error("Storage read error:", key, error);
      return fallback;
    }
  }

  function writeStorage(key, data) {
    try {
      if (
        window.HotelApp &&
        typeof HotelApp.setStorage === "function"
      ) {
        HotelApp.setStorage(key, data);
        return true;
      }

      localStorage.setItem(
        key,
        JSON.stringify(data)
      );

      return true;
    } catch (error) {
      console.error("Storage save error:", key, error);
      return false;
    }
  }

  function getOrders() {
    return readStorage(KEY_ORDERS, []);
  }

  function saveOrders(data) {
    return writeStorage(KEY_ORDERS, data);
  }

  function getMenuItems() {
    return readStorage(KEY_ITEMS, []);
  }

  function saveMenuItems(data) {
    return writeStorage(KEY_ITEMS, data);
  }

  function getRooms() {
    return readStorage(KEY_ROOMS, []);
  }

  function getBookings() {
    return readStorage(KEY_BOOKINGS, []);
  }

  function getInvoices() {
    return readStorage(KEY_INVOICES, []);
  }

  function saveInvoices(data) {
    return writeStorage(KEY_INVOICES, data);
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function money(value) {
    const amount = Number(value) || 0;

    if (
      window.HotelApp &&
      typeof HotelApp.formatCurrency === "function"
    ) {
      return HotelApp.formatCurrency(amount);
    }

    return "₹" + amount.toFixed(2);
  }

  function safe(value) {
    if (
      window.HotelApp &&
      typeof HotelApp.escapeHtml === "function"
    ) {
      return HotelApp.escapeHtml(
        value == null ? "" : String(value)
      );
    }

    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function today() {
    return new Date()
      .toISOString()
      .split("T")[0];
  }

  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .substring(2, 8)
    );
  }

  /* =========================================================
     BOOKINGS
     ========================================================= */

  function getActiveBookings() {
    return getBookings().filter(function (booking) {
      return (
        booking.status === "Booked" ||
        booking.status === "Checked-In"
      );
    });
  }

  function findBookingForRoom(roomNumber) {
    return getActiveBookings().find(function (booking) {
      return (
        String(booking.roomNumber) ===
        String(roomNumber)
      );
    });
  }

  /* =========================================================
     MAIN RENDER
     ========================================================= */

  function render(container) {
    if (!container) return;

    const orders = getOrders();
    const menuItems = getMenuItems();

    const todayOrders = orders.filter(function (order) {
      return (
        order.createdAt &&
        order.createdAt.split("T")[0] === today()
      );
    });

    const todaySales = todayOrders.reduce(
      function (sum, order) {
        return sum + Number(order.total || 0);
      },
      0
    );

    const unpaidRoomCharges =
      orders.filter(function (order) {
        return (
          order.chargeToRoom === true &&
          order.paymentStatus !== "Paid"
        );
      });

    const outstandingRoomCharges =
      unpaidRoomCharges.reduce(
        function (sum, order) {
          return sum + Number(order.total || 0);
        },
        0
      );

    container.innerHTML = `

      <div class="page-header">

        <div>
          <h2>Restaurant / POS</h2>

          <p class="muted">
            Restaurant menu, orders, room charges aur payments manage karein.
          </p>
        </div>

        <div class="page-header-actions">

          <button
            class="btn btn-secondary"
            onclick="Restaurant.showMenuManager()"
          >
            🍽 Menu Items
          </button>

          <button
            class="btn btn-primary"
            onclick="Restaurant.showOrderForm()"
          >
            + New Order
          </button>

        </div>

      </div>


      <div class="stats-grid">

        <div class="stat-card">

          <div class="stat-label">
            Today's Orders
          </div>

          <div class="stat-value">
            ${todayOrders.length}
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            Today's Restaurant Sales
          </div>

          <div class="stat-value">
            ${money(todaySales)}
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            Menu Items
          </div>

          <div class="stat-value">
            ${menuItems.length}
          </div>

        </div>


        <div class="stat-card">

          <div class="stat-label">
            Room Charge Outstanding
          </div>

          <div class="stat-value">
            ${money(outstandingRoomCharges)}
          </div>

        </div>

      </div>


      <div class="card">

        <div class="card-header">

          <div>
            <h3>Restaurant Orders</h3>

            <span class="muted">
              ${orders.length} total orders
            </span>
          </div>

          <div
            style="
              display:flex;
              gap:10px;
              flex-wrap:wrap;
            "
          >

            <input
              id="restaurantSearch"
              class="form-control"
              placeholder="Search order / room / guest..."
              oninput="Restaurant.filterOrders()"
              style="min-width:220px;"
            />

            <select
              id="restaurantPaymentFilter"
              class="form-control"
              onchange="Restaurant.filterOrders()"
            >

              <option value="">
                All Payments
              </option>

              <option value="Paid">
                Paid
              </option>

              <option value="Room Charge">
                Room Charge
              </option>

            </select>

          </div>

        </div>

        <div
          class="card-body"
          id="restaurantOrdersContainer"
        ></div>

      </div>

    `;

    renderTable(orders);
  }

  /* =========================================================
     MENU MANAGER
     ========================================================= */

  function showMenuManager() {
    const items = getMenuItems();

    const body = `

      <div style="margin-bottom:20px;">

        <button
          type="button"
          class="btn btn-primary"
          onclick="Restaurant.showAddMenuItem()"
        >
          + Add Restaurant Item
        </button>

      </div>


      <div id="restaurantMenuList">

        ${
          items.length
            ? items
                .map(function (item) {
                  return menuItemHtml(item);
                })
                .join("")
            : `
              <div class="empty-state">

                <div class="empty-state-icon">
                  🍽
                </div>

                <h3>No menu items</h3>

                <p>
                  + Add Restaurant Item par click karke item save karein.
                </p>

              </div>
            `
        }

      </div>

    `;

    HotelApp.openModal(
      "Restaurant Menu Items",
      body,
      {
        size: "large"
      }
    );
  }

  function menuItemHtml(item) {
    const active =
      item.active !== false;

    return `

      <div
        class="card"
        style="
          margin-bottom:12px;
          padding:14px;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            flex-wrap:wrap;
          "
        >

          <div>

            <strong>
              ${safe(item.name)}
            </strong>

            <div class="muted">
              Rate: ${money(item.rate)}
              |
              GST: ${Number(item.gst || 0)}%
            </div>

          </div>

          <div
            style="
              display:flex;
              gap:8px;
              align-items:center;
            "
          >

            <span
              class="badge ${
                active
                  ? "success"
                  : "secondary"
              }"
            >
              ${active ? "Active" : "Inactive"}
            </span>

            <button
              class="btn btn-sm btn-secondary"
              onclick="Restaurant.editMenuItem('${safe(item.id)}')"
            >
              Edit
            </button>

            <button
              class="btn btn-sm btn-danger"
              onclick="Restaurant.deleteMenuItem('${safe(item.id)}')"
            >
              Delete
            </button>

          </div>

        </div>

      </div>

    `;
  }

  function showAddMenuItem(existingId) {
    const items = getMenuItems();

    const existing = existingId
      ? items.find(function (item) {
          return item.id === existingId;
        })
      : null;

    const title = existing
      ? "Edit Restaurant Item"
      : "Add Restaurant Item";

    const body = `

      <form id="restaurantMenuForm">

        <div class="form-grid">

          <div class="form-group">

            <label>
              Item Name *
            </label>

            <input
              id="menuItemName"
              class="form-control"
              value="${safe(existing?.name || "")}"
              placeholder="e.g. Veg Thali"
              required
            />

          </div>


          <div class="form-group">

            <label>
              Rate *
            </label>

            <input
              id="menuItemRate"
              type="number"
              min="0"
              step="0.01"
              class="form-control"
              value="${Number(existing?.rate || 0)}"
              required
            />

          </div>


          <div class="form-group">

            <label>
              GST %
            </label>

            <input
              id="menuItemGst"
              type="number"
              min="0"
              step="0.01"
              class="form-control"
              value="${Number(existing?.gst || 0)}"
            />

          </div>


          <div class="form-group">

            <label>
              Status
            </label>

            <select
              id="menuItemActive"
              class="form-control"
            >

              <option
                value="true"
                ${
                  existing?.active !== false
                    ? "selected"
                    : ""
                }
              >
                Active
              </option>

              <option
                value="false"
                ${
                  existing?.active === false
                    ? "selected"
                    : ""
                }
              >
                Inactive
              </option>

            </select>

          </div>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="btn btn-secondary"
            onclick="Restaurant.showMenuManager()"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="btn btn-primary"
          >
            ${existing ? "Update Item" : "Save Item"}
          </button>

        </div>

      </form>

    `;

    HotelApp.openModal(
      title,
      body,
      {
        size: "medium"
      }
    );

    document
      .getElementById("restaurantMenuForm")
      ?.addEventListener(
        "submit",
        function (event) {
          event.preventDefault();

          saveMenuItem(existingId);
        }
      );
  }

  function saveMenuItem(existingId) {
    const name =
      document
        .getElementById("menuItemName")
        ?.value.trim();

    const rate =
      Number(
        document
          .getElementById("menuItemRate")
          ?.value
      ) || 0;

    const gst =
      Number(
        document
          .getElementById("menuItemGst")
          ?.value
      ) || 0;

    const active =
      document
        .getElementById("menuItemActive")
        ?.value === "true";

    if (!name) {
      HotelApp.showToast(
        "Item name required hai.",
        "error"
      );
      return;
    }

    if (rate <= 0) {
      HotelApp.showToast(
        "Item rate 0 se greater hona chahiye.",
        "error"
      );
      return;
    }

    const items = getMenuItems();

    const duplicate = items.find(function (item) {
      return (
        item.name.toLowerCase() ===
          name.toLowerCase() &&
        item.id !== existingId
      );
    });

    if (duplicate) {
      HotelApp.showToast(
        "Ye restaurant item already saved hai.",
        "error"
      );
      return;
    }

    if (existingId) {
      const index = items.findIndex(
        function (item) {
          return item.id === existingId;
        }
      );

      if (index !== -1) {
        items[index] = {
          ...items[index],
          name,
          rate,
          gst,
          active,
          updatedAt:
            new Date().toISOString()
        };
      }
    } else {
      items.push({
        id: uid("menu"),
        name,
        rate,
        gst,
        active: true,
        createdAt:
          new Date().toISOString()
      });
    }

    const saved = saveMenuItems(items);

    if (!saved) {
      HotelApp.showToast(
        "Menu item save nahi ho saka.",
        "error"
      );
      return;
    }

    HotelApp.showToast(
      existingId
        ? "Restaurant item update ho gaya."
        : "Restaurant item save ho gaya.",
      "success"
    );

    showMenuManager();
  }

  function editMenuItem(id) {
    showAddMenuItem(id);
  }

  function deleteMenuItem(id) {
    const items = getMenuItems();

    const item = items.find(function (x) {
      return x.id === id;
    });

    if (!item) return;

    if (
      !confirm(
        `"${item.name}" ko delete karna hai?`
      )
    ) {
      return;
    }

    const filtered = items.filter(
      function (x) {
        return x.id !== id;
      }
    );

    saveMenuItems(filtered);

    HotelApp.showToast(
      "Restaurant item delete ho gaya.",
      "success"
    );

    showMenuManager();
  }

  /* =========================================================
     NEW ORDER
     ========================================================= */

  function showOrderForm() {
    const rooms = getRooms();
    const activeBookings =
      getActiveBookings();

    const menuItems =
      getMenuItems().filter(function (item) {
        return item.active !== false;
      });

    HotelApp.openModal(
      "New Restaurant Order",
      `

        <form id="restaurantOrderForm">

          <div class="form-section">

            <h3>Order Details</h3>

            <div class="form-grid">

              <div class="form-group">

                <label>
                  Order Type
                </label>

                <select
                  id="restaurantOrderType"
                  class="form-control"
                  onchange="Restaurant.updateOrderCustomerFields()"
                >

                  <option value="Walk-in">
                    Walk-in
                  </option>

                  <option value="Room">
                    Hotel Guest / Room
                  </option>

                </select>

              </div>


              <div
                class="form-group"
                id="restaurantRoomGroup"
                style="display:none;"
              >

                <label>
                  Room *
                </label>

                <select
                  id="restaurantRoom"
                  class="form-control"
                  onchange="Restaurant.loadRoomGuest()"
                >

                  <option value="">
                    Select Room
                  </option>

                  ${rooms
                    .map(function (room) {

                      const roomNumber =
                        room.roomNumber ??
                        room.number ??
                        "";

                      const booking =
                        activeBookings.find(
                          function (b) {
                            return (
                              String(
                                b.roomNumber
                              ) ===
                              String(
                                roomNumber
                              )
                            );
                          }
                        );

                      return `
                        <option
                          value="${safe(roomNumber)}"
                          data-booking-id="${
                            booking
                              ? safe(booking.id)
                              : ""
                          }"
                          data-guest-name="${
                            booking
                              ? safe(
                                  booking.guestName
                                )
                              : ""
                          }"
                        >
                          Room ${safe(roomNumber)}
                          ${
                            booking
                              ? " - " +
                                safe(
                                  booking.guestName
                                )
                              : ""
                          }
                        </option>
                      `;
                    })
                    .join("")}

                </select>

              </div>


              <div
                class="form-group"
                id="restaurantGuestGroup"
                style="display:none;"
              >

                <label>
                  Guest Name
                </label>

                <input
                  id="restaurantGuestName"
                  class="form-control"
                  readonly
                />

              </div>

            </div>

          </div>


          <div class="form-section">

            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                margin-bottom:12px;
              "
            >

              <h3 style="margin:0;">
                Food Items
              </h3>

              <button
                type="button"
                class="btn btn-secondary"
                onclick="Restaurant.showMenuManagerFromOrder()"
              >
                ⚙ Manage Menu
              </button>

            </div>


            ${
              menuItems.length
                ? ""
                : `
                  <div class="alert alert-warning">
                    Pehle Menu Items me restaurant item save karein.
                  </div>
                `
            }


            <div id="restaurantItems"></div>


            <button
              type="button"
              class="btn btn-secondary"
              onclick="Restaurant.addItemRow()"
            >
              + Add Item
            </button>

          </div>


          <div class="form-section">

            <h3>Payment</h3>

            <div class="form-grid">

              <div class="form-group">

                <label>
                  Payment Type *
                </label>

                <select
                  id="restaurantPaymentType"
                  class="form-control"
                  onchange="Restaurant.updatePaymentFields()"
                >

                  <option value="Paid">
                    Pay Now
                  </option>

                  <option value="Room Charge">
                    Room Charge
                  </option>

                </select>

              </div>


              <div
                class="form-group"
                id="restaurantPaymentMethodGroup"
              >

                <label>
                  Payment Method
                </label>

                <select
                  id="restaurantPaymentMethod"
                  class="form-control"
                >

                  <option value="Cash">
                    Cash
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="Card">
                    Card
                  </option>

                  <option value="Bank">
                    Bank Transfer
                  </option>

                </select>

              </div>

            </div>


            <div id="restaurantPaymentInfo"></div>

          </div>


          <div class="form-section">

            <div class="form-grid">

              <div class="form-group">

                <label>
                  Total
                </label>

                <input
                  id="restaurantTotal"
                  class="form-control"
                  type="number"
                  value="0"
                  readonly
                />

              </div>

            </div>

          </div>


          <div class="form-actions">

            <button
              type="button"
              class="btn btn-secondary"
              onclick="HotelApp.closeModal()"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              Save Order
            </button>

          </div>

        </form>

      `,
      {
        size: "large"
      }
    );

    addItemRow();

    updateOrderCustomerFields();
    updatePaymentFields();

    document
      .getElementById("restaurantOrderForm")
      ?.addEventListener(
        "submit",
        function (event) {
          event.preventDefault();

          saveOrder();
        }
      );
  }

  /* =========================================================
     ORDER CUSTOMER
     ========================================================= */

  function updateOrderCustomerFields() {
    const type =
      document.getElementById(
        "restaurantOrderType"
      )?.value;

    const roomGroup =
      document.getElementById(
        "restaurantRoomGroup"
      );

    const guestGroup =
      document.getElementById(
        "restaurantGuestGroup"
      );

    if (!roomGroup || !guestGroup) return;

    if (type === "Room") {
      roomGroup.style.display = "block";
      guestGroup.style.display = "block";
    } else {
      roomGroup.style.display = "none";
      guestGroup.style.display = "none";

      const guest =
        document.getElementById(
          "restaurantGuestName"
        );

      if (guest) {
        guest.value = "";
      }
    }
  }

  function loadRoomGuest() {
    const roomSelect =
      document.getElementById(
        "restaurantRoom"
      );

    const guest =
      document.getElementById(
        "restaurantGuestName"
      );

    if (!roomSelect || !guest) return;

    const selected =
      roomSelect.options[
        roomSelect.selectedIndex
      ];

    guest.value =
      selected?.dataset?.guestName || "";

    const paymentType =
      document.getElementById(
        "restaurantPaymentType"
      );

    if (
      paymentType &&
      guest.value
    ) {
      paymentType.value =
        "Room Charge";

      updatePaymentFields();
    }
  }

  /* =========================================================
     ORDER ITEM ROW
     ========================================================= */

  function addItemRow() {
    const container =
      document.getElementById(
        "restaurantItems"
      );

    if (!container) return;

    const menuItems =
      getMenuItems().filter(function (item) {
        return item.active !== false;
      });

    const rowId =
      uid("food");

    const row =
      document.createElement("div");

    row.className =
      "form-grid restaurant-item-row";

    row.dataset.rowId =
      rowId;

    row.innerHTML = `

      <div class="form-group">

        <label>
          Item
        </label>

        <select
          class="form-control food-item-select"
          onchange="Restaurant.menuItemSelected(this)"
          required
        >

          <option value="">
            Select Item
          </option>

          ${menuItems
            .map(function (item) {
              return `
                <option
                  value="${safe(item.id)}"
                >
                  ${safe(item.name)}
                  - ${money(item.rate)}
                </option>
              `;
            })
            .join("")}

        </select>

        <input
          type="hidden"
          class="food-item-name"
        />

      </div>


      <div class="form-group">

        <label>
          Qty
        </label>

        <input
          type="number"
          class="form-control food-item-qty"
          min="1"
          value="1"
          oninput="Restaurant.calculateOrderTotal()"
          required
        />

      </div>


      <div class="form-group">

        <label>
          Rate
        </label>

        <input
          type="number"
          class="form-control food-item-rate"
          min="0"
          step="0.01"
          value="0"
          readonly
          required
        />

      </div>


      <div class="form-group">

        <label>
          GST %
        </label>

        <input
          type="number"
          class="form-control food-item-gst"
          min="0"
          step="0.01"
          value="0"
          readonly
        />

      </div>


      <div class="form-group">

        <label>
          Amount
        </label>

        <input
          type="number"
          class="form-control food-item-amount"
          readonly
          value="0"
        />

      </div>


      <div class="form-group">

        <label>&nbsp;</label>

        <button
          type="button"
          class="btn btn-danger"
          onclick="Restaurant.removeItemRow('${rowId}')"
        >
          Remove
        </button>

      </div>

    `;

    container.appendChild(row);

    calculateOrderTotal();
  }

  function menuItemSelected(select) {
    const row =
      select.closest(
        ".restaurant-item-row"
      );

    if (!row) return;

    const itemId =
      select.value;

    const item =
      getMenuItems().find(
        function (x) {
          return x.id === itemId;
        }
      );

    const name =
      row.querySelector(
        ".food-item-name"
      );

    const rate =
      row.querySelector(
        ".food-item-rate"
      );

    const gst =
      row.querySelector(
        ".food-item-gst"
      );

    if (!item) {
      if (name) name.value = "";
      if (rate) rate.value = 0;
      if (gst) gst.value = 0;
    } else {
      if (name) name.value = item.name;
      if (rate) rate.value = item.rate;
      if (gst) gst.value = item.gst || 0;
    }

    calculateOrderTotal();
  }

  function removeItemRow(rowId) {
    const row =
      document.querySelector(
        '[data-row-id="' +
          rowId +
          '"]'
      );

    if (row) {
      row.remove();
    }

    calculateOrderTotal();
  }

  /* =========================================================
     TOTAL
     ========================================================= */

  function calculateOrderTotal() {
    const rows =
      document.querySelectorAll(
        ".restaurant-item-row"
      );

    let total = 0;

    rows.forEach(function (row) {
      const qty =
        Number(
          row.querySelector(
            ".food-item-qty"
          )?.value
        ) || 0;

      const rate =
        Number(
          row.querySelector(
            ".food-item-rate"
          )?.value
        ) || 0;

      const gst =
        Number(
          row.querySelector(
            ".food-item-gst"
          )?.value
        ) || 0;

      const base =
        qty * rate;

      const gstAmount =
        base * gst / 100;

      const amount =
        base + gstAmount;

      const amountInput =
        row.querySelector(
          ".food-item-amount"
        );

      if (amountInput) {
        amountInput.value =
          amount.toFixed(2);
      }

      total += amount;
    });

    const totalInput =
      document.getElementById(
        "restaurantTotal"
      );

    if (totalInput) {
      totalInput.value =
        total.toFixed(2);
    }

    updatePaymentFields();
  }

  /* =========================================================
     PAYMENT FIELDS
     ========================================================= */

  function updatePaymentFields() {
    const paymentType =
      document.getElementById(
        "restaurantPaymentType"
      )?.value;

    const methodGroup =
      document.getElementById(
        "restaurantPaymentMethodGroup"
      );

    const info =
      document.getElementById(
        "restaurantPaymentInfo"
      );

    if (!methodGroup || !info) return;

    if (
      paymentType ===
      "Room Charge"
    ) {
      methodGroup.style.display =
        "none";

      info.innerHTML = `
        <div class="alert alert-warning">
          Ye amount guest ke room par charge hoga
          aur hotel invoice me automatically add hoga.
        </div>
      `;
    } else {
      methodGroup.style.display =
        "block";

      info.innerHTML = `
        <div class="alert alert-success">
          Restaurant payment receive ho jayega.
          Ye amount hotel invoice me outstanding nahi banega.
        </div>
      `;
    }
  }

  /* =========================================================
     SAVE ORDER
     ========================================================= */

  function saveOrder() {
    const orderType =
      document.getElementById(
        "restaurantOrderType"
      )?.value || "Walk-in";

    const roomNumber =
      document.getElementById(
        "restaurantRoom"
      )?.value || "";

    const guestName =
      document.getElementById(
        "restaurantGuestName"
      )?.value || "";

    const paymentType =
      document.getElementById(
        "restaurantPaymentType"
      )?.value || "Paid";

    const paymentMethod =
      document.getElementById(
        "restaurantPaymentMethod"
      )?.value || "";

    const rows =
      document.querySelectorAll(
        ".restaurant-item-row"
      );

    const items = [];

    rows.forEach(function (row) {
      const select =
        row.querySelector(
          ".food-item-select"
        );

      const name =
        row.querySelector(
          ".food-item-name"
        )?.value || "";

      const qty =
        Number(
          row.querySelector(
            ".food-item-qty"
          )?.value
        ) || 0;

      const rate =
        Number(
          row.querySelector(
            ".food-item-rate"
          )?.value
        ) || 0;

      const gst =
        Number(
          row.querySelector(
            ".food-item-gst"
          )?.value
        ) || 0;

      const amount =
        Number(
          row.querySelector(
            ".food-item-amount"
          )?.value
        ) || 0;

      if (
        select?.value &&
        name &&
        qty > 0 &&
        rate >= 0
      ) {
        items.push({
          menuItemId:
            select.value,
          name,
          qty,
          rate,
          gst,
          amount
        });
      }
    });

    if (!items.length) {
      HotelApp.showToast(
        "Kam se kam ek restaurant item select karein.",
        "error"
      );
      return;
    }

    if (
      orderType === "Room" &&
      !roomNumber
    ) {
      HotelApp.showToast(
        "Room select karein.",
        "error"
      );
      return;
    }

    const total =
      items.reduce(
        function (sum, item) {
          return (
            sum +
            Number(item.amount || 0)
          );
        },
        0
      );

    if (total <= 0) {
      HotelApp.showToast(
        "Order total valid nahi hai.",
        "error"
      );
      return;
    }

    const selectedRoom =
      document.getElementById(
        "restaurantRoom"
      )?.options[
        document.getElementById(
          "restaurantRoom"
        )?.selectedIndex
      ];

    const bookingId =
      selectedRoom?.dataset?.bookingId ||
      "";

    const order =
      {
        id: uid("order"),

        orderNumber:
          "RST-" +
          Date.now(),

        orderType,

        roomNumber:
          orderType === "Room"
            ? roomNumber
            : "",

        guestName:
          orderType === "Room"
            ? guestName
            : "",

        bookingId,

        items,

        subtotal:
          items.reduce(
            function (sum, item) {
              const base =
                Number(item.qty || 0) *
                Number(item.rate || 0);

              return sum + base;
            },
            0
          ),

        gst:
          items.reduce(
            function (sum, item) {
              const base =
                Number(item.qty || 0) *
                Number(item.rate || 0);

              return (
                sum +
                base *
                  Number(item.gst || 0) /
                  100
              );
            },
            0
          ),

        total,

        chargeToRoom:
          paymentType ===
          "Room Charge",

        paymentStatus:
          paymentType ===
          "Room Charge"
            ? "Pending"
            : "Paid",

        status:
          paymentType ===
          "Room Charge"
            ? "Pending"
            : "Paid",

        paymentMethod:
          paymentType ===
          "Room Charge"
            ? "Room Charge"
            : paymentMethod,

        paidAt:
          paymentType ===
          "Room Charge"
            ? null
            : new Date().toISOString(),

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString()
      };

    const orders =
      getOrders();

    orders.push(order);

    const saved =
      saveOrders(orders);

    if (!saved) {
      HotelApp.showToast(
        "Restaurant order save nahi hua.",
        "error"
      );
      return;
    }

    /* Room Charge → Hotel Invoice */
    if (
      order.chargeToRoom &&
      order.bookingId
    ) {
      addRoomChargeToInvoice(
        order
      );
    }

    HotelApp.closeModal();

    HotelApp.showToast(
      "Restaurant order save ho gaya.",
      "success"
    );

    const container =
      document.getElementById(
        "pageContainer"
      );

    if (container) {
      render(container);
    }
  }

  /* =========================================================
     ROOM CHARGE → INVOICE
     ========================================================= */

  function addRoomChargeToInvoice(order) {
    if (!order.bookingId) {
      return;
    }

    const invoices =
      getInvoices();

    let invoice =
      invoices.find(function (item) {
        return (
          item.bookingId ===
          order.bookingId
        );
      });

    if (!invoice) {
      return;
    }

    invoice.restaurantOrderIds =
      invoice.restaurantOrderIds || [];

    if (
      invoice.restaurantOrderIds.includes(
        order.id
      )
    ) {
      return;
    }

    invoice.restaurantOrderIds.push(
      order.id
    );

    invoice.restaurantAmount =
      Number(
        invoice.restaurantAmount || 0
      ) +
      Number(order.total || 0);

    invoice.items =
      invoice.items || [];

    invoice.items.push({
      type: "restaurant",
      description:
        "Restaurant Order " +
        order.orderNumber,
      amount:
        Number(order.total || 0)
    });

    invoice.subtotal =
      Number(invoice.roomAmount || 0) +
      Number(invoice.restaurantAmount || 0) +
      Number(invoice.otherAmount || 0);

    invoice.taxableAmount =
      Math.max(
        0,
        invoice.subtotal -
          Number(invoice.discount || 0)
      );

    invoice.total =
      invoice.taxableAmount +
      Number(invoice.gst || 0);

    invoice.balanceAmount =
      Math.max(
        0,
        invoice.total -
          Number(invoice.paidAmount || 0)
      );

    invoice.status =
      invoice.balanceAmount <= 0
        ? "Paid"
        : "Pending";

    invoice.updatedAt =
      new Date().toISOString();

    saveInvoices(invoices);
  }

  /* =========================================================
     RESTAURANT PAYMENT
     ========================================================= */

  function payRoomCharge(orderId) {
    const orders =
      getOrders();

    const order =
      orders.find(function (item) {
        return item.id === orderId;
      });

    if (!order) {
      HotelApp.showToast(
        "Order nahi mila.",
        "error"
      );
      return;
    }

    HotelApp.openModal(
      "Restaurant Payment",
      `

        <form id="restaurantPaymentForm">

          <div class="alert alert-warning">

            <strong>
              ${safe(order.orderNumber)}
            </strong>

            <br>

            Amount:
            <strong>
              ${money(order.total)}
            </strong>

          </div>


          <div class="form-group">

            <label>
              Payment Method
            </label>

            <select
              id="restaurantPayMethod"
              class="form-control"
            >

              <option value="Cash">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="Card">
                Card
              </option>

              <option value="Bank">
                Bank Transfer
              </option>

            </select>

          </div>


          <div class="form-group">

            <label>
              Note
            </label>

            <textarea
              id="restaurantPayNote"
              class="form-control"
              rows="3"
              placeholder="Payment note"
            ></textarea>

          </div>


          <div class="form-actions">

            <button
              type="button"
              class="btn btn-secondary"
              onclick="HotelApp.closeModal()"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="btn btn-primary"
            >
              Mark Paid
            </button>

          </div>

        </form>

      `,
      {
        size: "medium"
      }
    );

    document
      .getElementById(
        "restaurantPaymentForm"
      )
      ?.addEventListener(
        "submit",
        function (event) {
          event.preventDefault();

          const method =
            document.getElementById(
              "restaurantPayMethod"
            )?.value || "Cash";

          const note =
            document.getElementById(
              "restaurantPayNote"
            )?.value.trim() || "";

          order.paymentStatus =
            "Paid";

          order.status =
            "Paid";

          order.paymentMethod =
            method;

          order.paidAt =
            new Date().toISOString();

          order.paymentNote =
            note ||
            "Restaurant payment";

          order.updatedAt =
            new Date().toISOString();

          /*
           * Restaurant par payment receive ho gaya.
           * Hotel invoice me outstanding nahi rehna chahiye.
           */

          removeRoomChargeFromInvoice(
            order
          );

          saveOrders(orders);

          HotelApp.closeModal();

          HotelApp.showToast(
            "Restaurant payment receive ho gaya.",
            "success"
          );

          const container =
            document.getElementById(
              "pageContainer"
            );

          if (container) {
            render(container);
          }
        }
      );
  }

  /* =========================================================
     REMOVE PAID RESTAURANT CHARGE FROM INVOICE
     ========================================================= */

  function removeRoomChargeFromInvoice(order) {
    if (!order.bookingId) {
      return;
    }

    const invoices =
      getInvoices();

    const invoice =
      invoices.find(function (item) {
        return (
          item.bookingId ===
          order.bookingId
        );
      });

    if (!invoice) {
      return;
    }

    invoice.restaurantOrderIds =
      invoice.restaurantOrderIds || [];

    invoice.restaurantOrderIds =
      invoice.restaurantOrderIds.filter(
        function (id) {
          return id !== order.id;
        }
      );

    invoice.restaurantAmount =
      Math.max(
        0,
        Number(
          invoice.restaurantAmount || 0
        ) -
          Number(order.total || 0)
      );

    invoice.items =
      (invoice.items || []).filter(
        function (item) {
          return !(
            item.type === "restaurant" &&
            item.description ===
              "Restaurant Order " +
                order.orderNumber
          );
        }
      );

    invoice.subtotal =
      Number(invoice.roomAmount || 0) +
      Number(invoice.restaurantAmount || 0) +
      Number(invoice.otherAmount || 0);

    invoice.taxableAmount =
      Math.max(
        0,
        invoice.subtotal -
          Number(invoice.discount || 0)
      );

    invoice.total =
      invoice.taxableAmount +
      Number(invoice.gst || 0);

    invoice.balanceAmount =
      Math.max(
        0,
        invoice.total -
          Number(invoice.paidAmount || 0)
      );

    invoice.status =
      invoice.balanceAmount <= 0
        ? "Paid"
        : "Pending";

    invoice.updatedAt =
      new Date().toISOString();

    saveInvoices(invoices);
  }

  /* =========================================================
     ORDERS TABLE
     ========================================================= */

  function renderTable(orders) {
    const area =
      document.getElementById(
        "restaurantOrdersContainer"
      );

    if (!area) return;

    if (!orders.length) {
      area.innerHTML = `

        <div class="empty-state">

          <div class="empty-state-icon">
            🍽
          </div>

          <h3>
            No restaurant orders
          </h3>

          <p>
            New Order button se restaurant order create karein.
          </p>

        </div>

      `;

      return;
    }

    area.innerHTML = `

      <div class="table-responsive">

        <table class="data-table">

          <thead>

            <tr>

              <th>Order</th>
              <th>Room / Guest</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>

            </tr>

          </thead>


          <tbody>

            ${orders
              .slice()
              .reverse()
              .map(function (order) {

                const paymentLabel =
                  order.chargeToRoom
                    ? "Room Charge"
                    : order.paymentMethod ||
                      "Paid";

                const paymentStatus =
                  order.paymentStatus ||
                  "Paid";

                const statusClass =
                  paymentStatus ===
                  "Paid"
                    ? "success"
                    : "warning";

                return `

                  <tr>

                    <td>

                      <strong>
                        ${safe(
                          order.orderNumber ||
                            order.id
                        )}
                      </strong>

                      <br>

                      <small>
                        ${
                          order.createdAt
                            ? safe(
                                order.createdAt
                                  .replace(
                                    "T",
                                    " "
                                  )
                                  .substring(
                                    0,
                                    16
                                  )
                              )
                            : ""
                        }
                      </small>

                    </td>


                    <td>

                      ${
                        order.roomNumber
                          ? `
                            <strong>
                              Room ${safe(
                                order.roomNumber
                              )}
                            </strong>
                          `
                          : "Walk-in"
                      }

                      ${
                        order.guestName
                          ? `
                            <br>
                            <small>
                              ${safe(
                                order.guestName
                              )}
                            </small>
                          `
                          : ""
                      }

                    </td>


                    <td>
                      ${
                        order.items
                          ? order.items.length
                          : 0
                      }
                      item(s)
                    </td>


                    <td>

                      <strong>
                        ${money(
                          order.total
                        )}
                      </strong>

                    </td>


                    <td>
                      ${safe(
                        paymentLabel
                      )}
                    </td>


                    <td>

                      <span
                        class="badge ${statusClass}"
                      >
                        ${safe(
                          paymentStatus
                        )}
                      </span>

                    </td>


                    <td>

                      <div
                        class="action-buttons"
                      >

                        <button
                          class="btn btn-sm btn-secondary"
                          onclick="Restaurant.viewOrder('${safe(order.id)}')"
                        >
                          View
                        </button>

                        ${
                          order.chargeToRoom &&
                          paymentStatus !==
                            "Paid"
                            ? `
                              <button
                                class="btn btn-sm btn-primary"
                                onclick="Restaurant.payRoomCharge('${safe(order.id)}')"
                              >
                                Pay
                              </button>
                            `
                            : ""
                        }

                      </div>

                    </td>

                  </tr>

                `;
              })
              .join("")}

          </tbody>

        </table>

      </div>

    `;
  }

  /* =========================================================
     FILTER
     ========================================================= */

  function filterOrders() {
    const search =
      (
        document.getElementById(
          "restaurantSearch"
        )?.value || ""
      )
        .toLowerCase()
        .trim();

    const payment =
      document.getElementById(
        "restaurantPaymentFilter"
      )?.value || "";

    const orders =
      getOrders();

    const filtered =
      orders.filter(
        function (order) {

          const searchable = [
            order.id,
            order.orderNumber,
            order.roomNumber,
            order.guestName,
            ...(order.items || []).map(
              function (item) {
                return item.name;
              }
            )
          ]
            .join(" ")
            .toLowerCase();

          const searchMatch =
            !search ||
            searchable.includes(search);

          const paymentStatus =
            order.chargeToRoom
              ? "Room Charge"
              : order.paymentStatus ||
                "Paid";

          const paymentMatch =
            !payment ||
            paymentStatus === payment;

          return (
            searchMatch &&
            paymentMatch
          );
        }
      );

    renderTable(filtered);
  }

  /* =========================================================
     VIEW ORDER
     ========================================================= */

  function viewOrder(orderId) {
    const order =
      getOrders().find(
        function (item) {
          return item.id === orderId;
        }
      );

    if (!order) {
      HotelApp.showToast(
        "Order nahi mila.",
        "error"
      );
      return;
    }

    const itemsHtml =
      (order.items || [])
        .map(function (item) {
          return `
            <tr>

              <td>
                ${safe(item.name)}
              </td>

              <td>
                ${Number(item.qty || 0)}
              </td>

              <td>
                ${money(item.rate)}
              </td>

              <td>
                ${money(item.amount)}
              </td>

            </tr>
          `;
        })
        .join("");

    HotelApp.openModal(
      "Restaurant Order " +
        safe(order.orderNumber),
      `

        <div class="form-section">

          <p>
            <strong>Room:</strong>
            ${
              order.roomNumber
                ? safe(order.roomNumber)
                : "Walk-in"
            }
          </p>

          <p>
            <strong>Guest:</strong>
            ${
              order.guestName
                ? safe(order.guestName)
                : "-"
            }
          </p>

          <p>
            <strong>Payment:</strong>
            ${
              order.chargeToRoom
                ? "Room Charge"
                : safe(
                    order.paymentMethod ||
                      "Paid"
                  )
            }
          </p>

        </div>


        <div class="table-responsive">

          <table class="data-table">

            <thead>

              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>

            </thead>

            <tbody>

              ${itemsHtml}

            </tbody>

          </table>

        </div>


        <div
          style="
            text-align:right;
            margin-top:20px;
            font-size:20px;
          "
        >

          <strong>
            Total:
            ${money(order.total)}
          </strong>

        </div>

      `,
      {
        size: "large"
      }
    );
  }

  /* =========================================================
     MENU FROM ORDER
     ========================================================= */

  function showMenuManagerFromOrder() {
    showMenuManager();
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.Restaurant = {

    render,

    showOrderForm,

    showMenuManager,

    showMenuManagerFromOrder,

    showAddMenuItem,

    editMenuItem,

    deleteMenuItem,

    updateOrderCustomerFields,

    loadRoomGuest,

    addItemRow,

    removeItemRow,

    menuItemSelected,

    calculateOrderTotal,

    updatePaymentFields,

    filterOrders,

    viewOrder,

    payRoomCharge

  };

})();